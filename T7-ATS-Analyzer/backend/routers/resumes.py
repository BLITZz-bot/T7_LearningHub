"""
routers/resumes.py
Resume endpoints: upload, match, score, rewrite.
"""

import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from db.client import get_supabase
from services.parser import extract_text
from services.gemini import (DEFAULT_GENERATION_MODEL, embed_text, get_available_models,
                             model_access_error_message, parse_resume, rewrite_bullet)
from services.scoring import mechanical_score, content_score, build_score_summary
from services.matching import baseline_match, jd_overlay_match

router = APIRouter()


@router.get("/models")
async def list_models():
    return JSONResponse({"default": DEFAULT_GENERATION_MODEL, "models": get_available_models()})


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    role: str = Form(default="Software Developer"),
    experience_level: str = Form(default="Professional (Experienced)"),
    user_id: str = Form(default="anonymous"),
    model: str = Form(default=DEFAULT_GENERATION_MODEL),
):
    """
    POST /resumes/upload
    Full pipeline: parse → embed → mechanical score → content score → store.
    Returns resume_id + immediate scores.
    """
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 10MB")

    file_bytes = await file.read()
    mime = file.content_type or ""
    suffix = (file.filename or "").lower().rsplit(".", 1)[-1]
    is_pdf = suffix == "pdf" or "pdf" in mime.lower()
    is_docx = suffix == "docx" or "word" in mime.lower() or "docx" in mime.lower()
    if not (is_pdf or is_docx):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX resumes are supported")
    file_type = "pdf" if is_pdf else "docx"

    # 1. Extract raw text
    raw_text = extract_text(file_bytes, mime)
    if len(raw_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract readable text from this file. Try PDF or DOCX.")

    # 2. Parse with Gemini
    try:
        parsed = parse_resume(raw_text, model=model)
    except Exception as e:
        raise HTTPException(status_code=429, detail=model_access_error_message(e, model))

    # 3. Mechanical score (instant)
    mech = mechanical_score(file_type, raw_text, parsed)

    # 4. Content score (one Gemini call)
    try:
        cont = content_score(parsed, role, experience_level, model=model)
    except Exception as e:
        cont = {"quantification_score": 50, "formatting_score": 50, "weak_bullets": [], "formatting_issues": [], "seniority_notes": model_access_error_message(e, model)}

    # 5. Store resume in Supabase
    sb = get_supabase()
    resume_id = str(uuid.uuid4())
    insert_data = {
        "id": resume_id,
        "user_id": user_id,
        "raw_text": raw_text[:20000],
        "parsed_json": parsed,
        "file_name": file.filename,
        "file_type": file_type,
        "target_role": role,
        "generation_model": model,
    }
    try:
        sb.table("t7_resumes").insert(insert_data).execute()
    except Exception as e:
        if "generation_model" in str(e):
            insert_data.pop("generation_model", None)
            try:
                sb.table("t7_resumes").insert(insert_data).execute()
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"We could not save this resume: {str(e2)}")
        else:
            raise HTTPException(status_code=500, detail=f"We could not save this resume: {str(e)}")

    # 6. Embed and store skills
    skills = parsed.get("skills", [])
    for skill in skills[:30]:  # cap at 30 skills
        try:
            emb = embed_text(skill)
            sb.table("t7_resume_skills").insert({
                "id": str(uuid.uuid4()),
                "resume_id": resume_id,
                "skill_text": skill,
                "embedding": emb,
            }).execute()
        except Exception:
            pass

    # 7. Baseline taxonomy match
    match_result = baseline_match(resume_id, role, skills)

    # 8. Build final 4-score summary
    scores = build_score_summary(mech, cont, match_result.get("match_percentage", 0))

    # 9. Store scores
    try:
        sb.table("t7_scores").insert({
            "id": str(uuid.uuid4()),
            "resume_id": resume_id,
            "ats_parseability": scores["ats_parseability"],
            "impact_quantification": scores["impact_quantification"],
            "skill_match": scores["skill_match"],
            "formatting": scores["formatting"],
            "mechanical_checks": scores["mechanical_checks"],
            "weak_bullets": scores["weak_bullets"],
            "seniority_notes": scores["seniority_notes"],
        }).execute()
    except Exception:
        pass

    return JSONResponse({
        "resume_id": resume_id,
        "scores": scores,
        "parsed": parsed,
        "match": match_result,
        "target_role": role,
        "experience_level": experience_level,
    })


@router.post("/{resume_id}/match")
async def match_resume(resume_id: str, request: Request):
    """
    POST /resumes/{id}/match
    Body (JSON): { "jd_text": "...", "jd_only": false }
    Run taxonomy baseline + optional JD overlay.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    jd_text: str = body.get("jd_text", "")
    jd_only: bool = body.get("jd_only", False)

    sb = get_supabase()

    # Load resume
    try:
        r = sb.table("t7_resumes").select("target_role, parsed_json, generation_model").eq("id", resume_id).maybe_single().execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail="We could not load this resume. Please try again.")

    if not r.data:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume = r.data
    role = resume.get("target_role", "Software Developer")
    parsed = resume.get("parsed_json", {})
    skills = parsed.get("skills", [])

    results = {}

    if not jd_only:
        results["taxonomy"] = baseline_match(resume_id, role, skills)

    if jd_text.strip():
        results["jd_overlay"] = jd_overlay_match(resume_id, jd_text, skills, resume.get("generation_model"))

    return JSONResponse(results)


@router.get("/{resume_id}/score")
async def get_score(resume_id: str):
    """GET /resumes/{id}/score — return stored 4-category scores."""
    sb = get_supabase()
    r = sb.table("t7_scores").select("*").eq("resume_id", resume_id).order("computed_at", desc=True).limit(1).maybe_single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Scores not found for this resume")
    return JSONResponse(r.data)


@router.post("/{resume_id}/rewrite")
async def rewrite_resume_bullets(resume_id: str, request: Request):
    """
    POST /resumes/{id}/rewrite
    Generate hallucination-guarded rewrites ONLY for flagged weak bullets.
    """
    sb = get_supabase()
    
    # Try to get weak bullets from the request body first (supports local storage / no-DB mode)
    try:
        body = await request.json()
        weak_bullets = body.get("weak_bullets", [])
    except Exception:
        weak_bullets = []

    # Fallback to database if not provided in body
    if not weak_bullets:
        try:
            score_r = sb.table("t7_scores").select("weak_bullets").eq("resume_id", resume_id).order("computed_at", desc=True).limit(1).maybe_single().execute()
            if score_r.data:
                weak_bullets = score_r.data.get("weak_bullets") or []
        except Exception:
            pass

    if not weak_bullets:
        raise HTTPException(status_code=404, detail="No weak bullets provided or found in database.")

    # Get target role
    res_r = sb.table("t7_resumes").select("target_role, generation_model").eq("id", resume_id).maybe_single().execute()
    role = (res_r.data or {}).get("target_role", "Software Developer")
    model = (res_r.data or {}).get("generation_model", DEFAULT_GENERATION_MODEL)

    rewrites = []
    for item in weak_bullets[:10]:  # cap at 10 rewrites per call
        bullet = item.get("bullet", "")
        issue = item.get("issue", "")
        if not bullet:
            continue
        try:
            rw = rewrite_bullet(bullet, role, model=model)
            rewrites.append(rw)
        except Exception as e:
            rewrites.append({"original": bullet, "issue": issue, "error": "Unable to generate this suggestion. Please try again."})
            continue
            
        # Persist - isolated try/except so missing tables don't break functionality
        try:
            sb.table("t7_rewrites").insert({
                "id": str(uuid.uuid4()),
                "resume_id": resume_id,
                "original_bullet": rw.get("original", bullet),
                "issue": rw.get("issue", issue),
                "rewritten_bullet": rw.get("rewritten", ""),
                "reasoning": rw.get("reasoning", ""),
            }).execute()
        except Exception:
            pass

    return JSONResponse({"rewrites": rewrites, "count": len(rewrites)})

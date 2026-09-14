"""
services/matching.py
Two matching modes:
  1. Baseline: resume skills vs. canonical taxonomy for the target role (pgvector)
  2. JD overlay: resume skills vs. skills extracted from a pasted job description

Uses Supabase pgvector cosine similarity (threshold = 0.75).
"""

import uuid
from db.client import get_supabase
from services.gemini import embed_text, extract_skills_from_jd


SIMILARITY_THRESHOLD = 0.75  # tune from here as you collect data


def baseline_match(resume_id: str, role_category: str, resume_skills: list[str]) -> dict:
    """
    Compare resume skills against the canonical taxonomy for this role.
    Returns matched skills, missing skills, and match percentage.
    """
    sb = get_supabase()

    # Get all canonical skills for this role
    try:
        result = sb.table("t7_skill_taxonomy").select(
            "skill_name, embedding"
        ).eq("role_category", role_category).eq("status", "canonical").execute()
        taxonomy_skills = result.data or []
    except Exception:
        taxonomy_skills = []
    if not taxonomy_skills:
        return {
            "matched_skills": [],
            "missing_skills": [],
            "match_percentage": 0,
            "source": "taxonomy",
            "note": f"No canonical taxonomy found for '{role_category}' yet — run bootstrap first.",
        }

    # Get resume skill embeddings
    resume_skill_embeddings = []
    for skill in resume_skills:
        try:
            emb = embed_text(skill)
            resume_skill_embeddings.append({"skill": skill, "embedding": emb})
        except Exception:
            pass

    matched = []
    missing = []

    for tax_skill in taxonomy_skills:
        tax_emb = tax_skill.get("embedding")
        if not tax_emb:
            continue

        # Find highest cosine similarity to any resume skill
        best_sim = 0.0
        best_resume_skill = None
        for rs in resume_skill_embeddings:
            sim = _cosine_similarity(rs["embedding"], tax_emb)
            if sim > best_sim:
                best_sim = sim
                best_resume_skill = rs["skill"]

        if best_sim >= SIMILARITY_THRESHOLD:
            matched.append({
                "taxonomy_skill": tax_skill["skill_name"],
                "resume_skill": best_resume_skill,
                "similarity": round(best_sim, 3),
            })
        else:
            missing.append({
                "skill": tax_skill["skill_name"],
                "closest_in_resume": best_resume_skill,
                "similarity": round(best_sim, 3),
            })

    total = len(taxonomy_skills)
    match_pct = round(100 * len(matched) / total) if total > 0 else 0

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percentage": match_pct,
        "total_taxonomy_skills": total,
        "source": "taxonomy",
    }


def jd_overlay_match(
    resume_id: str,
    jd_text: str,
    resume_skills: list[str],
    model: str | None = None,
) -> dict:
    """
    Extract skills from a pasted JD, then compare against resume skills.
    Stored in t7_jd_matches for this resume.
    """
    sb = get_supabase()

    # Extract skills from JD
    jd_parsed = extract_skills_from_jd(jd_text, model=model)
    required = jd_parsed.get("required_skills", [])
    nice = jd_parsed.get("nice_to_have_skills", [])
    all_jd_skills = list(dict.fromkeys(required + nice))  # deduped, order preserved
    jd_role = jd_parsed.get("role_title", "")

    # Embed resume skills once
    resume_embeddings = []
    for skill in resume_skills:
        try:
            emb = embed_text(skill)
            resume_embeddings.append({"skill": skill, "embedding": emb})
        except Exception:
            pass

    matched = []
    missing = []

    for jd_skill in all_jd_skills:
        try:
            jd_emb = embed_text(jd_skill)
        except Exception:
            missing.append({"skill": jd_skill, "type": "required" if jd_skill in required else "nice-to-have"})
            continue

        best_sim = 0.0
        best_rs = None
        for rs in resume_embeddings:
            sim = _cosine_similarity(rs["embedding"], jd_emb)
            if sim > best_sim:
                best_sim = sim
                best_rs = rs["skill"]

        skill_type = "required" if jd_skill in required else "nice-to-have"
        if best_sim >= SIMILARITY_THRESHOLD:
            matched.append({"jd_skill": jd_skill, "resume_skill": best_rs, "similarity": round(best_sim, 3), "type": skill_type})
        else:
            missing.append({"skill": jd_skill, "type": skill_type, "similarity": round(best_sim, 3)})

    total = len(all_jd_skills)
    match_pct = round(100 * len(matched) / total) if total > 0 else 0

    # Persist to Supabase
    try:
        sb.table("t7_jd_matches").insert({
            "id": str(uuid.uuid4()),
            "resume_id": resume_id,
            "jd_text": jd_text[:5000],
            "jd_role": jd_role,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_percentage": match_pct,
        }).execute()
    except Exception as e:
        print(f"[matching] Warning: could not save jd_match to DB: {e}")

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percentage": match_pct,
        "total_jd_skills": total,
        "jd_role": jd_role,
        "source": "jd_overlay",
    }


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Pure-Python cosine similarity between two vectors."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(x * x for x in b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

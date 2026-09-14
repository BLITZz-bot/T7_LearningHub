"""
services/scoring.py
Two independent scoring layers — NEVER blended into one number.

Layer 1: mechanical_score() — instant, pure Python, no LLM
Layer 2: content_score()   — one Gemini call per resume

Final output: 4 separate scores:
  - ats_parseability       (mechanical)
  - impact_quantification  (content)
  - skill_match            (computed from matching engine)
  - formatting             (content)
"""

from services.gemini import score_content as gemini_score_content


def mechanical_score(file_type: str, raw_text: str, parsed: dict) -> dict:
    """
    Instant rule-based ATS parseability check.
    No LLM call. Runs in milliseconds.
    Returns score (0-100) and individual boolean checks.
    """
    word_count = len(raw_text.split())
    contact = parsed.get("contact", {})
    experience = parsed.get("experience", [])
    education = parsed.get("education", [])
    skills = parsed.get("skills", [])

    checks = {
        "valid_file_type": file_type.lower() in ("pdf", "docx", "doc"),
        "text_extracted": len(raw_text.strip()) > 200,
        "has_email": bool(contact.get("email", "").strip()),
        "has_name": bool(contact.get("name", "").strip()),
        "has_phone": bool(contact.get("phone", "").strip()),
        "has_experience_section": len(experience) > 0,
        "has_education_section": len(education) > 0,
        "has_skills_section": len(skills) > 0,
        "reasonable_length": 250 <= word_count <= 1500,
        "not_too_short": word_count >= 100,
    }

    passed = sum(1 for v in checks.values() if v)
    score = int(100 * passed / len(checks))

    return {
        "score": score,
        "checks": checks,
        "word_count": word_count,
    }


def content_score(resume_json: dict, target_role: str = "", model: str | None = None) -> dict:
    """
    One Gemini call to evaluate content quality:
    - Impact & quantification of bullets
    - ATS formatting issues
    Returns quantification_score (0-100), formatting_score (0-100),
    weak_bullets list, and seniority notes.
    """
    result = gemini_score_content(resume_json, target_role, model)
    return {
        "quantification_score": result.get("quantification_score", 50),
        "formatting_score": result.get("formatting_score", 50),
        "weak_bullets": result.get("weak_bullets", []),
        "formatting_issues": result.get("formatting_issues", []),
        "seniority_notes": result.get("seniority_notes", ""),
    }


def build_score_summary(
    mechanical: dict,
    content: dict,
    skill_match_pct: float = 0.0,
) -> dict:
    """
    Assemble the final 4-category score object.
    skill_match_pct comes from the matching engine.
    """
    return {
        "ats_parseability": mechanical["score"],
        "impact_quantification": content["quantification_score"],
        "skill_match": round(skill_match_pct),
        "formatting": content["formatting_score"],
        "mechanical_checks": mechanical["checks"],
        "weak_bullets": content["weak_bullets"],
        "formatting_issues": content["formatting_issues"],
        "seniority_notes": content["seniority_notes"],
        "word_count": mechanical.get("word_count", 0),
    }

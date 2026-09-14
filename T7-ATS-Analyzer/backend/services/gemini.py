"""
services/gemini.py
All Gemini API calls: parse, score, embed, rewrite, extract JD skills.

Primary model: gemini-3.1-pro-preview (requires billing — highest quality)
Embedding:      gemini-embedding-001 (768 dims, always free)

The implementation deliberately uses one generation model only. Gemini 2.5
is retired and must not be used as a fallback.
"""

import os
import json
import time
from google import genai
from google.genai import types
import config
from config import get_env

_client: genai.Client | None = None

# ── Model constants ──────────────────────────────────────────────────────────
DEFAULT_GENERATION_MODEL = "gemini-3.6-flash"
FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
]
GENERATION_MODELS = {
    "gemini-3.6-flash": "Gemini 3.6 Flash — Default (Balanced)",
    "gemini-3.5-flash": "Gemini 3.5 Flash — Stable Fallback",
    "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite — Fast & High Quota",
    "gemini-3.7-flash": "Gemini 3.7 Flash",
    "gemini-3.8-flash": "Gemini 3.8 Flash (High Demand)",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview (Paid Tier)",
}
MODEL_EMBED    = "gemini-embedding-001"     # embeddings — always free
EMBED_DIMS     = 768


# ── JSON Schemas ─────────────────────────────────────────────────────────────

RESUME_SCHEMA = {
    "type": "object",
    "properties": {
        "contact": {
            "type": "object",
            "properties": {
                "name":     {"type": "string"},
                "email":    {"type": "string"},
                "phone":    {"type": "string"},
                "linkedin": {"type": "string"},
                "github":   {"type": "string"},
                "location": {"type": "string"},
            },
        },
        "summary": {"type": "string"},
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title":   {"type": "string"},
                    "company": {"type": "string"},
                    "dates":   {"type": "string"},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "degree":      {"type": "string"},
                    "institution": {"type": "string"},
                    "year":        {"type": "string"},
                    "cgpa":        {"type": "string"},
                },
            },
        },
        "skills":           {"type": "array", "items": {"type": "string"}},
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name":         {"type": "string"},
                    "description":  {"type": "string"},
                    "technologies": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
        "certifications": {"type": "array", "items": {"type": "string"}},
    },
}

CONTENT_SCORE_SCHEMA = {
    "type": "object",
    "properties": {
        "quantification_score": {"type": "integer"},
        "weak_bullets": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "bullet": {"type": "string"},
                    "issue":  {"type": "string"},
                },
            },
        },
        "seniority_notes":  {"type": "string"},
        "formatting_score": {"type": "integer"},
        "formatting_issues": {"type": "array", "items": {"type": "string"}},
    },
}

REWRITE_SCHEMA = {
    "type": "object",
    "properties": {
        "original":   {"type": "string"},
        "issue":      {"type": "string"},
        "rewritten":  {"type": "string"},
        "reasoning":  {"type": "string"},
    },
}

JD_SKILLS_SCHEMA = {
    "type": "object",
    "properties": {
        "required_skills":    {"type": "array", "items": {"type": "string"}},
        "nice_to_have_skills": {"type": "array", "items": {"type": "string"}},
        "role_title":         {"type": "string"},
        "experience_years":   {"type": "string"},
    },
}


# ── Client ───────────────────────────────────────────────────────────────────

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        key = get_env("GEMINI_API_KEY")
        if not key:
            raise ValueError("GEMINI_API_KEY is not set in environment (.env).")
        _client = genai.Client(api_key=key)
    return _client


def get_available_models() -> list[dict[str, str]]:
    return [{"id": model, "label": label} for model, label in GENERATION_MODELS.items()]


def _resolve_model(model: str | None) -> str:
    selected = model or DEFAULT_GENERATION_MODEL
    if selected not in GENERATION_MODELS:
        raise ValueError("Unsupported Gemini model selected")
    return selected


def model_access_error_message(exc: Exception, model: str | None) -> str:
    """Turn Gemini quota failures into an actionable, non-sensitive message."""
    message = str(exc).lower()
    selected = _resolve_model(model)
    if "429" in message or "resource_exhausted" in message or "quota" in message:
        if "pro" in selected:
            return (
                "Subscribe to pro model"
            )
        return (
            f"{GENERATION_MODELS[selected]} is currently unavailable. "
            "Please choose another Flash model or try again later."
        )
    return f"Gemini request failed using {GENERATION_MODELS[selected]}. Please try again."


# ── Core JSON generation with auto-fallback ───────────────────────────────────

def _generate_json(
    contents: str,
    schema: dict,
    temperature: float = 0.1,
    retry_delay: float = 0.0,
    model: str | None = None,
) -> dict:
    """
    Call Gemini with structured JSON output, with automatic fallback across models.
    Tries requested model -> gemini-3.6-flash -> gemini-3.5-flash -> gemini-3.1-flash-lite.
    """
    client = _get_client()
    if retry_delay > 0:
        time.sleep(retry_delay)

    primary = _resolve_model(model)
    candidates = [primary]
    for fb in FALLBACK_MODELS:
        if fb not in candidates:
            candidates.append(fb)

    last_error: Exception | None = None
    for candidate in candidates:
        try:
            response = client.models.generate_content(
                model=candidate,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=temperature,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            last_error = e
            print(f"[gemini] Model '{candidate}' failed: {e}. Attempting fallback...")
            continue

    if last_error is not None:
        raise last_error
    raise RuntimeError("Gemini did not return a response.")


# ── Public API functions ──────────────────────────────────────────────────────

def parse_resume(raw_text: str, model: str | None = None) -> dict:
    """Extract structured resume data from raw text using Gemini JSON schema."""
    return _generate_json(
        contents=(
            "Extract structured resume data from this resume text. "
            "Be thorough and accurate. Extract ALL skills, ALL experience bullets, "
            "ALL education entries.\n\n"
            f"{raw_text[:15000]}"
        ),
        schema=RESUME_SCHEMA,
        temperature=0.1,
        model=model,
    )


def embed_text(text: str) -> list[float]:
    """Generate a 768-dim embedding for the given text (always uses gemini-embedding-001)."""
    client = _get_client()
    result = client.models.embed_content(
        model=MODEL_EMBED,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=EMBED_DIMS),
    )
    return result.embeddings[0].values


def score_content(resume_json: dict, target_role: str = "", model: str | None = None) -> dict:
    """Content scoring: quantification, weak bullets, formatting. One Gemini call."""
    role_ctx = f" The target role is: {target_role}." if target_role else ""
    return _generate_json(
        contents=(
            f"Evaluate this resume for impact quantification, weak action verbs, "
            f"seniority-appropriate language, and ATS formatting.{role_ctx} "
            f"Flag ALL weak/vague bullets with specific issues. "
            f"Give quantification_score (0-100) and formatting_score (0-100). "
            f"Resume JSON:\n{json.dumps(resume_json)}"
        ),
        schema=CONTENT_SCORE_SCHEMA,
        temperature=0.2,
        model=model,
    )


def rewrite_bullet(bullet: str, role_context: str, model: str | None = None) -> dict:
    """
    Hallucination-guarded bullet rewrite.
    NEVER invents metrics — uses [ADD: metric] placeholder instead.
    """
    prompt = (
        "You are an expert ATS resume editor. Rewrite this bullet point to be "
        "achievement-oriented, action-verb-led, and quantified where possible. "
        "CRITICAL RULE: NEVER invent numbers, metrics, percentages, or outcomes "
        "that were not in the original text. If no metric exists, add a placeholder "
        "like [ADD: team size], [ADD: % improvement], or [ADD: number of users] "
        "instead of fabricating one. "
        f"Target role: {role_context}\n"
        f"Original bullet: {bullet}"
    )
    return _generate_json(
        contents=prompt,
        schema=REWRITE_SCHEMA,
        temperature=0.3,
        model=model,
    )


def extract_skills_from_jd(jd_text: str, model: str | None = None) -> dict:
    """Extract required and nice-to-have skills from a job description."""
    return _generate_json(
        contents=(
            "Extract all technical and soft skills mentioned in this job description. "
            "Separate required/must-have from nice-to-have/preferred. "
            f"Job description:\n{jd_text[:8000]}"
        ),
        schema=JD_SKILLS_SCHEMA,
        temperature=0.1,
        model=model,
    )


def extract_skills_from_posting(jd_text: str, model: str | None = None) -> list[str]:
    """Extract a flat, deduplicated skill list from a job posting (for taxonomy mining)."""
    result = extract_skills_from_jd(jd_text, model=model)
    skills = result.get("required_skills", []) + result.get("nice_to_have_skills", [])
    seen: set[str] = set()
    normalized: list[str] = []
    for s in skills:
        s = s.strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            normalized.append(s)
    return normalized

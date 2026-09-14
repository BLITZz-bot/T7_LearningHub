# ATS resume analyzer — complete build guide (Gemini-powered)

This covers everything discussed: structural parsing, dual scoring layers, taxonomy + JD matching, hallucination-guarded rewrites, and a self-updating market-data taxonomy — all wired to Gemini.

One timing note before anything else: **Gemini 2.5 models (pro/flash/flash-lite) are scheduled to shut down October 16, 2026** — a month from now. Don't build against them. Use Gemini 3.5 Flash (GA since May 2026, their strongest model for agentic/structured tasks — also the model behind the `gemini-flash-latest` alias) or `gemini-3.1-flash-lite` (GA, optimized for cost/speed on high-volume calls like taxonomy mining).

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Backend | Python + FastAPI |
| LLM (parsing, scoring, rewrites) | `gemini-3.5-flash` |
| LLM (bulk/cheap tasks — taxonomy mining) | `gemini-3.1-flash-lite` |
| Embeddings | `gemini-embedding-001` (768 dims via MRL — good quality/storage balance) |
| Database | PostgreSQL + `pgvector` extension |
| File parsing | `pdfplumber` (PDF), `python-docx` (DOCX), `pytesseract` (OCR fallback) |
| Job postings feed | Adzuna API (free tier) or JSearch via RapidAPI |
| SDK | `google-genai` (Python) |

---

## 2. Database schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  raw_text TEXT,
  parsed_json JSONB,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE resume_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  skill_text TEXT,
  embedding VECTOR(768),
  source_bullet TEXT
);

CREATE TABLE skill_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_category TEXT,
  skill_name TEXT UNIQUE,
  embedding VECTOR(768),
  frequency_30d INT DEFAULT 0,
  frequency_90d INT DEFAULT 0,
  status TEXT DEFAULT 'candidate'  -- candidate | canonical | declining
);

CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,
  role_title TEXT,
  raw_description TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE jd_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  jd_text TEXT,
  matched_skills JSONB,
  missing_skills JSONB,
  match_percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scores (
  resume_id UUID REFERENCES resumes(id),
  ats_parseability NUMERIC,
  impact_quantification NUMERIC,
  skill_match NUMERIC,
  formatting NUMERIC,
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  original_bullet TEXT,
  issue TEXT,
  rewritten_bullet TEXT,
  reasoning TEXT
);
```

---

## 3. Stage 1 — ingestion & parsing

Extract raw text with `pdfplumber`/`python-docx` first (fall back to `pytesseract` if the extracted text is near-empty — that means it's a scanned/image PDF). Then hand the raw text to Gemini with a schema-constrained extraction call so the model returns clean, structured JSON instead of you regexing inconsistent layouts.

```python
from google import genai
from google.genai import types
import json

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")

RESUME_SCHEMA = {
  "type": "object",
  "properties": {
    "contact": {"type": "object"},
    "summary": {"type": "string"},
    "experience": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {"type": "string"},
          "company": {"type": "string"},
          "dates": {"type": "string"},
          "bullets": {"type": "array", "items": {"type": "string"}}
        }
      }
    },
    "education": {"type": "array", "items": {"type": "object"}},
    "skills": {"type": "array", "items": {"type": "string"}},
    "certifications": {"type": "array", "items": {"type": "string"}}
  }
}

def parse_resume(raw_text: str) -> dict:
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=f"Extract structured resume data from this text:\n\n{raw_text}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESUME_SCHEMA,
        )
    )
    return json.loads(response.text)
```

Check the current `google-genai` docs for exact schema/config syntax before you code this against a live SDK version — the shape above is the stable pattern, but SDKs shift field names occasionally.

---

## 4. Stage 2 — skill extraction & embedding

Embed every extracted skill and every bullet point so they're comparable to the taxonomy and to a pasted JD.

```python
def embed_text(text: str, dims: int = 768) -> list[float]:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=dims)
    )
    return result.embeddings[0].values
```

Store each vector in `resume_skills.embedding`.

---

## 5. Stage 3 — matching engine (taxonomy baseline + JD overlay)

**Baseline (always runs):** compare resume skill embeddings against the canonical taxonomy for the detected role using pgvector's cosine-distance operator.

```sql
SELECT skill_name, 1 - (embedding <=> $1) AS similarity
FROM skill_taxonomy
WHERE role_category = $2 AND status = 'canonical'
ORDER BY embedding <=> $1
LIMIT 20;
```

Anything in the taxonomy with similarity below your threshold (start at ~0.75, tune from there) to every resume skill goes on the gap list.

**JD overlay (when a JD is pasted):** run the same extraction schema on the JD text to pull required skills, embed them, and run the same comparison against the resume — but scoped only to this posting rather than the whole taxonomy. Store the result in `jd_matches`.

---

## 6. Stage 4 — scoring (two separate layers, never blended)

**Mechanical layer — pure code, no LLM call, runs instantly:**

```python
def mechanical_score(file_type: str, raw_text: str, parsed: dict) -> dict:
    checks = {
        "valid_file_type": file_type in ("pdf", "docx"),
        "text_extracted": len(raw_text.strip()) > 200,
        "has_contact_info": bool(parsed.get("contact", {}).get("email")),
        "standard_sections_present": all(
            k in parsed for k in ("experience", "education", "skills")
        ),
        "reasonable_length": 300 <= len(raw_text.split()) <= 1200,
    }
    score = int(100 * sum(checks.values()) / len(checks))
    return {"score": score, "checks": checks}
```

**Content layer — one Gemini call per resume:**

```python
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
          "issue": {"type": "string"}
        }
      }
    },
    "seniority_notes": {"type": "string"}
  }
}

def score_content(resume_json: dict) -> dict:
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=(
            "Evaluate this resume for impact, quantification, and "
            f"seniority-appropriate language. Flag weak bullets with "
            f"reasons. Resume: {json.dumps(resume_json)}"
        ),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CONTENT_SCORE_SCHEMA
        )
    )
    return json.loads(response.text)
```

Present four separate scores in the UI: **ATS parseability**, **impact/quantification**, **skill/JD match**, **formatting**. Never collapse them into one number.

---

## 7. Stage 5 — rewrite generation (hallucination-guarded)

Only run this on bullets the content layer flagged as weak — saves calls and keeps output focused.

```python
REWRITE_SCHEMA = {
  "type": "object",
  "properties": {
    "original": {"type": "string"},
    "issue": {"type": "string"},
    "rewritten": {"type": "string"},
    "reasoning": {"type": "string"}
  }
}

def rewrite_bullet(bullet: str, role_context: str) -> dict:
    prompt = (
        "You are an expert resume editor. Rewrite this bullet point to be "
        "achievement-oriented and quantified. CRITICAL: never invent numbers, "
        "metrics, or outcomes that weren't in the original — if no metric "
        "exists, add a placeholder like [ADD: team size] instead of "
        f"fabricating one.\n\nRole context: {role_context}\nBullet: {bullet}"
    )
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=REWRITE_SCHEMA
        )
    )
    return json.loads(response.text)
```

---

## 8. Auto-updating taxonomy pipeline (market grounding)

This is what makes the tool genuinely different from Jobscan/Rezi — it stays current without you manually maintaining a skill list.

```python
def refresh_taxonomy_for_role(role: str):
    postings = fetch_postings_from_adzuna(role)
    for posting in postings:
        skills = extract_skills_from_posting(posting["description"])
        for skill in skills:
            normalize_and_upsert_skill(skill, role)

def normalize_and_upsert_skill(skill_text: str, role: str):
    emb = embed_text(skill_text)
    existing = find_similar_taxonomy_entry(emb, threshold=0.92)
    if existing:
        increment_frequency(existing["id"])
    else:
        insert_candidate_skill(skill_text, emb, role)

def promote_candidates():
    # Run daily: a candidate becomes "canonical" only after crossing a
    # frequency threshold across several distinct postings/companies —
    # this stops one company's internal jargon from polluting the taxonomy.
    ...
```

Route new candidates through a small review queue before they go live — cheap insurance against a bad LLM extraction turning into a permanent taxonomy entry. Run this job on a schedule (APScheduler in-process, or a cron-triggered script) every few days, not continuously.

---

## 9. API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/resumes/upload` | Parse + store a resume |
| POST | `/resumes/{id}/match` | Run taxonomy baseline, optionally with a pasted JD |
| GET | `/resumes/{id}/score` | Return the four category scores |
| POST | `/resumes/{id}/rewrite` | Generate rewrites for flagged bullets |
| GET | `/taxonomy/{role}` | Inspect current canonical skills for a role |
| POST | `/admin/taxonomy/refresh` | Manually trigger a taxonomy refresh |

---

## 10. Build order (do it in this sequence)

1. Set up Postgres + pgvector, run the schema above
2. Build the upload → parse → structured JSON endpoint; test on 5–10 real resumes before moving on
3. Add embedding generation for resume skills; confirm vectors store and query correctly
4. Manually seed the taxonomy from O*NET/ESCO for 2–3 target roles (don't automate this yet)
5. Build baseline matching — return a skill-gap list against the seeded taxonomy
6. Add the mechanical scoring layer (ship this first — it's free and instant)
7. Add the content scoring layer (first real LLM-quality checkpoint)
8. Add the JD-paste overlay matching
9. Add rewrite generation for flagged bullets only
10. Wire up the Adzuna fetch + taxonomy normalization job — run it manually a few times before scheduling it
11. Add the review queue for taxonomy promotions
12. Polish: category-score UI, before/after rewrite display

Each step is independently testable — don't move to the next until the current one works on real data.
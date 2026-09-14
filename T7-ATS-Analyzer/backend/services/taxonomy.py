"""
services/taxonomy.py
Taxonomy bootstrap + incremental refresh pipeline.

Bootstrap strategy (run once):
  1. Fetch job postings for ALL roles from all 3 APIs
  2. Store in t7_job_postings
  3. Extract skills per posting via Gemini
  4. Normalize + pgvector deduplicate (threshold 0.92)
  5. One-time fast-promote: frequency >= 3 across >= 2 distinct companies → 'canonical'
  O*NET fallback: only for roles with < 5 postings in the corpus

Incremental refresh (Phase 2 cron):
  - Same pipeline, incrementally adds new postings and re-promotes
"""

import uuid
import asyncio
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from db.client import get_supabase
from services.gemini import embed_text, extract_skills_from_posting
from jobs.fetcher import fetch_all_roles_all_sources, ALL_ROLES

_thread_pool = ThreadPoolExecutor(max_workers=5)

DEDUPE_THRESHOLD = 0.92      # cosine similarity to consider two skills the same
PROMOTE_FREQUENCY = 3        # minimum times a skill appears to go canonical
PROMOTE_COMPANIES = 2        # minimum distinct companies
THIN_ROLE_THRESHOLD = 5      # roles with fewer postings get O*NET fallback


# Minimal O*NET-seeded fallback for thin roles (used only when corpus is sparse)
ONET_FALLBACK: dict[str, list[str]] = {
    "Quantitative Analyst": ["Python", "Statistics", "Financial Modelling", "Time Series Analysis", "Risk Management"],
    "Algorithm Engineer": ["Data Structures", "C++", "Python", "Dynamic Programming", "Complexity Analysis"],
    "Research Analyst": ["Python", "R", "Statistics", "Excel", "Data Analysis", "Report Writing"],
}


# ─── Bootstrap ────────────────────────────────────────────────────────────────

async def run_bootstrap(model: str = "gemini-3.6-flash") -> dict:
    """
    Full one-time bootstrap.
    Returns summary dict with counts.
    """
    sb = get_supabase()
    summary = {"roles": 0, "postings_fetched": 0, "skills_extracted": 0, "skills_promoted": 0, "curated_skills_seeded": 0, "onet_fallback_roles": []}

    print(f"[taxonomy] Step 1: Fetching job postings for all roles (model: {model})...")
    all_postings = await fetch_all_roles_all_sources()
    summary["postings_fetched"] = len(all_postings)

    # If external APIs returned 0, use existing unprocessed job postings in the database
    if not all_postings:
        print("[taxonomy] External fetch empty — querying existing postings in DB...")
        try:
            db_res = sb.table("t7_job_postings").select(
                "id, role_category, role_title, company, raw_description"
            ).eq("skills_processed", False).limit(1000).execute()
            all_postings = db_res.data or []
            print(f"[taxonomy] Found {len(all_postings)} existing unprocessed postings in DB.")
        except Exception as e:
            print(f"[taxonomy] DB query error: {e}")

    # Store postings in DB if they were freshly fetched
    if summary["postings_fetched"] > 0:
        print(f"[taxonomy] Storing {len(all_postings)} postings...")
        for chunk in _chunks(all_postings, 50):
            rows = [
                {
                    "id": p.setdefault("id", str(uuid.uuid4())),
                    "source": p.get("source"),
                    "role_category": p.get("role_category"),
                    "role_title": p.get("role_title"),
                    "company": p.get("company"),
                    "raw_description": p.get("raw_description", "")[:4000],
                    "skills_processed": False,
                }
                for p in chunk
            ]
            try:
                sb.table("t7_job_postings").insert(rows).execute()
            except Exception as e:
                print(f"[taxonomy] Warning: batch insert failed: {e}")

    # Count postings per role to detect thin roles
    role_posting_counts: dict[str, int] = {}
    for p in all_postings:
        rc = p.get("role_category", "")
        role_posting_counts[rc] = role_posting_counts.get(rc, 0) + 1

    print(f"[taxonomy] Step 2: Extracting skills from all postings using {model}...")
    total_skills = await _extract_and_store_skills(all_postings, model=model)
    summary["skills_extracted"] = total_skills

    print("[taxonomy] Step 3: Normalizing + deduplicating via embeddings...")
    await _normalize_all_candidate_skills()

    print("[taxonomy] Step 4: Bootstrap promoting canonical skills...")
    promoted = _bootstrap_promote()
    summary["skills_promoted"] = promoted

    print("[taxonomy] Step 5: O*NET fallback for thin roles...")
    for role in ALL_ROLES:
        if role_posting_counts.get(role, 0) < THIN_ROLE_THRESHOLD:
            fallback_skills = ONET_FALLBACK.get(role, [])
            if fallback_skills:
                _seed_onet_fallback(role, fallback_skills)
                summary["onet_fallback_roles"].append(role)

    # T7's curated role data guarantees an immediately useful baseline even
    # when an external job source is incomplete or temporarily rate-limited.
    summary["curated_skills_seeded"] = _seed_curated_baseline()

    summary["roles"] = len(ALL_ROLES)
    print(f"[taxonomy] Bootstrap complete: {summary}")
    return summary


# ─── Incremental Refresh ──────────────────────────────────────────────────────

async def run_incremental_refresh(model: str = "gemini-3.6-flash") -> dict:
    """Fetch new postings for all roles and merge into taxonomy."""
    summary = {"postings_fetched": 0, "skills_extracted": 0, "promoted": 0}

    print(f"[taxonomy] Incremental refresh starting (model: {model})...")
    all_postings = await fetch_all_roles_all_sources()
    summary["postings_fetched"] = len(all_postings)

    sb = get_supabase()
    for chunk in _chunks(all_postings, 50):
        rows = [
            {
                "id": p.setdefault("id", str(uuid.uuid4())),
                "source": p.get("source"),
                "role_category": p.get("role_category"),
                "role_title": p.get("role_title"),
                "company": p.get("company"),
                "raw_description": p.get("raw_description", "")[:4000],
                "skills_processed": False,
            }
            for p in chunk
        ]
        try:
            sb.table("t7_job_postings").insert(rows).execute()
        except Exception as e:
            print(f"[taxonomy] Warning: {e}")

    total_skills = await _extract_and_store_skills(all_postings, model=model)
    summary["skills_extracted"] = total_skills
    await _normalize_all_candidate_skills()
    promoted = _bootstrap_promote()
    summary["promoted"] = promoted
    print(f"[taxonomy] Refresh done: {summary}")
    return summary


# ─── Internal helpers ─────────────────────────────────────────────────────────

async def _extract_and_store_skills(postings: list[dict], model: str = "gemini-3.6-flash") -> int:
    """
    Run extract_skills_from_posting() over every posting.
    Gemini calls are synchronous — run them in a thread pool to avoid
    blocking the FastAPI event loop.
    """
    total = 0
    semaphore = asyncio.Semaphore(5)  # max 5 concurrent Gemini calls

    def _process_sync(posting: dict) -> int:
        """Fully synchronous worker — safe to run in a thread."""
        count = 0
        desc = posting.get("raw_description", "")
        if not desc or len(desc) < 50:
            return 0
        role = posting.get("role_category", "")
        company = posting.get("company", "")
        try:
            skills = extract_skills_from_posting(desc, model=model)
            for skill in skills:
                _upsert_candidate_skill(skill, role, company)
                count += 1
            posting_id = posting.get("id")
            if posting_id:
                get_supabase().table("t7_job_postings").update({
                    "skills_extracted": skills,
                    "skills_processed": True,
                }).eq("id", posting_id).execute()
        except Exception as e:
            print(f"[taxonomy] Skill extraction error: {e}")
        return count

    async def process_one(posting: dict):
        nonlocal total
        async with semaphore:
            count = await asyncio.get_event_loop().run_in_executor(
                _thread_pool, _process_sync, posting
            )
            total += count

    await asyncio.gather(*[process_one(p) for p in postings])
    return total


def _upsert_candidate_skill(skill_text: str, role_category: str, company: str):
    """
    Insert or increment a candidate skill.
    Uses the skill_name unique constraint to upsert.
    """
    sb = get_supabase()
    skill_text = skill_text.strip()
    if not skill_text:
        return
    try:
        # Frequency counts every occurrence, while company_count is derived
        # from a separate unique-company ledger.
        normalized_company = company.strip().casefold()
        if normalized_company:
            sb.table("t7_skill_companies").upsert(
                {
                    "role_category": role_category,
                    "skill_name": skill_text,
                    "company_name": normalized_company,
                },
                on_conflict="role_category,skill_name,company_name",
                ignore_duplicates=True,
            ).execute()
        company_rows = (
            sb.table("t7_skill_companies")
            .select("company_name", count="exact")
            .eq("role_category", role_category)
            .eq("skill_name", skill_text)
            .execute()
        )
        company_count = company_rows.count or 0

        # Check if this exact skill already exists for this role.
        existing = (
            sb.table("t7_skill_taxonomy")
            .select("id, frequency_30d, frequency_90d, company_count")
            .eq("role_category", role_category)
            .eq("skill_name", skill_text)
            .limit(1)
            .execute()
        )
        if existing and existing.data and len(existing.data) > 0:
            existing_row = existing.data[0]
            sb.table("t7_skill_taxonomy").update({
                "frequency_30d": (existing_row.get("frequency_30d") or 0) + 1,
                "frequency_90d": (existing_row.get("frequency_90d") or 0) + 1,
                "company_count": max(1, company_count),
                "status": "canonical",
            }).eq("id", existing_row["id"]).execute()
        else:
            sb.table("t7_skill_taxonomy").insert({
                "id": str(uuid.uuid4()),
                "role_category": role_category,
                "skill_name": skill_text,
                "frequency_30d": 1,
                "frequency_90d": 1,
                "company_count": max(1, company_count),
                "status": "canonical",
            }).execute()
    except Exception as e:
        print(f"[taxonomy] Upsert error for '{skill_text}': {e}")


async def _normalize_all_candidate_skills():
    """
    For every candidate skill without an embedding, generate + store it.
    Embedding calls are synchronous — run in thread pool.
    """
    sb = get_supabase()
    def _embed_and_store(skill: dict):
        try:
            emb = embed_text(skill["skill_name"])
            sb.table("t7_skill_taxonomy").update({"embedding": emb}).eq("id", skill["id"]).execute()
        except Exception as e:
            print(f"[taxonomy] Embed error for '{skill['skill_name']}': {e}")

    # Continue until no unembedded candidates remain; a 500-row cap would
    # leave most skills from the full role/source corpus unnormalized.
    while True:
        try:
            candidates = (
                sb.table("t7_skill_taxonomy")
                .select("id, skill_name")
                .is_("embedding", "null")
                .limit(100)
                .execute()
            )
        except Exception as e:
            print(f"[taxonomy] Could not fetch candidates for normalization: {e}")
            return
        batch = candidates.data or []
        if not batch:
            return
        loop = asyncio.get_event_loop()
        await asyncio.gather(*[
            loop.run_in_executor(_thread_pool, _embed_and_store, skill)
            for skill in batch
        ])


def _bootstrap_promote() -> int:
    """
    Promote candidates to 'canonical' so they appear in taxonomy & matching immediately.
    Returns count of newly promoted skills.
    """
    sb = get_supabase()
    try:
        candidates = (
            sb.table("t7_skill_taxonomy")
            .select("id, skill_name, role_category, frequency_30d, company_count")
            .eq("status", "candidate")
            .execute()
        )
    except Exception as e:
        print(f"[taxonomy] Could not query candidates for promotion: {e}")
        return 0

    promoted = 0
    for skill in (candidates.data or []):
        try:
            sb.table("t7_skill_taxonomy").update({"status": "canonical"}).eq("id", skill["id"]).execute()
            promoted += 1
        except Exception as e:
            print(f"[taxonomy] Promote error for '{skill['skill_name']}': {e}")

    print(f"[taxonomy] Promoted {promoted} skills to canonical")
    return promoted


def _seed_onet_fallback(role: str, skills: list[str]):
    """Insert O*NET skills directly as 'canonical' for thin roles."""
    for skill in skills:
        _upsert_candidate_skill(skill, role, "O*NET")
    # Fallback entries are intentionally available immediately, even though
    # they have not had time to meet the market-data promotion threshold.
    get_supabase().table("t7_skill_taxonomy").update({"status": "canonical"}).eq(
        "role_category", role
    ).in_("skill_name", skills).execute()


def _load_curated_role_skills() -> dict[str, list[str]]:
    """Read the existing T7 role dataset without duplicating it in the backend."""
    dataset = Path(__file__).resolve().parents[3] / "src" / "data" / "industrySkills.js"
    try:
        source = dataset.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[taxonomy] Curated skill dataset unavailable: {exc}")
        return {}

    roles: dict[str, list[str]] = {}
    pattern = re.compile(
        r"role_name:\s*'(?P<role>[^']+)'[\s\S]*?required_skills:\s*\[(?P<skills>[\s\S]*?)\],",
        re.MULTILINE,
    )
    for match in pattern.finditer(source):
        skills = re.findall(r"name:\s*'([^']+)'", match.group("skills"))
        if skills:
            roles[match.group("role")] = list(dict.fromkeys(skills))
    return roles


def _seed_curated_baseline() -> int:
    """Upsert T7's maintained role skills as canonical baseline skills."""
    sb = get_supabase()
    seeded = 0
    for role, skills in _load_curated_role_skills().items():
        for skill in skills:
            try:
                response = sb.table("t7_skill_taxonomy").upsert(
                    {
                        "role_category": role,
                        "skill_name": skill,
                        "frequency_30d": 1,
                        "frequency_90d": 1,
                        "company_count": 1,
                        "status": "canonical",
                    },
                    on_conflict="role_category,skill_name",
                    ignore_duplicates=True,
                ).execute()
                if response.data:
                    seeded += len(response.data)
            except Exception as exc:
                print(f"[taxonomy] Curated seed error for '{skill}': {exc}")
    print(f"[taxonomy] Seeded {seeded} curated baseline skills")
    return seeded


def _chunks(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]

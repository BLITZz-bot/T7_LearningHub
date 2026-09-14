"""
jobs/fetcher.py
Fetches job postings for ALL T7 industry roles from all 3 APIs:
  - Adzuna (India)
  - JSearch via RapidAPI
  - Jooble
API keys loaded from .env (already configured in T7 Learning Hub).
"""

import os
import asyncio
import httpx
import config
from config import get_env

RAPIDAPI_KEY = get_env("RAPIDAPI_KEY")
ADZUNA_APP_ID = get_env("ADZUNA_APP_ID")
ADZUNA_APP_KEY = get_env("ADZUNA_APP_KEY")
JOOBLE_API_KEY = get_env("JOOBLE_API_KEY")

# All roles from industrySkills.js — complete list
ALL_ROLES = [
    "Software Development Engineer Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Mobile App Developer Android iOS",
    "DevOps Engineer",
    "QA SDET Software Development Engineer in Test",
    "Systems Engineer",
    "Software Developer",
    "IT Support Systems Administrator",
    "Network Engineer",
    "Database Administrator DBA",
    "IT Business Analyst",
    "QA Engineer",
    "Machine Learning Engineer",
    "AI Research Engineer",
    "Computer Vision Engineer",
    "NLP Engineer",
    "MLOps Engineer",
    "Deep Learning Engineer",
    "Data Analyst",
    "Data Scientist",
    "Business Intelligence BI Analyst",
    "Data Engineer",
    "Analytics Consultant",
    "Quantitative Analyst",
    "SOC Analyst Security Operations Center",
    "Penetration Tester Ethical Hacker",
    "Application Security Engineer",
    "Cloud Security Engineer",
    "Security Consultant",
    "Incident Response Analyst",
    "Cloud Engineer AWS Azure GCP",
    "Cloud Solutions Architect",
    "Site Reliability Engineer SRE",
    "Platform Engineer",
    "Algorithm Engineer",
    "Research Analyst",
    "Systems Analyst",
]

# Simplified search terms for API queries (shorter = better results)
ROLE_SEARCH_TERMS = {r: r.split(" / ")[0].split(" (")[0][:50] for r in ALL_ROLES}


async def fetch_adzuna(role: str, client: httpx.AsyncClient) -> list[dict]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []
    results = []
    for page in range(1, 4):  # 3 pages × 10 = 30 postings per role
        try:
            what = httpx.QueryParams({"what": role}).get("what")
            url = (
                f"https://api.adzuna.com/v1/api/jobs/in/search/{page}"
                f"?app_id={ADZUNA_APP_ID}&app_key={ADZUNA_APP_KEY}"
                f"&what={what}&results_per_page=10&content-type=application/json"
            )
            r = await client.get(url, timeout=15)
            if r.status_code != 200:
                break
            data = r.json()
            for j in data.get("results", []):
                desc = (j.get("description") or "").replace("<br />", " ").replace("<b>", "").replace("</b>", "")
                if len(desc) > 50:
                    results.append({
                        "source": "adzuna",
                        "role_title": j.get("title", role),
                        "company": j.get("company", {}).get("display_name", ""),
                        "raw_description": desc[:3000],
                    })
        except Exception as e:
            print(f"[fetcher] Adzuna error for '{role}' page {page}: {e}")
            break
    return results


async def fetch_jsearch(role: str, client: httpx.AsyncClient) -> list[dict]:
    if not RAPIDAPI_KEY:
        return []
    results = []
    for page in range(1, 3):  # 2 pages
        try:
            url = f"https://jsearch.p.rapidapi.com/search-v2?query={role}+India&page={page}&num_pages=1"
            r = await client.get(
                url,
                headers={"X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": "jsearch.p.rapidapi.com"},
                timeout=15,
            )
            if r.status_code != 200:
                break
            data = r.json()
            raw_jobs = data.get("data") or []
            for j in raw_jobs:
                desc = j.get("job_description") or ""
                if len(desc) > 50:
                    results.append({
                        "source": "jsearch",
                        "role_title": j.get("job_title", role),
                        "company": j.get("employer_name", ""),
                        "raw_description": desc[:3000],
                    })
        except Exception as e:
            print(f"[fetcher] JSearch error for '{role}' page {page}: {e}")
            break
    return results


async def fetch_jooble(role: str, client: httpx.AsyncClient) -> list[dict]:
    if not JOOBLE_API_KEY:
        return []
    results = []
    try:
        r = await client.post(
            f"https://jooble.org/api/{JOOBLE_API_KEY}",
            json={"keywords": role, "location": "India", "page": 1},
            timeout=15,
        )
        if r.status_code == 200:
            for j in r.json().get("jobs", [])[:15]:
                desc = (j.get("snippet") or "").strip()
                if len(desc) > 50:
                    results.append({
                        "source": "jooble",
                        "role_title": j.get("title", role),
                        "company": j.get("company", ""),
                        "raw_description": desc[:3000],
                    })
    except Exception as e:
        print(f"[fetcher] Jooble error for '{role}': {e}")
    return results


async def fetch_all_for_role(role: str, client: httpx.AsyncClient) -> list[dict]:
    """Fetch from all 3 sources for a single role, attach role_category."""
    results = []
    adzuna, jsearch, jooble = await asyncio.gather(
        fetch_adzuna(role, client),
        fetch_jsearch(role, client),
        fetch_jooble(role, client),
        return_exceptions=True,
    )
    for batch in [adzuna, jsearch, jooble]:
        if isinstance(batch, list):
            for item in batch:
                item["role_category"] = role
                results.append(item)
    return results


async def fetch_all_roles_all_sources() -> list[dict]:
    """
    Fetch job postings for ALL roles from ALL sources.
    Returns flat list of posting dicts ready to insert into t7_job_postings.
    """
    all_postings = []
    async with httpx.AsyncClient() as client:
        # Stagger to avoid rate limits: 5 roles concurrently
        for i in range(0, len(ALL_ROLES), 5):
            batch = ALL_ROLES[i : i + 5]
            tasks = [fetch_all_for_role(role, client) for role in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_postings.extend(r)
            print(f"[fetcher] Fetched roles {i+1}–{min(i+5, len(ALL_ROLES))} of {len(ALL_ROLES)}")
            await asyncio.sleep(1)  # gentle rate-limit pause between batches
    print(f"[fetcher] Total postings fetched: {len(all_postings)}")
    return all_postings

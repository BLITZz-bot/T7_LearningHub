"""routers/taxonomy.py — GET /taxonomy/{role}"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from db.client import get_supabase

router = APIRouter()


@router.get("/")
@router.get("/roles")
async def list_roles():
    sb = get_supabase()
    try:
        r = sb.table("t7_skill_taxonomy").select("role_category").eq("status", "canonical").execute()
        roles = list(dict.fromkeys(s["role_category"] for s in (r.data or [])))
    except Exception:
        roles = []
    return JSONResponse({"roles": roles, "count": len(roles)})


@router.get("/{role:path}")
async def get_taxonomy(role: str, status: str = "canonical"):
    sb = get_supabase()
    try:
        r = (
            sb.table("t7_skill_taxonomy")
            .select("skill_name, frequency_30d, frequency_90d, company_count, status")
            .eq("role_category", role)
            .eq("status", status)
            .order("frequency_30d", desc=True)
            .execute()
        )
        skills = r.data or []
    except Exception:
        skills = []
    return JSONResponse({"role": role, "status": status, "skills": skills, "count": len(skills)})


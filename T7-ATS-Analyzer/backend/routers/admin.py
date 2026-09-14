"""
routers/admin.py
Admin endpoints: taxonomy bootstrap + incremental refresh.
"""
import asyncio
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from services.taxonomy import run_bootstrap, run_incremental_refresh

router = APIRouter()

_bootstrap_status = {"running": False, "done": False, "result": None, "error": None}
_refresh_status = {"running": False, "done": False, "result": None, "error": None}


async def _do_bootstrap():
    _bootstrap_status.update({"running": True, "done": False, "result": None, "error": None})
    try:
        result = await run_bootstrap()
        _bootstrap_status.update({"running": False, "done": True, "result": result})
    except Exception as e:
        _bootstrap_status.update({"running": False, "done": True, "error": str(e)})


async def _do_refresh():
    _refresh_status.update({"running": True, "done": False, "result": None, "error": None})
    try:
        result = await run_incremental_refresh()
        _refresh_status.update({"running": False, "done": True, "result": result})
    except Exception as e:
        _refresh_status.update({"running": False, "done": True, "error": str(e)})


@router.post("/taxonomy/bootstrap")
async def trigger_bootstrap(background_tasks: BackgroundTasks):
    """
    POST /admin/taxonomy/bootstrap
    Runs the full one-time taxonomy bootstrap in the background.
    Poll GET /admin/taxonomy/bootstrap/status to check progress.
    """
    if _bootstrap_status["running"]:
        return JSONResponse({"message": "Bootstrap already running", "status": _bootstrap_status})
    background_tasks.add_task(_do_bootstrap)
    return JSONResponse({"message": "Bootstrap started in background. This takes several minutes.", "status": "started"})


@router.get("/taxonomy/bootstrap/status")
async def bootstrap_status():
    return JSONResponse(_bootstrap_status)


@router.post("/taxonomy/refresh")
async def trigger_refresh(background_tasks: BackgroundTasks):
    """POST /admin/taxonomy/refresh — incremental refresh (safe to run any time)."""
    if _refresh_status["running"]:
        return JSONResponse({"message": "Refresh already running", "status": _refresh_status})
    background_tasks.add_task(_do_refresh)
    return JSONResponse({"message": "Incremental refresh started in background.", "status": "started"})


@router.get("/taxonomy/refresh/status")
async def refresh_status():
    return JSONResponse(_refresh_status)

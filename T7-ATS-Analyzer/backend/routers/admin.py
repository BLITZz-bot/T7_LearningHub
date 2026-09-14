"""
routers/admin.py
Admin endpoints: taxonomy bootstrap + incremental refresh.
"""
import asyncio
from fastapi import APIRouter, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from services.taxonomy import run_bootstrap, run_incremental_refresh

router = APIRouter()

_bootstrap_status = {"running": False, "done": False, "model": "gemini-3.6-flash", "result": None, "error": None}
_refresh_status = {"running": False, "done": False, "model": "gemini-3.6-flash", "result": None, "error": None}


async def _do_bootstrap(model: str = "gemini-3.6-flash"):
    _bootstrap_status.update({"running": True, "done": False, "model": model, "result": None, "error": None})
    try:
        result = await run_bootstrap(model=model)
        _bootstrap_status.update({"running": False, "done": True, "model": model, "result": result})
    except Exception as e:
        _bootstrap_status.update({"running": False, "done": True, "model": model, "error": str(e)})


async def _do_refresh(model: str = "gemini-3.6-flash"):
    _refresh_status.update({"running": True, "done": False, "model": model, "result": None, "error": None})
    try:
        result = await run_incremental_refresh(model=model)
        _refresh_status.update({"running": False, "done": True, "model": model, "result": result})
    except Exception as e:
        _refresh_status.update({"running": False, "done": True, "model": model, "error": str(e)})


@router.post("/taxonomy/bootstrap")
async def trigger_bootstrap(
    background_tasks: BackgroundTasks,
    model: str = Query("gemini-3.6-flash", description="Gemini model for extraction"),
):
    """
    POST /admin/taxonomy/bootstrap?model=gemini-3.6-flash
    Runs the full one-time taxonomy bootstrap in the background.
    Poll GET /admin/taxonomy/bootstrap/status to check progress.
    """
    if _bootstrap_status["running"]:
        return JSONResponse({"message": "Bootstrap already running", "status": _bootstrap_status})
    background_tasks.add_task(_do_bootstrap, model=model)
    return JSONResponse({
        "message": f"Bootstrap started in background using model '{model}'.",
        "model": model,
        "status": "started",
    })


@router.get("/taxonomy/bootstrap/status")
async def bootstrap_status():
    return JSONResponse(_bootstrap_status)


@router.post("/taxonomy/refresh")
async def trigger_refresh(
    background_tasks: BackgroundTasks,
    model: str = Query("gemini-3.6-flash", description="Gemini model for extraction"),
):
    """POST /admin/taxonomy/refresh?model=gemini-3.6-flash — incremental refresh (safe to run any time)."""
    if _refresh_status["running"]:
        return JSONResponse({"message": "Refresh already running", "status": _refresh_status})
    background_tasks.add_task(_do_refresh, model=model)
    return JSONResponse({
        "message": f"Incremental refresh started in background using model '{model}'.",
        "model": model,
        "status": "started",
    })


@router.get("/taxonomy/refresh/status")
async def refresh_status():
    return JSONResponse(_refresh_status)

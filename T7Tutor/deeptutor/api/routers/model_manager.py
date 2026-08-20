import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = "qwen2.5:7b"


class PullRequest(BaseModel):
    model: str = DEFAULT_MODEL


class DeleteRequest(BaseModel):
    model: str = DEFAULT_MODEL


@router.get("/status")
async def get_model_status():
    """Check if Ollama is running and whether Qwen 8B is downloaded."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.status_code != 200:
                return {
                    "ollama_running": False,
                    "model_downloaded": False,
                    "target_model": DEFAULT_MODEL,
                    "models": [],
                    "error": f"Ollama returned status code {res.status_code}",
                }
            
            data = res.json()
            models = data.get("models", [])
            model_names = [m.get("name", "") for m in models]
            
            # Check if qwen2.5:7b or similar is downloaded
            is_downloaded = any(
                DEFAULT_MODEL in name or "qwen2.5:latest" in name or "qwen2.5-coder:7b" in name
                for name in model_names
            )
            
            return {
                "ollama_running": True,
                "model_downloaded": is_downloaded,
                "target_model": DEFAULT_MODEL,
                "installed_models": model_names,
                "models_detail": models,
            }
    except Exception as e:
        return {
            "ollama_running": False,
            "model_downloaded": False,
            "target_model": DEFAULT_MODEL,
            "models": [],
            "error": str(e),
        }


@router.post("/pull")
async def pull_model(req: PullRequest):
    """Trigger model download via Ollama stream."""
    model_name = req.model or DEFAULT_MODEL
    
    async def stream_ollama_pull():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/pull",
                    json={"name": model_name, "stream": True},
                ) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': f'Failed with status {response.status_code}'})}\n\n"
                        return
                    
                    async for chunk in response.aiter_lines():
                        if chunk:
                            yield f"data: {chunk}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_ollama_pull(), media_type="text/event-stream")


@router.post("/delete")
async def delete_model(req: DeleteRequest):
    """Delete the downloaded Qwen model from Ollama."""
    model_name = req.model or DEFAULT_MODEL
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.request(
                "DELETE",
                f"{OLLAMA_BASE_URL}/api/delete",
                json={"name": model_name},
            )
            if res.status_code == 200:
                return {"success": True, "message": f"Deleted {model_name} successfully."}
            else:
                raise HTTPException(status_code=res.status_code, detail=res.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
T7 ATS Resume Analyzer — FastAPI Backend
Main entrypoint
"""

import config  # Loads root T7-Learning-Hub/.env automatically
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import resumes, taxonomy, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("T7 ATS Resume Analyzer API starting...")
    yield
    print("T7 ATS Resume Analyzer API shutting down.")


app = FastAPI(
    title="T7 ATS Resume Analyzer",
    description="Gemini-powered ATS resume analyzer with pgvector taxonomy matching",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(taxonomy.router, prefix="/taxonomy", tags=["Taxonomy"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "T7 ATS Resume Analyzer"}

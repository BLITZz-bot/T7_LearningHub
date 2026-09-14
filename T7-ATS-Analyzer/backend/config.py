"""
Centralized Configuration & Environment Loader.
Finds and loads the root T7-Learning-Hub/.env file automatically,
with optional local fallback to T7-ATS-Analyzer/backend/.env.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve paths
_BACKEND_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _BACKEND_DIR.parents[1]  # T7-Learning-Hub root

_ROOT_ENV = _ROOT_DIR / ".env"
_BACKEND_ENV = _BACKEND_DIR / ".env"

# 1. Load root .env first
if _ROOT_ENV.exists():
    load_dotenv(dotenv_path=_ROOT_ENV, override=False)

# 2. Load local backend .env if present
if _BACKEND_ENV.exists():
    load_dotenv(dotenv_path=_BACKEND_ENV, override=False)

def get_env(key: str, default: str = "") -> str:
    """Get sanitized environment variable (stripped of surrounding quotes)."""
    val = os.getenv(key, default)
    if val:
        val = val.strip().strip('"').strip("'")
    return val

"""
Supabase client singleton.
Uses SERVICE_ROLE_KEY — server-only, never exposed to browser.
"""

import os
from supabase import create_client, Client
import config
from config import get_env

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = get_env("SUPABASE_URL")
        key = get_env("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in .env")
        _client = create_client(url, key)
    return _client

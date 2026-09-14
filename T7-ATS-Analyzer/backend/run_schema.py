"""
One-time schema runner.
Executes schema.sql against Supabase using the Management API.
Run: python run_schema.py
"""
import os
import httpx
import config
from config import get_env

url = get_env("SUPABASE_URL")
service_key = get_env("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)

print(f"Connecting to Supabase: {url[:40]}...")

# Read schema
with open("db/schema.sql") as f:
    schema_sql = f.read()

# Execute via Management API (runs raw SQL)
# Supabase project ref is extracted from the URL
project_ref = url.replace("https://", "").split(".")[0]
mgmt_url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"

r = httpx.post(
    mgmt_url,
    headers={
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    },
    json={"query": schema_sql},
    timeout=60,
)

print(f"Status: {r.status_code}")
if r.status_code in (200, 201):
    print("Schema executed successfully!")
else:
    print("Management API response:", r.text[:400])
    print("\n--- Trying direct psycopg2 approach via Supabase connection string ---")
    print("Please run the schema manually in the Supabase SQL Editor:")
    print(f"  {url.replace('.supabase.co', '')}.supabase.com/project/default/sql")
    print("\nThe schema file is at: db/schema.sql")

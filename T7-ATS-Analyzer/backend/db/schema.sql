-- ============================================================
-- T7 ATS Resume Analyzer - Supabase Schema
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS t7_resumes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  raw_text     TEXT,
  parsed_json  JSONB,
  file_name    TEXT,
  file_type    TEXT,
  target_role  TEXT,
  generation_model TEXT,
  uploaded_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t7_resume_skills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id    UUID REFERENCES t7_resumes(id) ON DELETE CASCADE,
  skill_text   TEXT,
  embedding    VECTOR(768),
  source_bullet TEXT
);

CREATE TABLE IF NOT EXISTS t7_skill_taxonomy (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_category   TEXT NOT NULL,
  skill_name      TEXT NOT NULL,
  embedding       VECTOR(768),
  frequency_30d   INT DEFAULT 0,
  frequency_90d   INT DEFAULT 0,
  company_count   INT DEFAULT 0,
  status          TEXT DEFAULT 'candidate',
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_category, skill_name)
);

-- Records unique employers that mentioned a skill. This makes the bootstrap
-- promotion rule genuinely require two distinct companies, not two postings.
CREATE TABLE IF NOT EXISTS t7_skill_companies (
  role_category TEXT NOT NULL,
  skill_name    TEXT NOT NULL,
  company_name  TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_category, skill_name, company_name)
);

CREATE INDEX IF NOT EXISTS t7_skill_taxonomy_embedding_idx
  ON t7_skill_taxonomy USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS t7_resume_skills_embedding_idx
  ON t7_resume_skills USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS t7_job_postings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           TEXT,
  role_category    TEXT,
  role_title       TEXT,
  company          TEXT,
  raw_description  TEXT,
  skills_extracted JSONB,
  skills_processed BOOLEAN DEFAULT FALSE,
  fetched_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t7_jd_matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id        UUID REFERENCES t7_resumes(id) ON DELETE CASCADE,
  jd_text          TEXT,
  jd_role          TEXT,
  matched_skills   JSONB,
  missing_skills   JSONB,
  match_percentage NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t7_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id             UUID REFERENCES t7_resumes(id) ON DELETE CASCADE,
  ats_parseability      NUMERIC,
  impact_quantification NUMERIC,
  skill_match           NUMERIC,
  formatting            NUMERIC,
  mechanical_checks     JSONB,
  weak_bullets          JSONB,
  seniority_notes       TEXT,
  computed_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t7_rewrites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id        UUID REFERENCES t7_resumes(id) ON DELETE CASCADE,
  original_bullet  TEXT,
  issue            TEXT,
  rewritten_bullet TEXT,
  reasoning        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS t7_resumes_user_idx ON t7_resumes(user_id);
CREATE INDEX IF NOT EXISTS t7_job_postings_role_idx ON t7_job_postings(role_category);
CREATE INDEX IF NOT EXISTS t7_job_postings_proc_idx ON t7_job_postings(skills_processed);
CREATE INDEX IF NOT EXISTS t7_taxonomy_role_status_idx ON t7_skill_taxonomy(role_category, status);

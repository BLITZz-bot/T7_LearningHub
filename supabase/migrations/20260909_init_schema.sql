-- ============================================================
-- T7 Learning Hub — Enterprise Supabase PostgreSQL Schema
-- Migration: 20260909_init_schema.sql
-- ============================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Student Profiles Table (Tied to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'student',
  department TEXT DEFAULT 'Computer Science',
  college TEXT DEFAULT 'Engineering College',
  year_of_study TEXT DEFAULT '3rd Year',
  target_role TEXT DEFAULT 'frontend-dev',
  target_role_name TEXT DEFAULT 'Frontend Developer',
  skills TEXT[] DEFAULT '{}',
  t7_account_id TEXT UNIQUE,
  gemini_api_key TEXT,
  gemini_model TEXT DEFAULT 'auto',
  last_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skill Gap Analyses & 8-Week Roadmaps
CREATE TABLE IF NOT EXISTS public.skill_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_role TEXT NOT NULL,
  readiness_score INT NOT NULL,
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  honest_assessment TEXT,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  recommended_skills TEXT[] DEFAULT '{}',
  skill_priority_order JSONB DEFAULT '[]'::jsonb,
  learning_roadmap JSONB DEFAULT '[]'::jsonb,
  quick_wins JSONB DEFAULT '[]'::jsonb,
  resume_tips TEXT[] DEFAULT '{}',
  linkedin_tips TEXT[] DEFAULT '{}',
  motivation TEXT,
  final_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Resume Scans & ATS History Table (Multi-Version Tracking)
CREATE TABLE IF NOT EXISTS public.resume_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.skill_analyses(id) ON DELETE SET NULL,
  file_name TEXT,
  file_type TEXT,
  size_kb INT,
  ats_score INT NOT NULL,
  summary TEXT,
  strengths TEXT[] DEFAULT '{}',
  issues TEXT[] DEFAULT '{}',
  keyword_gaps TEXT[] DEFAULT '{}',
  suggested_keywords TEXT[] DEFAULT '{}',
  section_scores JSONB DEFAULT '{}'::jsonb,
  rewrite_suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Student Activity Feed Table (Eliminates the "Re-Scan" feeling)
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'ats_scan', 'skill_analysis', 'youtube_sync', 'profile_update'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. YouTube Extension Video Learning Logs Table
CREATE TABLE IF NOT EXISTS public.video_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id TEXT,
  video_title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  channel_title TEXT,
  detected_skills TEXT[] DEFAULT '{}',
  summary TEXT,
  rating NUMERIC DEFAULT 0,
  relevance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.video_learning ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE public.video_learning ADD COLUMN IF NOT EXISTS relevance NUMERIC DEFAULT 0;

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON public.user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_scans_user_created ON public.resume_scans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.skill_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_t7_id ON public.profiles(t7_account_id);
CREATE INDEX IF NOT EXISTS idx_video_learning_user ON public.video_learning(user_id, created_at DESC);

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_learning ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own rows (idempotent)
DROP POLICY IF EXISTS "profiles_owner_access" ON public.profiles;
CREATE POLICY "profiles_owner_access" ON public.profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "analyses_owner_access" ON public.skill_analyses;
CREATE POLICY "analyses_owner_access" ON public.skill_analyses
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scans_owner_access" ON public.resume_scans;
CREATE POLICY "scans_owner_access" ON public.resume_scans
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_owner_access" ON public.user_activities;
CREATE POLICY "activities_owner_access" ON public.user_activities
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "video_learning_owner_access" ON public.video_learning;
CREATE POLICY "video_learning_owner_access" ON public.video_learning
  FOR ALL USING (auth.uid() = user_id);

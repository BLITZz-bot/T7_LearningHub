-- ==============================================================================
-- T7 LEARNING HUB — MASTER DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL (Full Clean Run)
-- Instructions: Copy and paste this entire script into your Supabase SQL Editor and click RUN.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Student Profiles Table
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
  certifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_analysis JSONB;

-- 3. Skill Gap Analyses & 4-Month Roadmaps Table
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

-- 4. Resume Scans & ATS History Table
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

-- 5. Student Activity Feed Table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'ats_scan', 'skill_analysis', 'youtube_sync', 'profile_update', 'skill_exam'
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

-- 7. Daily Learning Activity & Heatmap Table (Powers Streak, Score & Heatmap Grid)
CREATE TABLE IF NOT EXISTS public.t7_quiz_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- format: 'YYYY-MM-DD'
  questions_solved INT DEFAULT 0,
  total_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 8. Skill Certifications & Exam Progress Table (Verified Badges, Scores >= 80%, Credential IDs)
CREATE TABLE IF NOT EXISTS public.skill_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced'
  score INT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  credential_id TEXT,
  pillar_scores JSONB DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  passed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill)
);

-- 9. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_skill_analyses_user ON public.skill_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_scans_user ON public.resume_scans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_learning_user ON public.video_learning(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_activity_user ON public.t7_quiz_activity(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_skill_certifications_user ON public.skill_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_certifications_skill ON public.skill_certifications(skill);

-- ============================================================
-- T7 Learning Hub — Skill Certifications & Exam Progress Schema
-- Migration: 20261002_skill_certifications.sql
-- ============================================================

-- 1. Create Dedicated Skill Certifications Table
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

-- 2. Index for High-Speed Lookups
CREATE INDEX IF NOT EXISTS idx_skill_certifications_user ON public.skill_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_certifications_skill ON public.skill_certifications(skill);

-- 3. Also add certifications JSONB column to profiles table as a universal cache/fallback
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '{}'::jsonb;

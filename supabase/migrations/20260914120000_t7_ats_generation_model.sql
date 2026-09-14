-- Allows each resume analysis to retain the model selected at upload time.
ALTER TABLE IF EXISTS public.t7_resumes
  ADD COLUMN IF NOT EXISTS generation_model TEXT;

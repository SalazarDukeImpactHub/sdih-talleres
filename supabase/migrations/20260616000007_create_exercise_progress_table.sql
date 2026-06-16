-- Migration: Create exercise_progress table for tracking user responses
-- Purpose: Store user responses, autosave state, and completion status per exercise
-- Design: User-owned state table, idempotent upsert via ignoreDuplicates

CREATE TABLE public.exercise_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  user_response_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Indexes for performance
CREATE INDEX idx_exercise_progress_user_id ON public.exercise_progress(user_id);
CREATE INDEX idx_exercise_progress_exercise_id ON public.exercise_progress(exercise_id);
CREATE INDEX idx_exercise_progress_user_exercise ON public.exercise_progress(user_id, exercise_id);
CREATE INDEX idx_exercise_progress_status_exercise ON public.exercise_progress(exercise_id, status);

-- Row Level Security
ALTER TABLE public.exercise_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own exercise progress
CREATE POLICY exercise_progress_select ON public.exercise_progress
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can only insert their own exercise progress
CREATE POLICY exercise_progress_insert ON public.exercise_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can only update their own exercise progress
CREATE POLICY exercise_progress_update ON public.exercise_progress
  FOR UPDATE USING (user_id = auth.uid());

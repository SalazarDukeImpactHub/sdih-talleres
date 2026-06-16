-- Migration: Create exercises table for workshop exercise definitions
-- Purpose: Store exercise prompts, titles, objectives per workshop
-- Design: Plain text prompts only (no markdown in v1), ordered for consistent display

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, "order")
);

-- Indexes for performance
CREATE INDEX idx_exercises_workshop_id ON public.exercises(workshop_id);
CREATE INDEX idx_exercises_workshop_order ON public.exercises(workshop_id, "order");

-- Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only redeemed users can view exercises
-- Checks if user has redeemed access to the workshop
CREATE POLICY exercises_select_redeemed ON public.exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workshop_access wa
      WHERE wa.workshop_id = exercises.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );

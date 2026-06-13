-- Migration: Create section_visits table for progress tracking
-- Purpose: Track which sections a user has visited (baseline for progress bar calculation)
-- Design Decision D-1: Server-side progress persistence for robustness across devices

CREATE TABLE public.section_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);

-- Indexes for performance
CREATE INDEX idx_section_visits_user_id ON public.section_visits(user_id);
CREATE INDEX idx_section_visits_section_id ON public.section_visits(section_id);
CREATE INDEX idx_section_visits_user_section ON public.section_visits(user_id, section_id);

-- Row Level Security
ALTER TABLE public.section_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own visit records
CREATE POLICY section_visits_select ON public.section_visits
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can only insert their own visit records
CREATE POLICY section_visits_insert ON public.section_visits
  FOR INSERT WITH CHECK (user_id = auth.uid());

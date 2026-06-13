-- Migration: Create glossary_terms table for workshop glossaries
-- Purpose: Store glossary terms with definitions and categories, accessible to redeemed users

CREATE TABLE public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, term)
);

-- Indexes for performance
CREATE INDEX idx_glossary_terms_workshop_id ON public.glossary_terms(workshop_id);
CREATE INDEX idx_glossary_terms_category ON public.glossary_terms(workshop_id, category);
CREATE INDEX idx_glossary_terms_search ON public.glossary_terms(workshop_id, term);

-- Row Level Security
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only redeemed users can view glossary terms
-- Checks if user has redeemed access to the workshop
CREATE POLICY glossary_select_redeemed ON public.glossary_terms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workshop_access wa
      WHERE wa.workshop_id = glossary_terms.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );

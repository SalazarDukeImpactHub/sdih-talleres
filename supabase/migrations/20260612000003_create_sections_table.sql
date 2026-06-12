-- Migration: Create sections table for workshop content storage
-- Purpose: Store section content per workshop (Inicio, Aprendizaje, Taller, Instalación, Glosario)
-- ADR-001: content_json is a discriminated union per section type

CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inicio','aprendizaje','taller','instalacion','glosario')),
  content_json JSONB NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, type)
);

-- Indexes for performance
CREATE INDEX idx_sections_workshop_id ON public.sections(workshop_id);
CREATE INDEX idx_sections_type ON public.sections(type);

-- Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only redeemed users can view sections
-- Checks if user has redeemed access to the workshop
CREATE POLICY sections_select_redeemed ON public.sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workshop_access wa
      WHERE wa.workshop_id = sections.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );

-- Grant default privileges to authenticated users
-- Note: These should be set once at schema creation; included here for completeness
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- supabase/migrations/20260612000001_create_workshops_table.sql
--
-- Tabla workshops: catálogo de talleres disponibles.
-- Visible a usuarios autenticados (sin restricción de acceso individual).
--
-- IMPORTANTE: Esta migración debe ejecutarse ANTES de create_workshop_access_table
-- Para evitar errores de FK constraint, ambas migraciones deben ejecutarse
-- en el mismo contexto transaccional en Supabase SQL Editor.
--
-- Pasos (Jennifer):
-- 1. Copiar el SQL completo
-- 2. Ir a Supabase Dashboard → SQL Editor
-- 3. Pegar y ejecutar ambas migraciones (create_workshops_table + create_workshop_access_table)
--    en la MISMA sesión SQL (transacción única)

CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor TEXT NOT NULL,
  date_live TIMESTAMPTZ,
  duration_min INTEGER,
  prerequisites TEXT,
  status TEXT NOT NULL CHECK (status IN ('disponible', 'en vivo', 'próximamente', 'completado')),
  cover_image TEXT,
  whatsapp_message_template TEXT,
  price_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para queries rápidas por status (usado en filtros futuros)
CREATE INDEX idx_workshops_status ON public.workshops(status);

-- RLS: All authenticated users can SELECT (catalog visible to all)
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshops_select_authenticated" ON public.workshops
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "workshops_admin_all" ON public.workshops
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grants (NOTE: DEFAULT PRIVILEGES already exist from change 1, these are explicit overrides if needed)
GRANT SELECT ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;

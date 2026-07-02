-- supabase/migrations/20260702000008_add_workshop_category.sql
--
-- Categoría de taller para filtros del catálogo.
-- TEXT libre (sin CHECK): la taxonomía la define el admin y puede evolucionar
-- sin migraciones. Los chips de filtro del catálogo se computan dinámicamente
-- de los valores distintos presentes en la tabla.
-- NULL = taller sin categorizar (aparece solo en el filtro "Todos").

ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Index parcial para el orden/agrupación del catálogo
CREATE INDEX IF NOT EXISTS idx_workshops_category
  ON public.workshops(category)
  WHERE category IS NOT NULL;

-- ============================================================
-- Backfill de los 9 talleres v1 (por slug; 01 y 02 por título
-- porque son anteriores al sistema de seeds versionados)
-- ============================================================

UPDATE public.workshops SET category = 'IA y Tecnología'
WHERE slug IN (
  'cerebro-aumentado-obsidian-claude-engram',
  'ai-regulation-compliance-colombia',
  'blockchain-sin-hype-decision-framework'
) OR title ILIKE '%engram%' OR title ILIKE '%gentle%ai%';

UPDATE public.workshops SET category = 'Emprendimiento y Negocio'
WHERE slug = 'del-sueno-a-la-convocatoria';

UPDATE public.workshops SET category = 'Bienestar y Salud Mental'
WHERE slug IN (
  'sistema-auto-proteccion-mental',
  'mapa-recuperacion-depresion'
);

UPDATE public.workshops SET category = 'Creatividad y Aprendizaje'
WHERE slug = 'kaia-sistema-operativo-creativo';

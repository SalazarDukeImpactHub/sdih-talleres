-- docs/database/seed-workshops.sql
--
-- Seed script para poblar 4 talleres de prueba con estados distintos.
-- Ejecutar manualmente vía SQL editor Supabase o CLI después de crear las tablas.
--
-- NOTA: Este archivo es referencia. En tests usamos la función idempotente
-- resetWorkshopsAndAccess() (en tests/helpers/supabase-admin.ts) que crea
-- los fixtures dinámicamente por test, evitando la necesidad de este seed manual.

-- Insertamos 4 talleres con estados: disponible, en vivo, próximamente, completado
INSERT INTO public.workshops (slug, title, description, instructor, status, date_live, duration_min, cover_image, created_at) VALUES
  (
    'rag-intro',
    'RAG Intro',
    'Introduction to RAG systems',
    'Dr. AI',
    'disponible',
    now() + INTERVAL '7 days',
    120,
    NULL,
    now()
  ),
  (
    'embeddings',
    'Embeddings Deep Dive',
    'Advanced embeddings techniques',
    'Dr. AI',
    'en vivo',
    now(),
    150,
    NULL,
    now()
  ),
  (
    'future-tech',
    'Future of AI',
    'Speculation and trends',
    'Dr. AI',
    'próximamente',
    now() + INTERVAL '30 days',
    120,
    NULL,
    now()
  ),
  (
    'completed',
    'Past Workshop',
    'Already happened',
    'Dr. AI',
    'completado',
    now() - INTERVAL '7 days',
    100,
    NULL,
    now()
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed access keys para un usuario de test
-- REEMPLAZAR {SEED_USER_ID} con el UUID real del usuario de test
-- Ejemplo: d096328a-7ce1-4fc4-b53b-4e1f50691d31
INSERT INTO public.workshop_access (user_id, workshop_id, access_key, redeemed_at, expires_at, created_at)
SELECT
  '{SEED_USER_ID}'::UUID,
  w.id,
  CASE w.slug
    WHEN 'rag-intro' THEN 'RAG-STARTER'
    WHEN 'embeddings' THEN 'LIVE-2024'
  END,
  now(),
  now() + INTERVAL '30 days',
  now()
FROM public.workshops w
WHERE w.slug IN ('rag-intro', 'embeddings')
ON CONFLICT (user_id, workshop_id) DO NOTHING;

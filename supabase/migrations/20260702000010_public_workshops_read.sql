-- supabase/migrations/20260702000010_public_workshops_read.sql
--
-- Vitrina pública: permitir que visitantes SIN sesión (rol anon) lean la
-- metadata de los talleres (título, descripción, categoría, cover, precio).
--
-- IMPORTANTE: esto expone SOLO la tabla workshops (metadata de marketing).
-- El CONTENIDO (sections, exercises, glossary_terms) sigue protegido por sus
-- propias policies, que exigen workshop_access con redeemed_at IS NOT NULL.
-- La vitrina nunca muestra el contenido pago — solo la portada de cada taller.

-- Policy de lectura pública (se suma a la de authenticated; las policies son OR).
CREATE POLICY "workshops_select_public"
  ON public.workshops
  FOR SELECT
  USING (true);

-- El rol anon necesita el GRANT base de Postgres además de la policy RLS.
GRANT SELECT ON public.workshops TO anon;

-- supabase/migrations/20260702000009_scrub_plaintext_access_key.sql
--
-- Audit v1 · M1 — eliminar el pasivo de claves en texto plano.
-- La fuente de verdad es access_key_hash + access_key_salt (SHA-256).
-- La columna access_key (plaintext) era fallback de v1 y ya no se escribe
-- desde la app (ver generateAccessKey).
--
-- 1) La columna deja de ser obligatoria (nuevas claves se guardan solo hasheadas).
-- 2) Se borra el plaintext de toda fila que ya tenga hash — esas no lo necesitan.
--    Las filas sin hash (si existieran claves manuales legacy) se dejan intactas
--    para no romper su canje.

ALTER TABLE public.workshop_access
  ALTER COLUMN access_key DROP NOT NULL;

UPDATE public.workshop_access
  SET access_key = NULL
  WHERE access_key_hash IS NOT NULL;

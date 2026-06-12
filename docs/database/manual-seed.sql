-- Seed manual para usuario de prueba
-- Fecha: 2026-06-12
-- Instrucciones para Jennifer (Paso B-4):
--
-- 1. Crear usuario en Supabase Auth Dashboard:
--    - Email: alumna@test.com
--    - Contraseña temporal: generada por Supabase (guardar)
--    - (Supabase genera automáticamente el UUID del usuario)
--
-- 2. Copiar el UUID del usuario desde el dashboard de Auth (botón "Copy User UID")
--
-- 3. Reemplazar <UUID-DEL-USUARIO> en el INSERT de abajo con el UUID copiado
--
-- 4. Ejecutar este INSERT en SQL Editor de Supabase
--
-- Nota: El usuario se crea con password_changed = false para forzar el cambio
--       de contraseña en el primer login.

-- Reemplazar <UUID-DEL-USUARIO> con el UUID real
INSERT INTO public.users (id, email, name, role, password_changed)
VALUES (
  '<UUID-DEL-USUARIO>',
  'alumna@test.com',
  'Alumna Test',
  'alumno',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Verificación: ejecutar esto para confirmar que el INSERT funcionó
-- SELECT * FROM public.users WHERE email = 'alumna@test.com';

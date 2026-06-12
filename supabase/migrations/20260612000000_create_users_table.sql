-- Migración: Crear tabla extension de auth.users con RLS
-- Fecha: 2026-06-12
-- Scope: Public schema

-- Tabla extension de auth.users con metadatos de aplicación
-- IMPORTANTE: Esta migración debe ejecutarse en el SQL Editor de Supabase ANTES de que sdd-apply continúe.
--
-- Pasos para ejecutar (Jennifer):
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este contenido
-- 3. Ejecutar (botón "Run")
-- 4. Verificar que la tabla se creó sin errores

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'alumno' CHECK (role IN ('alumno', 'admin')),
  password_changed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Habilitar Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario puede LEER solo su propia fila
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Política: cada usuario puede ACTUALIZAR solo su propia fila
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permisos de roles de Supabase
-- Por defecto, las tablas creadas via SQL Editor (como postgres) NO tienen grants
-- automáticos para los roles de Supabase. Tenemos que otorgarlos explícitamente.
-- service_role bypasea RLS pero igual necesita el GRANT base de Postgres.
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Default privileges: futuras tablas en public obtienen los mismos grants
-- (idempotente, seguro de re-ejecutar)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Comentario descriptivo
COMMENT ON TABLE public.users IS 'Extension de auth.users con metadatos de aplicación: nombre, rol, flag de password_changed.';
COMMENT ON COLUMN public.users.password_changed IS 'Flag: true si el usuario ya cambió su contraseña en primer login, false si aún usa contraseña temporal.';

-- Trigger comentado (out-of-scope en v1, será administrado por admin panel en change 5)
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, password_changed)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
*/

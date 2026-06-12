-- supabase/migrations/20260612000002_create_workshop_access_table.sql
--
-- Tabla workshop_access: control de acceso a talleres por usuario y clave de acceso.
-- Cada usuario tiene UNA clave por taller (UNIQUE constraint).
-- Después de canjear una clave (redeemed_at IS NOT NULL), el acceso es permanente.
--
-- IMPORTANTE: Esta migración debe ejecutarse DESPUÉS de create_workshops_table
-- en el MISMO contexto transaccional.

CREATE TABLE IF NOT EXISTS public.workshop_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  access_key TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One access per user per workshop
  UNIQUE(user_id, workshop_id),

  -- Expiry always in future at creation
  CHECK (expires_at > created_at)
);

-- Index para queries rápidas por user_id (lookup en página catalogo)
CREATE INDEX idx_workshop_access_user_id ON public.workshop_access(user_id);

-- Index para queries por workshop_id + redeemed_at (lookup unlock status)
CREATE INDEX idx_workshop_access_user_workshop ON public.workshop_access(user_id, workshop_id, redeemed_at);

-- RLS: Each user sees/updates only their own access rows
ALTER TABLE public.workshop_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshop_access_select_own" ON public.workshop_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "workshop_access_update_own_redeem" ON public.workshop_access
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workshop_access_admin_all" ON public.workshop_access
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grants
GRANT SELECT, UPDATE ON public.workshop_access TO authenticated;
GRANT ALL ON public.workshop_access TO service_role;

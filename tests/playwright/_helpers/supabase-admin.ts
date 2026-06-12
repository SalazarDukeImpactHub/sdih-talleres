/**
 * Helper de administración de Supabase para tests e2e.
 * Usa SUPABASE_SERVICE_ROLE_KEY para operaciones de reset.
 *
 * Nota: Este helper solo se ejecuta en el contexto de Playwright,
 * que corre en Node.js (no browser). Por eso podemos usar SupabaseClient
 * de servidor (importado desde @supabase/supabase-js).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Seed user hardcodeado (deve coincidir con manual-seed.sql y .env.local)
const SEED_USER = {
  uuid: "d096328a-7ce1-4fc4-b53b-4e1f50691d31",
  email: "alumna@test.com",
  password: "Talleres2026!",
};

/**
 * Crea un cliente Supabase admin con SERVICE_ROLE_KEY.
 * Este cliente puede hacer operaciones que normalmente requieren autenticación.
 *
 * Nota: Si las env vars no están definidas, esto fallará en runtime
 * (solo Playwright tests usan este helper, y corre en Node.js, no en Next.js build).
 */
function createAdminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env.local"
    );
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

/**
 * Reseta el usuario seed a su estado inicial.
 * - Resets password_changed a false
 * - Resets password a "Talleres2026!"
 *
 * Llamá esto en beforeEach o beforeAll de tests que tocan el usuario seed.
 */
export async function resetSeedUser() {
  const admin = createAdminClient();

  // 1. Reset password_changed en public.users
  const { error: updateError } = await admin
    .from("users")
    .update({ password_changed: false })
    .eq("email", SEED_USER.email);

  if (updateError) {
    throw new Error(`Failed to reset password_changed: ${updateError.message}`);
  }

  // 2. Reset password en auth.users (requiere UUID)
  const { error: authError } = await admin.auth.admin.updateUserById(
    SEED_USER.uuid,
    { password: SEED_USER.password }
  );

  if (authError) {
    throw new Error(`Failed to reset password: ${authError.message}`);
  }
}

/**
 * Obtiene el estado actual del usuario seed (usado para debug).
 */
export async function getSeedUserState() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("email", SEED_USER.email)
    .single();

  if (error) {
    throw new Error(`Failed to fetch seed user: ${error.message}`);
  }

  return data;
}

// Re-export para tests que crean admin clients directamente
export const SUPABASE_URL_FOR_TESTS = SUPABASE_URL;
export const SERVICE_ROLE_KEY_FOR_TESTS = SERVICE_ROLE_KEY;

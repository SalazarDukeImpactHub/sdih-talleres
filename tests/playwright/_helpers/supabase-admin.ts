/**
 * Helper de administración de Supabase para tests e2e.
 * Usa SUPABASE_SERVICE_ROLE_KEY para operaciones de reset.
 *
 * Nota: Este helper solo se ejecuta en el contexto de Playwright,
 * que corre en Node.js (no browser). Por eso podemos usar SupabaseClient
 * de servidor (importado desde @supabase/supabase-js).
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

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
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    // Node 20 no tiene WebSocket nativo. Inyectamos ws para evitar el crash
    // del Realtime client durante el constructor. El helper no usa Realtime,
    // pero supabase-js lo inicializa siempre.
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
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
 * Setea password_changed del usuario seed al valor dado.
 * Útil para tests que necesitan simular un usuario ya onboarded.
 */
export async function setSeedUserPasswordChanged(value: boolean) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ password_changed: value })
    .eq("email", SEED_USER.email);
  if (error) {
    throw new Error(`Failed to set password_changed=${value}: ${error.message}`);
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

/**
 * resetWorkshopsAndAccess() — reseta tablas de workshops para tests.
 * Idempotent: elimina todas las filas y recrea 4 fixtures.
 * Seed user obtiene acceso desbloqueado a 2 talleres.
 *
 * Llamá esto en beforeEach para aislar tests entre sí.
 */
export async function resetWorkshopsAndAccess() {
  const admin = createAdminClient();

  try {
    // 1. Delete all data idempotently (neq check evita match all si tabla está vacía)
    await admin.from("workshop_access").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("workshops").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Create 4 seed workshops con estados distintos
    const workshopsToInsert = [
      {
        slug: "rag-intro",
        title: "RAG Intro",
        description: "Introduction to RAG systems",
        instructor: "Dr. AI",
        status: "disponible",
        date_live: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_min: 120,
        cover_image: null,
      },
      {
        slug: "embeddings",
        title: "Embeddings Deep Dive",
        description: "Advanced embeddings techniques",
        instructor: "Dr. AI",
        status: "en vivo",
        date_live: new Date().toISOString(),
        duration_min: 150,
        cover_image: null,
      },
      {
        slug: "future-tech",
        title: "Future of AI",
        description: "Speculation and trends",
        instructor: "Dr. AI",
        status: "próximamente",
        date_live: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration_min: 120,
        cover_image: null,
      },
      {
        slug: "completed",
        title: "Past Workshop",
        description: "Already happened",
        instructor: "Dr. AI",
        status: "completado",
        date_live: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_min: 100,
        cover_image: null,
      },
    ];

    const { data: workshops, error: workshopsError } = await admin
      .from("workshops")
      .insert(workshopsToInsert)
      .select();

    if (workshopsError) {
      throw new Error(`Failed to insert workshops: ${workshopsError.message}`);
    }

    if (!workshops || workshops.length === 0) {
      throw new Error("No workshops inserted");
    }

    // 3. Create access rows: seed user unlocked to first 2 workshops (redeemed)
    const accessToInsert = [
      {
        user_id: SEED_USER.uuid,
        workshop_id: workshops[0].id,
        access_key: "RAG-STARTER",
        redeemed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: SEED_USER.uuid,
        workshop_id: workshops[1].id,
        access_key: "LIVE-2024",
        redeemed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // 2b: Add unredeemed access for future-tech (para testing canje)
      {
        user_id: SEED_USER.uuid,
        workshop_id: workshops[2].id,
        access_key: "FUTURE-TECH-2024",
        redeemed_at: null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { error: accessError } = await admin
      .from("workshop_access")
      .insert(accessToInsert);

    if (accessError) {
      throw new Error(`Failed to insert access rows: ${accessError.message}`);
    }

    return { workshops, seedUserId: SEED_USER.uuid };
  } catch (err) {
    console.error("[resetWorkshopsAndAccess] Error:", err);
    throw err;
  }
}

// Re-export para tests que crean admin clients directamente
export const SUPABASE_URL_FOR_TESTS = SUPABASE_URL;
export const SERVICE_ROLE_KEY_FOR_TESTS = SERVICE_ROLE_KEY;

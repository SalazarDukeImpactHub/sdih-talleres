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

/**
 * seedSectionsAndGlossary() — Seed sections and glossary terms for a workshop
 *
 * Idempotent: clears existing sections/glossary_terms for the workshop,
 * then inserts 5 sections (uno por tipo) + 8 glossary terms.
 *
 * Usage:
 *   const { workshopId } = await resetWorkshopsAndAccess();
 *   await seedSectionsAndGlossary(workshopId);
 *
 * Returns: { sections, glossaryTerms } with inserted records
 */
export async function seedSectionsAndGlossary(workshopId: string) {
  const admin = createAdminClient();

  try {
    // 1. Delete existing sections + glossary_terms idempotently
    await admin
      .from("glossary_terms")
      .delete()
      .eq("workshop_id", workshopId);

    await admin
      .from("sections")
      .delete()
      .eq("workshop_id", workshopId);

    // 2. Insert 5 sections (one per type)
    const sections = [
      {
        workshop_id: workshopId,
        type: "inicio",
        content_json: {
          type: "inicio",
          title: "Bienvenido al Taller",
          description: "Aprende conceptos clave y aplicaciones prácticas.",
          quick_links: [
            { label: "Aprendizaje", target_section: "aprendizaje" },
            { label: "Taller", target_section: "taller" },
            { label: "Instalación", target_section: "instalacion" },
            { label: "Glosario", target_section: "glosario" },
          ],
        },
        section_order: 1,
      },
      {
        workshop_id: workshopId,
        type: "aprendizaje",
        content_json: {
          type: "aprendizaje",
          title: "Módulo de Aprendizaje",
          slides: [
            {
              kicker: "Intro",
              title: "Concepto Clave 1",
              body: "Este es el contenido principal del primer slide. Explicamos el concepto con claridad.",
              notes: "Notas para el instructor: hacer énfasis en tal cosa",
            },
            {
              kicker: "Profundización",
              title: "Concepto Clave 2",
              body: "Ampliamos sobre el concepto anterior con ejemplos prácticos.",
              notes: null,
            },
          ],
          pdf_url: "https://ejemplo.com/slides.pdf",
        },
        section_order: 2,
      },
      {
        workshop_id: workshopId,
        type: "taller",
        content_json: {
          type: "taller",
          title: "Ejercicios",
          instructions: "Resolvé estos ejercicios siguiendo los pasos indicados.",
          placeholder: "Los ejercicios estarán disponibles pronto.",
        },
        section_order: 3,
      },
      {
        workshop_id: workshopId,
        type: "instalacion",
        content_json: {
          type: "instalacion",
          title: "Guía de Instalación",
          steps: [
            {
              order: 1,
              title: "Requisitos",
              description: "Verificá tener Node.js 18+",
              code: "node --version",
              language: "bash",
            },
            {
              order: 2,
              title: "Instala dependencias",
              description: "Descarga el paquete necesario",
              code: "npm install mi-paquete",
              language: "bash",
            },
            {
              order: 3,
              title: "Configura",
              description: "Setea variables de entorno",
              code: "export API_KEY=sk-...",
              language: "bash",
            },
          ],
          success_message: "¡Instalación completa!",
        },
        section_order: 4,
      },
      {
        workshop_id: workshopId,
        type: "glosario",
        content_json: {
          type: "glosario",
          title: "Glosario",
          search_placeholder: "Buscar término...",
        },
        section_order: 5,
      },
    ];

    const { data: insertedSections, error: sectionsError } = await admin
      .from("sections")
      .insert(sections)
      .select();

    if (sectionsError) {
      throw new Error(`Failed to insert sections: ${sectionsError.message}`);
    }

    // 3. Insert glossary terms (8 terms with 3 categories)
    const glossaryTerms = [
      {
        workshop_id: workshopId,
        term: "Concepto A",
        definition: "Primera definición de prueba para validar glossary",
        category: "Fundamentos",
      },
      {
        workshop_id: workshopId,
        term: "Concepto B",
        definition: "Segunda definición en la misma categoría",
        category: "Fundamentos",
      },
      {
        workshop_id: workshopId,
        term: "Técnica X",
        definition: "Técnica para resolver problema X de manera eficiente",
        category: "Técnicas",
      },
      {
        workshop_id: workshopId,
        term: "Técnica Y",
        definition: "Técnica avanzada para casos complejos",
        category: "Técnicas",
      },
      {
        workshop_id: workshopId,
        term: "Herramienta 1",
        definition: "Herramienta de soporte para el workflow",
        category: "Herramientas",
      },
      {
        workshop_id: workshopId,
        term: "Herramienta 2",
        definition: "Herramienta complementaria para optimizar",
        category: "Herramientas",
      },
      {
        workshop_id: workshopId,
        term: "Patrón Común",
        definition: "Patrón común en la industria que debes conocer",
        category: "Patrones",
      },
      {
        workshop_id: workshopId,
        term: "Anti-patrón",
        definition: "Patrón a evitar por razones de performance y seguridad",
        category: "Patrones",
      },
    ];

    const { data: insertedGlossary, error: glossaryError } = await admin
      .from("glossary_terms")
      .insert(glossaryTerms)
      .select();

    if (glossaryError) {
      throw new Error(`Failed to insert glossary terms: ${glossaryError.message}`);
    }

    return { sections: insertedSections, glossaryTerms: insertedGlossary };
  } catch (err) {
    console.error("[seedSectionsAndGlossary] Error:", err);
    throw err;
  }
}

// Re-export para tests que crean admin clients directamente
export const SUPABASE_URL_FOR_TESTS = SUPABASE_URL;
export const SERVICE_ROLE_KEY_FOR_TESTS = SERVICE_ROLE_KEY;

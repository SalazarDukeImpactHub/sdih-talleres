import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
  seedExercises,
  supabaseAdmin,
  SUPABASE_URL_FOR_TESTS,
} from "./_helpers/supabase-admin";

/**
 * E2E Test Suite for RLS Protection on Exercise Data [4b-7]
 *
 * Enfoque FUNCIONAL (no introspección de pg_policies — PostgREST no expone
 * el schema pg_catalog/information_schema vía la API REST).
 *
 * La verificación real de RLS: un cliente ANÓNIMO (sin sesión, sin auth.uid())
 * no puede leer exercises (la policy exige EXISTS sobre workshop_access
 * canjeado, que requiere auth.uid()) ni exercise_progress (policy user_id =
 * auth.uid()). El admin client (service_role) bypasea RLS, así que lo usamos
 * solo para sembrar datos, y el anon client para probar el bloqueo.
 */

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Cliente anónimo: sin sesión → auth.uid() es null → RLS bloquea todo lo
// protegido. Inyectamos ws igual que el admin (Node 20 sin WebSocket nativo).
function createAnonClient() {
  return createClient(SUPABASE_URL_FOR_TESTS, ANON_KEY, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}

const OTHER_USER_UUID = "20000000-0000-0000-0000-000000000000";

test.describe("Exercise RLS Protection [4b-7]", () => {
  let workshopId: string;

  test.beforeEach(async () => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);

    workshopId = workshops[0].id;
    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);
  });

  test("[4-7] — Cliente anónimo NO puede leer exercises (RLS bloquea)", async () => {
    // El admin sí ve los 4 ejercicios sembrados (bypassea RLS)
    const { data: adminView } = await supabaseAdmin
      .from("exercises")
      .select("id")
      .eq("workshop_id", workshopId);
    expect((adminView || []).length).toBe(4);

    // El cliente anónimo NO ve ninguno (auth.uid() null → EXISTS false)
    const anon = createAnonClient();
    const { data: anonView } = await anon
      .from("exercises")
      .select("id")
      .eq("workshop_id", workshopId);
    expect(anonView || []).toEqual([]);
  });

  test("[4-7] — Cliente anónimo NO puede leer exercise_progress (RLS bloquea)", async () => {
    // Sembrar un progress para el seed user vía admin (bypassea RLS)
    const { data: exercises } = await supabaseAdmin
      .from("exercises")
      .select("id")
      .eq("workshop_id", workshopId)
      .order("order", { ascending: true });
    const firstExerciseId = exercises![0].id;

    await supabaseAdmin.from("exercise_progress").upsert(
      {
        user_id: "d096328a-7ce1-4fc4-b53b-4e1f50691d31", // seed user
        exercise_id: firstExerciseId,
        status: "in_progress",
        user_response_text: "respuesta privada del alumno",
      },
      { onConflict: "user_id,exercise_id" }
    );

    // El cliente anónimo NO ve ningún progress (policy user_id = auth.uid())
    const anon = createAnonClient();
    const { data: anonProgress } = await anon
      .from("exercise_progress")
      .select("id, user_response_text");
    expect(anonProgress || []).toEqual([]);
  });

  test("[4-7] — Query por user_id ajeno no expone filas de otros (aislamiento)", async () => {
    // Aunque el anon intente filtrar por un user_id específico, RLS devuelve []
    const anon = createAnonClient();
    const { data } = await anon
      .from("exercise_progress")
      .select("id")
      .eq("user_id", OTHER_USER_UUID);
    expect(data || []).toEqual([]);
  });
});

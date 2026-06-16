import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
  seedExercises,
  supabaseAdmin,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";
import { getWorkshopSidebar } from "./_helpers/workshop";
import { pollExerciseProgress } from "./_helpers/poll-progress";

/**
 * E2E Test Suite for Exercise Autosave [4b-3]
 *
 * Tests autosave debounce (1s) and persistence to database.
 * Verifies user_response_text and status='in_progress' after autosave.
 */

let workshopId: string;
let seedUserId: string;
let exerciseId: string;

test.describe("Exercise Autosave [4b-3]", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops, seedUserId: rawSeedUserId } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);

    workshopId = workshops[0].id;
    seedUserId = rawSeedUserId;

    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);

    // Get first exercise ID
    const exercisesResult = await supabaseAdmin
      .from("exercises")
      .select("id")
      .eq("workshop_id", workshopId)
      .order("order", { ascending: true })
      .limit(1);
    exerciseId = exercisesResult.data?.[0]?.id || "";

    await loginAsSeedUser(page);
    await page.goto(`/taller/${workshops[0].slug}`);

    // Navigate to Taller section
    const sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Taller")').click();

    // Wait for first exercise to render
    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  });

  test("[4-3] — Type into textarea → wait 1.5s → DB contains user_response_text with status='in_progress'", async ({
    page,
  }) => {
    expect(exerciseId).toBeTruthy();
    expect(seedUserId).toBeTruthy();

    // Type into first exercise textarea
    const firstTextarea = page
      .getByTestId("exercise-card")
      .first()
      .locator("textarea");

    const testResponse = "Este es mi respuesta de prueba para el ejercicio.";
    await firstTextarea.fill(testResponse);

    // Poll la DB hasta que el autosave persista (debounce 1s + round-trip +
    // posible retry). waitForTimeout fijo pierde contra la latencia real.
    const progress = await pollExerciseProgress(
      seedUserId,
      exerciseId,
      (row) =>
        row.user_response_text === testResponse && row.status === "in_progress"
    );

    expect(progress.user_response_text).toBe(testResponse);
    expect(progress.status).toBe("in_progress");
    expect(progress.updated_at).toBeTruthy();
  });

  test("[4-3] — Rapid typing (< 1s per char) → only 1 Server Action call (debounce coalesces)", async ({
    page,
  }) => {
    // Type multiple characters rapidly
    const firstTextarea = page
      .getByTestId("exercise-card")
      .first()
      .locator("textarea");

    await firstTextarea.type("H", { delay: 100 }); // 100ms per char
    await firstTextarea.type("o", { delay: 100 });
    await firstTextarea.type("l", { delay: 100 });
    await firstTextarea.type("a", { delay: 100 });

    // Poll hasta que el texto final "Hola" persista (debounce coalesce los chars)
    await pollExerciseProgress(
      seedUserId,
      exerciseId,
      (row) => row.user_response_text === "Hola"
    );

    // Verificar que hay exactamente 1 fila (el debounce coalesce, no inserta 4)
    const { data: progress } = await supabaseAdmin
      .from("exercise_progress")
      .select("user_response_text, updated_at")
      .eq("user_id", seedUserId)
      .eq("exercise_id", exerciseId);

    expect(progress).toHaveLength(1);
    expect(progress?.[0]?.user_response_text).toBe("Hola");
  });

  test("[4-3] — Textarea typing updates state, onChange fires immediately", async ({
    page,
  }) => {
    const firstTextarea = page
      .getByTestId("exercise-card")
      .first()
      .locator("textarea");

    const testText = "Typing test response";
    await firstTextarea.fill(testText);

    // Verify textarea value updated immediately (before debounce saves)
    const currentValue = await firstTextarea.inputValue();
    expect(currentValue).toBe(testText);
  });
});

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
import { pollExerciseProgress } from "./_helpers/poll-progress";
import { getWorkshopSidebar } from "./_helpers/workshop";

/**
 * E2E Test Suite for Exercise Progress Persistence [4b-8]
 *
 * Tests that exercise responses and status persist across page reloads.
 */

test.describe("Exercise Persistence [4b-8]", () => {
  let seedUserId: string;
  let firstExerciseId: string;

  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops, seedUserId: rawSeedUserId } =
      await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    seedUserId = rawSeedUserId;

    const workshopId = workshops[0].id;
    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);

    const { data: exData } = await supabaseAdmin
      .from("exercises")
      .select("id")
      .eq("workshop_id", workshopId)
      .order("order", { ascending: true })
      .limit(1);
    firstExerciseId = exData?.[0]?.id || "";

    await loginAsSeedUser(page);
    await page.goto(`/taller/${workshops[0].slug}`);

    // Navigate to Taller
    const sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Taller")').click();

    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  });

  test("[4-8] — Write response + autosave → reload page → response text still there + status still 'in_progress'", async ({
    page,
  }) => {
    const firstCard = page.getByTestId("exercise-card").first();
    const textarea = firstCard.locator("textarea");

    const testResponse =
      "This is a test response that should persist after reload";
    await textarea.fill(testResponse);

    // Esperar a que el autosave persista en DB ANTES de recargar. El indicador
    // "Guardado" se desvanece a los 2s (efímero, frágil de atrapar). Poll DB.
    await pollExerciseProgress(
      seedUserId,
      firstExerciseId,
      (row) => row.user_response_text === testResponse
    );

    // Reload page
    await page.reload();
    await page.waitForURL(/\/taller\//, { timeout: 15000 });

    // Tras el reload, la app vuelve a la sección Inicio (activeSection es estado
    // client-side, no está en la URL). Re-navegar a Taller para ver ejercicios.
    const sidebarAfter = await getWorkshopSidebar(page);
    await sidebarAfter.locator('button:has-text("Taller")').click();
    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Verify response text is still there
    const reloadedTextarea = page
      .getByTestId("exercise-card")
      .first()
      .locator("textarea");
    const currentValue = await reloadedTextarea.inputValue();
    expect(currentValue).toBe(testResponse);

    // Verify status is still 'in_progress'
    const reloadedCard = page.getByTestId("exercise-card").first();
    const dataStatus = await reloadedCard.getAttribute("data-status");
    expect(dataStatus).toBe("in_progress");
  });

  test("[4-8] — Mark exercise 'done' → reload page → button shows 'Reabrir' + textarea disabled", async ({
    page,
  }) => {
    const firstCard = page.getByTestId("exercise-card").first();
    const textarea = firstCard.locator("textarea");

    // Type and mark done
    await textarea.fill("Final response");

    const doneBtn = firstCard.locator('button:has-text("Marcar como listo")');
    await doneBtn.click();

    // El botón pasa a "Reabrir" tras el save exitoso (optimistic + persistido)
    await expect(firstCard.locator('button:has-text("Reabrir")')).toBeVisible({
      timeout: 15000,
    });

    // Reload page
    await page.reload();
    await page.waitForURL(/\/taller\//, { timeout: 15000 });

    // Tras el reload, la app vuelve a la sección Inicio (activeSection es estado
    // client-side, no está en la URL). Re-navegar a Taller para ver ejercicios.
    const sidebarAfter = await getWorkshopSidebar(page);
    await sidebarAfter.locator('button:has-text("Taller")').click();
    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // After reload, verify button still shows "Reabrir"
    const reloadedCard = page.getByTestId("exercise-card").first();
    await expect(reloadedCard.locator('button:has-text("Reabrir")')).toBeVisible();

    // Verify textarea is disabled
    const reloadedTextarea = reloadedCard.locator("textarea");
    await expect(reloadedTextarea).toBeDisabled();

    // Verify status is 'done'
    const dataStatus = await reloadedCard.getAttribute("data-status");
    expect(dataStatus).toBe("done");

    // Verify response text is still there
    const currentValue = await reloadedTextarea.inputValue();
    expect(currentValue).toBe("Final response");
  });

  test("[4-8] — Progress bar reflects same completion state after reload", async ({
    page,
  }) => {
    // Mark 2 exercises done
    const exercises = page.getByTestId("exercise-card");
    const exerciseCount = await exercises.count();

    for (let i = 0; i < Math.min(2, exerciseCount); i++) {
      const card = exercises.nth(i);
      const textarea = card.locator("textarea");

      await textarea.fill(`Response ${i}`);

      const doneBtn = card.locator('button:has-text("Marcar como listo")');
      await doneBtn.click();
      // Esperar el optimistic update (botón Reabrir) = save confirmado
      await expect(card.locator('button:has-text("Reabrir")')).toBeVisible({
        timeout: 15000,
      });
    }

    // Reload — el progress se recalcula server-side con el estado persistido.
    // (Con ejercicios, el progress NO se actualiza optimista al marcar done —
    // usa el valor server del mount; recién tras reload refleja los done. Por
    // eso comparar antes/después es inconsistente: validamos el valor FINAL.)
    await page.reload();
    await page.waitForURL(/\/taller\//);

    // Secciones visitadas por el beforeEach: Inicio (landing) + Taller = 2.
    // + 2 ejercicios done = (2 + 2) / (5 + 4) = 4/9 = 44%.
    const progressBarAfter = page.locator('div[role="progressbar"]').first();
    await expect(progressBarAfter).toHaveAttribute("aria-valuenow", "44", {
      timeout: 15000,
    });
  });
});

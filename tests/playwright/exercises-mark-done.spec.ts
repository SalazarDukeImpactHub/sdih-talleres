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
 * E2E Test Suite for Mark as Done / Reabrir [4b-5]
 *
 * Tests state machine: in_progress → done (Marcar como listo) → in_progress (Reabrir)
 * Verifies button label changes, textarea disable, and DB status updates.
 */

let workshopId: string;
let seedUserId: string;
let exerciseId: string;

test.describe("Exercise Mark as Done / Reabrir [4b-5]", () => {
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

  test("[4-5] — Click 'Marcar como listo' with non-empty textarea → status='done', button changes to 'Reabrir'", async ({
    page,
  }) => {
    expect(exerciseId).toBeTruthy();
    expect(seedUserId).toBeTruthy();

    // Type response
    const firstCard = page.getByTestId("exercise-card").first();
    const textarea = firstCard.locator("textarea");
    await textarea.fill("Mi respuesta completada");

    // Click "Marcar como listo" (se habilita en cuanto hay texto, no espera autosave)
    const doneButton = firstCard.locator('button:has-text("Marcar como listo")');
    await expect(doneButton).toBeEnabled();
    await doneButton.click();

    // El botón pasa a "Reabrir" SOLO tras el save exitoso (optimistic update del
    // componente). Esperar esa señal — timeout generoso por el round-trip + retry.
    await expect(firstCard.locator('button:has-text("Reabrir")')).toBeVisible({
      timeout: 15000,
    });
    await expect(textarea).toBeDisabled();
    await expect(firstCard).toHaveAttribute("data-status", "done");

    // Confirmar en DB
    await pollExerciseProgress(
      seedUserId,
      exerciseId,
      (row) => row.status === "done"
    );
  });

  test("[4-5] — Click 'Reabrir' button (appears when status='done') → status='in_progress', button reverts to 'Marcar como listo'", async ({
    page,
  }) => {
    expect(exerciseId).toBeTruthy();
    expect(seedUserId).toBeTruthy();

    // Set up initial state: type, wait for autosave, mark as done
    const firstCard = page.getByTestId("exercise-card").first();
    const textarea = firstCard.locator("textarea");
    await textarea.fill("Mi respuesta");

    const doneButton = firstCard.locator('button:has-text("Marcar como listo")');
    await doneButton.click();
    const reabrirButton = firstCard.locator('button:has-text("Reabrir")');
    await expect(reabrirButton).toBeVisible({ timeout: 15000 });

    // Click "Reabrir" → vuelve a in_progress
    await reabrirButton.click();
    await expect(
      firstCard.locator('button:has-text("Marcar como listo")')
    ).toBeVisible({ timeout: 15000 });
    await expect(textarea).toBeEnabled();
    await expect(firstCard).toHaveAttribute("data-status", "in_progress");

    await pollExerciseProgress(
      seedUserId,
      exerciseId,
      (row) => row.status === "in_progress"
    );
  });

  test("[4-5] — Can type and autosave again after reopening exercise", async ({
    page,
  }) => {
    expect(exerciseId).toBeTruthy();
    expect(seedUserId).toBeTruthy();

    // Initial flow: type → mark done → reabrir
    const firstCard = page.getByTestId("exercise-card").first();
    const textarea = firstCard.locator("textarea");

    await textarea.fill("Respuesta inicial");

    const doneButton = firstCard.locator('button:has-text("Marcar como listo")');
    await doneButton.click();
    const reabrirButton = firstCard.locator('button:has-text("Reabrir")');
    await expect(reabrirButton).toBeVisible({ timeout: 15000 });
    await reabrirButton.click();
    await expect(
      firstCard.locator('button:has-text("Marcar como listo")')
    ).toBeVisible({ timeout: 15000 });

    // Now type additional text → autosave debe persistir el nuevo valor
    await textarea.fill("Respuesta inicial actualizada");
    await pollExerciseProgress(
      seedUserId,
      exerciseId,
      (row) => row.user_response_text === "Respuesta inicial actualizada"
    );
  });
});

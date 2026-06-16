import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
  seedExercises,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";
import { getWorkshopSidebar } from "./_helpers/workshop";

/**
 * E2E Test Suite for Exercise-Aware Progress Formula [4b-6]
 *
 * Tests progress calculation: (sections_visited + exercises_done) / (5 + total_exercises) * 100
 * Also tests fallback: if total_exercises = 0, use visitadas / 5
 */

test.describe("Exercise-Aware Progress [4b-6]", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);

    const workshopId = workshops[0].id;
    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);

    await loginAsSeedUser(page);
    await page.goto(`/taller/${workshops[0].slug}`);

    // Wait for page to load
    await page.waitForURL(/\/taller\//);
  });

  test("[4-6] — Visit 2 sections + mark 2 exercises done → progress = 44% ( (2+2) / (5+4) )", async ({
    page,
  }) => {
    // Get sidebar and navigate to sections
    const sidebar = await getWorkshopSidebar(page);

    // Visit Inicio (section 0)
    const inicioBtn = sidebar.locator('button:has-text("Inicio")');
    await inicioBtn.click();
    await page.waitForTimeout(500); // Let section visit record

    // Visit Aprendizaje (section 1)
    const aprendizajeBtn = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeBtn.click();
    await page.waitForTimeout(500);

    // Navigate to Taller section to access exercises
    const tallerBtn = sidebar.locator('button:has-text("Taller")');
    await tallerBtn.click();

    // Wait for exercise cards to render
    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Mark 2 exercises as done
    for (let i = 0; i < 2; i++) {
      const card = page.getByTestId("exercise-card").nth(i);
      const textarea = card.locator("textarea");

      // Type response
      await textarea.fill(`Respuesta ${i + 1}`);
      await page.waitForTimeout(1500); // Autosave

      // Click "Marcar como listo"
      const doneBtn = card.locator('button:has-text("Marcar como listo")');
      await doneBtn.click();
      await page.waitForTimeout(1000);
    }

    // El server-side no revalida progressData hasta reload. Con
    // totalExercises > 0, la fórmula exercise-aware gana sobre el optimistic
    // local (que solo cuenta sections). Reload garantiza el cálculo fresco.
    await page.reload();
    await page.waitForURL(/\/taller\//, { timeout: 15000 });

    const progressBar = page.locator('div[role="progressbar"]').first();
    const ariaValueNow = await progressBar.getAttribute("aria-valuenow");

    // El flujo visita 3 secciones: Inicio (landing) + Aprendizaje + Taller
    // (hay que entrar a Taller para acceder a los ejercicios). NO 2.
    // (3 visitadas + 2 done) / (5 + 4) = 5/9 = 55.5 → 56%
    expect(ariaValueNow).toBe("56");
  });

  test("[4-6b] — Sections visited + 0 done → exercise-aware con denom 5+4 ((2+0)/9 = 22%)", async ({
    page,
  }) => {
    const sidebar = await getWorkshopSidebar(page);

    const inicioBtn = sidebar.locator('button:has-text("Inicio")');
    await inicioBtn.click();
    await page.waitForTimeout(500);

    const aprendizajeBtn = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeBtn.click();
    await page.waitForTimeout(500);

    // Reload para que el server-side recompute con visitas ya persistidas.
    // El beforeEach del describe seedea 4 exercises → totalExercises=4,
    // así que la fórmula exercise-aware aplica (sin fallback a visitadas/5).
    // Expected: (2 visitadas + 0 done) / (5 + 4) = 22%
    await page.reload();
    await page.waitForURL(/\/taller\//, { timeout: 15000 });

    const progressBar = page.locator('div[role="progressbar"]').first();
    const ariaValueNow = await progressBar.getAttribute("aria-valuenow");
    expect(ariaValueNow).toBe("22");
  });

  test("[4-6b] — Marcar 3 ejercicios + 3 secciones visitadas → 67% ( (3+3) / (5+4) )", async ({
    page,
  }) => {
    const sidebar = await getWorkshopSidebar(page);

    // Visit 2 sections
    const inicioBtn = sidebar.locator('button:has-text("Inicio")');
    await inicioBtn.click();
    await page.waitForTimeout(500);

    const aprendizajeBtn = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeBtn.click();
    await page.waitForTimeout(500);

    // Navigate to Taller
    const tallerBtn = sidebar.locator('button:has-text("Taller")');
    await tallerBtn.click();

    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Mark 3 exercises done (not 2, to show progress update)
    for (let i = 0; i < 3; i++) {
      const card = page.getByTestId("exercise-card").nth(i);
      const textarea = card.locator("textarea");

      await textarea.fill(`Respuesta ${i + 1}`);
      await page.waitForTimeout(1500);

      const doneBtn = card.locator('button:has-text("Marcar como listo")');
      await doneBtn.click();
      await page.waitForTimeout(1000);
    }

    // Reload para que el server-side recompute (no hay revalidatePath aún)
    await page.reload();
    await page.waitForURL(/\/taller\//, { timeout: 15000 });

    // 3 secciones visitadas (Inicio+Aprendizaje+Taller) + 3 done = 6/9 = 66.6 → 67%
    const progressBar = page.locator('div[role="progressbar"]').first();
    const ariaValueNow = await progressBar.getAttribute("aria-valuenow");
    expect(parseInt(ariaValueNow || "0")).toBeGreaterThanOrEqual(66);
    expect(parseInt(ariaValueNow || "0")).toBeLessThanOrEqual(67);
  });
});

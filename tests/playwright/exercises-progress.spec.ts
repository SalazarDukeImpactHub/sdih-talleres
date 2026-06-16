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
    // Navegar Inicio → Aprendizaje → Taller. En mobile el drawer se cierra al
    // clickear un tab, así que re-obtenemos el sidebar antes de cada click
    // (getWorkshopSidebar re-abre el drawer si hace falta).
    await visitSection(page, "Inicio");
    await visitSection(page, "Aprendizaje");
    await visitSection(page, "Taller");

    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Marcar 2 ejercicios — esperar el botón "Reabrir" (señal de save confirmado)
    for (let i = 0; i < 2; i++) {
      const card = page.getByTestId("exercise-card").nth(i);
      await card.locator("textarea").fill(`Respuesta ${i + 1}`);
      const doneBtn = card.locator('button:has-text("Marcar como listo")');
      await doneBtn.click();
      await expect(card.locator('button:has-text("Reabrir")')).toBeVisible({
        timeout: 15000,
      });
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
    // Inicio (landing, ya visitado) + Aprendizaje = 2 secciones distintas
    await visitSection(page, "Inicio");
    await visitSection(page, "Aprendizaje");

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
    // Inicio (landing) + Aprendizaje + Taller = 3 secciones
    await visitSection(page, "Inicio");
    await visitSection(page, "Aprendizaje");
    await visitSection(page, "Taller");

    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Marcar 3 ejercicios — esperar la señal "Reabrir"
    for (let i = 0; i < 3; i++) {
      const card = page.getByTestId("exercise-card").nth(i);
      await card.locator("textarea").fill(`Respuesta ${i + 1}`);
      const doneBtn = card.locator('button:has-text("Marcar como listo")');
      await doneBtn.click();
      await expect(card.locator('button:has-text("Reabrir")')).toBeVisible({
        timeout: 15000,
      });
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

/**
 * Navega a una sección re-obteniendo el sidebar antes del click. En mobile el
 * drawer se cierra al clickear un tab, así que reusar una referencia vieja del
 * sidebar rompe. getWorkshopSidebar re-abre el drawer si está cerrado.
 */
async function visitSection(
  page: import("@playwright/test").Page,
  sectionName: string
) {
  const sidebar = await getWorkshopSidebar(page);
  await sidebar.locator(`button:has-text("${sectionName}")`).click();
  // dar tiempo a registrar la visita (Server Action a sa-east-1)
  await page.waitForTimeout(800);
}

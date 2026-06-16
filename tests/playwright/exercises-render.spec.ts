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
 * E2E Test Suite for Exercise Card Render [4a-1]
 *
 * Selectores: usamos data-testid="exercise-card" + data-status="pending"
 * para ser robustos a cambios de copy/clases. Los textos visibles se chequean
 * por separado, sin depender de ellos para identificar elementos.
 */

test.describe("Exercise Cards [4a-1] — Render", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);

    const workshopId = workshops[0].id;
    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);

    await loginAsSeedUser(page);
    await page.goto(`/taller/${workshops[0].slug}`);

    // Navegar a la sección Taller (helper resuelve drawer en mobile)
    const sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Taller")').click();

    // Esperar a que el primer ejercicio renderee
    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  });

  test("[4-1] — 4 exercise cards render with correct structure", async ({
    page,
  }) => {
    const cards = page.getByTestId("exercise-card");
    await expect(cards).toHaveCount(4);

    // Títulos en orden del seed (helper inserta order 1-4)
    await expect(
      page.getByText("Configura tu primer store de memoria")
    ).toBeVisible();
    await expect(page.getByText("Implementá búsqueda semántica")).toBeVisible();
    await expect(page.getByText("Conectá tu storage a un LLM")).toBeVisible();
    await expect(page.getByText("Optimizá la búsqueda de memoria")).toBeVisible();

    // Objective del primero
    await expect(
      page.getByText("Aprender a crear un almacén de vectores")
    ).toBeVisible();

    // Cada card tiene su pre / textarea / copy-button
    const firstCard = cards.first();
    await expect(firstCard.locator("pre")).toContainText("vectores");
    await expect(firstCard.locator("textarea")).toHaveValue("");
    await expect(firstCard.getByTestId("copy-button")).toBeVisible();

    // Botón "Marcar como listo" disabled inicialmente (textarea vacía)
    const markDoneBtn = firstCard.locator(
      'button:has-text("Marcar como listo")'
    );
    await expect(markDoneBtn).toBeDisabled();

    // Status inicial = pending (data-attribute estable, no depende del badge text)
    const allPending = await cards.evaluateAll((els) =>
      els.every((el) => el.getAttribute("data-status") === "pending")
    );
    expect(allPending).toBe(true);
  });

  test("[4-1] — Textarea placeholder visible", async ({ page }) => {
    const firstTextarea = page
      .getByTestId("exercise-card")
      .first()
      .locator("textarea");
    await expect(firstTextarea).toHaveAttribute("placeholder", /respuesta/i);
  });

  test("[4-1] — Status badge muestra 'Pendiente' inicialmente", async ({
    page,
  }) => {
    // Scope al primer card para evitar strict mode violation
    // (los 4 ejercicios tienen el mismo badge "Pendiente")
    const firstCard = page.getByTestId("exercise-card").first();
    await expect(firstCard.getByText("Pendiente")).toBeVisible();
  });
});

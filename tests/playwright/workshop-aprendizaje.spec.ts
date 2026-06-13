import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";
import { getWorkshopSidebar } from "./_helpers/workshop";

/**
 * E2E Tests para Change 3a: Aprendizaje Section / Carousel (4 specs)
 *
 * Verifies carousel functionality:
 * - First slide visible on load
 * - Next button advances slide
 * - Dot indicators clickable
 * - Notes toggle shows/hides instructor notes
 */

test.describe("Workshop [3a] — Aprendizaje Section (Carousel)", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3a-9] aprendizaje-load — slide 1 visible, carousel structure present", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Verify section title
    await expect(page.getByText("Módulo de Aprendizaje")).toBeVisible();

    // Verify first slide is visible
    await expect(
      page.getByText("Concepto Clave 1")
    ).toBeVisible();
  });

  test("[3a-10] aprendizaje-next-button — click next → slide 2 visible", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Find next button (→ or "Siguiente")
    const nextButton = page.locator('button[aria-label="Siguiente diapositiva"]').first();
    await nextButton.click();

    // Verify slide 2 content is visible
    await expect(
      page.getByText("Concepto Clave 2")
    ).toBeVisible();
  });

  test("[3a-11] aprendizaje-dot-indicators — dots clickable, change active slide", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Find dot indicators
    const dots = page.locator('button[aria-label^="Ir a diapositiva"]');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(0);

    // El fixture tiene 2 slides — click en el 2do dot
    if (dotCount >= 2) {
      const secondDot = dots.nth(1);
      await secondDot.click();

      // Verify slide 2 content
      await expect(
        page.getByText("Concepto Clave 2")
      ).toBeVisible();
    }
  });

  test("[3a-12] aprendizaje-notes-toggle — notes visible, toggle hides them", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Verify notes are visible initially (or notes toggle button exists)
    const notesToggle = page.locator(
      'button:has-text("Ver notas"), button:has-text("Ocultar notas")'
    ).first();

    // El toggle arranca cerrado ("Ver notas"). Abrir → notas visibles → cerrar.
    await expect(notesToggle).toBeVisible();
    await notesToggle.click();
    await expect(
      page.locator('text=Notas para el instructor: hacer énfasis en tal cosa')
    ).toBeVisible();

    await notesToggle.click();
    const notesVisible = await page
      .locator('text=Notas para el instructor: hacer énfasis en tal cosa')
      .isVisible();
    expect(notesVisible).toBe(false);
  });
});

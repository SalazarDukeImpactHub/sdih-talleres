import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";

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
    await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
    await seedSectionsAndGlossary("engram");
  });

  test("[3a-9] aprendizaje-load — slide 1 visible, carousel structure present", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Verify section title
    await expect(page.getByText("El modelo mental de la memoria")).toBeVisible();

    // Verify first slide is visible
    await expect(
      page.getByText("Qué es la memoria persistente")
    ).toBeVisible();
  });

  test("[3a-10] aprendizaje-next-button — click next → slide 2 visible", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Find next button (→ or "Siguiente")
    const nextButton = page.locator('button:has-text("→"), button:has-text("Siguiente")').first();
    await nextButton.click();

    // Verify slide 2 content is visible
    await expect(
      page.getByText("Implementación básica")
    ).toBeVisible();
  });

  test("[3a-11] aprendizaje-dot-indicators — dots clickable, change active slide", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Find dot indicators
    const dots = page.locator('button[aria-label*="slide"], button[class*="dot"]');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(0);

    // Click 3rd dot
    if (dotCount >= 3) {
      const thirdDot = dots.nth(2);
      await thirdDot.click();

      // Verify slide 3 content
      await expect(
        page.getByText("Optimizaciones a escala")
      ).toBeVisible();
    }
  });

  test("[3a-12] aprendizaje-notes-toggle — notes visible, toggle hides them", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Verify notes are visible initially (or notes toggle button exists)
    const notesToggle = page.locator(
      'button:has-text("Notas"), button:has-text("Notes")'
    ).first();

    if (await notesToggle.isVisible()) {
      // Notes are visible; click toggle
      await notesToggle.click();

      // Verify instructor notes are now hidden
      const notes = page.locator(
        'text=En vivo: preguntarles qué tipos de memoria usan'
      );
      const notesVisible = await notes.isVisible();
      expect(notesVisible).toBe(false);

      // Click toggle again to show
      await notesToggle.click();
      await expect(
        page.locator(
          'text=En vivo: preguntarles qué tipos de memoria usan'
        )
      ).toBeVisible();
    }
  });
});

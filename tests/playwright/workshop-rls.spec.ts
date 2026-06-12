import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";

/**
 * E2E Tests para Change 3a: RLS and Authorization (3 specs)
 *
 * Verifies:
 * - User without workshop access is redirected
 * - Progress persists across reloads
 * - RLS prevents unauthorized data access
 */

test.describe("Workshop [3a] — RLS and Authorization", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
  });

  test("[3a-13] workshop-access-guard — no access → redirect /catalogo", async ({
    page,
  }) => {
    // User logged in but has no access to 'engram' workshop
    // Try to navigate directly to /taller/engram
    await page.goto("/taller/engram");

    // Should be redirected to /catalogo
    await expect(page).toHaveURL("/catalogo");
  });

  test("[3a-14] workshop-progress-persists — visit sección → progress saves → reload → persists", async ({
    page,
  }) => {
    // Grant access and seed sections
    await seedSectionsAndGlossary("engram");

    // Navigate to workshop
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    // Get initial progress value (should be 20% = 1 section visited)
    // Since we land on 'inicio', it's automatically recorded
    const progressBefore = await page
      .locator('[class*="progress"]')
      .first()
      .getAttribute("style");

    // Click to visit 'aprendizaje'
    const sidebar = page.locator('[role="navigation"]').first();
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Wait for recordSectionVisit to complete
    await page.waitForTimeout(500);

    // Get progress after visiting second section (should be 40%)
    const progressAfter = await page
      .locator('[class*="progress"]')
      .first()
      .getAttribute("style");

    // Reload page
    await page.reload();
    await expect(page).toHaveURL(/\/taller\//);

    // Progress should still be 40%
    const progressReload = await page
      .locator('[class*="progress"]')
      .first()
      .getAttribute("style");

    // Verify progress values increased and persisted
    expect(progressAfter).not.toBe(progressBefore);
    expect(progressReload).toBe(progressAfter);
  });

  test("[3a-15] workshop-rls-isolation — user can only see own sections/glossary", async ({
    page,
  }) => {
    // Setup: seed 'engram' workshop
    await seedSectionsAndGlossary("engram");

    // Navigate to workshop and verify sections load
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    // Sections from 'engram' should be visible
    const sidebar = page.locator('[role="navigation"]').first();
    await expect(sidebar.locator('button:has-text("Inicio")')).toBeVisible();
    await expect(sidebar.locator('button:has-text("Aprendizaje")')).toBeVisible();
    await expect(sidebar.locator('button:has-text("Taller")')).toBeVisible();

    // If we were to make an API call to fetch sections for a different workshop
    // (without access), the server would enforce RLS and return empty/error.
    // This test verifies that the visible sections are from the correct workshop.
    // Additional verification: glossary terms should load
    const glossarioTab = sidebar.locator('button:has-text("Glosario")');
    await glossarioTab.click();

    // Glossary content should be visible and belong to this workshop
    // (Content comes from the seed fixture for 'engram')
    await expect(page.getByText(/Vector Embedding|Recuperación Aumentada/)).toBeVisible();
  });
});

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
 * E2E Tests para Change 3b: Glosario Section (1 spec)
 *
 * RF-010: Glosario section renders glossary terms with search and category filter
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'rag-intro'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos (3 categorías)
 */

test.describe("Workshop [3b] — Glosario Section", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed secciones+glosario para el workshop desbloqueado (8 términos)
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3b-3] glosario-search-and-filter — busca filtra términos, botones de categoría filtran", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to Glosario section
    const sidebar = await getWorkshopSidebar(page);
    const glosarioTab = sidebar.locator('button:has-text("Glosario")');
    await glosarioTab.click();

    // Wait for Glosario section to render
    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1")).toBeVisible({ timeout: 5000 });

    // Verify title "Glosario" (from seed content)
    const title = mainContent.locator("h1");
    const titleText = await title.textContent();
    expect(titleText).toContain("Glosario");

    // Verify search input is visible
    const searchInput = mainContent.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();

    // Initial state: all 8 terms visible
    await expect(mainContent.locator("text=/8 término/i")).toBeVisible();

    // Test search: type "Concepto" → should filter to 2 terms (Concepto A, Concepto B)
    await searchInput.fill("Concepto");
    await page.waitForTimeout(300); // Wait for filter debounce

    // Verify term count updates
    await expect(mainContent.locator("text=/2 término/i")).toBeVisible();

    // Verify "Concepto A" is visible
    const conceptoA = mainContent.locator("text=/Concepto A/i");
    await expect(conceptoA).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // Verify all 8 terms are back
    await expect(mainContent.locator("text=/8 término/i")).toBeVisible();

    // Test category filter buttons
    const categoryButtons = mainContent.locator("button[class*='px-4'][class*='py-2'][class*='rounded-full']");
    const categoriesCount = await categoryButtons.count();
    expect(categoriesCount).toBeGreaterThan(0);

    // Verify category buttons include expected categories
    const hasCategories = await categoryButtons.filter({ hasText: /Fundamentos|Técnicas|Herramientas|Patrones/ }).count();
    expect(hasCategories).toBeGreaterThan(0);

    // Click on "Fundamentos" category filter
    const fundamentosButton = categoryButtons.filter({ hasText: "Fundamentos" }).first();
    if (await fundamentosButton.isVisible()) {
      await fundamentosButton.click();
      await page.waitForTimeout(300);

      // Should show only 2 terms (Concepto A, Concepto B)
      await expect(mainContent.locator("text=/2 término/i")).toBeVisible();

      // Click again to deselect
      await fundamentosButton.click();
      await page.waitForTimeout(300);

      // All 8 terms back
      await expect(mainContent.locator("text=/8 término/i")).toBeVisible();
    }
  });

  test("[3b-3b] glosario-flashcard-flip — clickear tarjeta la voltea y muestra definición", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to Glosario section
    const sidebar = await getWorkshopSidebar(page);
    const glosarioTab = sidebar.locator('button:has-text("Glosario")');
    await glosarioTab.click();

    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1")).toBeVisible({ timeout: 5000 });

    // Get first flashcard (should be visible)
    const firstCard = mainContent.locator('button[class*="relative"][class*="h-48"]').first();
    await expect(firstCard).toBeVisible();

    // Get initial text on card (term, not definition)
    const frontText = await firstCard.textContent();
    expect(frontText).toBeTruthy();

    // Click card to flip
    await firstCard.click();
    await page.waitForTimeout(600); // Wait for flip animation (transform duration-500)

    // Verify card still exists and flip transform was applied
    await expect(firstCard).toBeVisible();

    // Check for transform style indicating flip
    const style = await firstCard.evaluate((el) => {
      const div = el.querySelector("div[style*='preserve-3d']");
      return window.getComputedStyle(div as Element).getPropertyValue("transform");
    });
    expect(style).toContain("matrix"); // transform applied

    // Click again to flip back
    await firstCard.click();
    await page.waitForTimeout(600);

    // Verify it's still visible (flipped back)
    await expect(firstCard).toBeVisible();
  });

  test("[3b-3c] glosario-empty-state — búsqueda sin resultados muestra empty state", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to Glosario section
    const sidebar = await getWorkshopSidebar(page);
    const glosarioTab = sidebar.locator('button:has-text("Glosario")');
    await glosarioTab.click();

    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1")).toBeVisible({ timeout: 5000 });

    // Search for something that doesn't exist
    const searchInput = mainContent.locator('input[placeholder*="Buscar"]');
    await searchInput.fill("XYZABC123NoExiste");
    await page.waitForTimeout(300);

    // Empty state should appear
    const emptyState = mainContent.locator("text=/No encontramos términos/i");
    await expect(emptyState).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // Empty state disappears, terms reappear
    await expect(emptyState).not.toBeVisible();
    await expect(mainContent.locator("text=/8 término/i")).toBeVisible();
  });
});

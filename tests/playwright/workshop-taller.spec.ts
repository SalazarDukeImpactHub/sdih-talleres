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
 * E2E Tests para Change 3b: Taller Section (1 spec)
 *
 * RF-008: Taller section renders placeholder (exercises in change 4)
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'rag-intro'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos
 */

test.describe("Workshop [3b] — Taller Section", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed secciones+glosario para el workshop desbloqueado
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3b-1] taller-section-render — sección Taller renderiza título, instrucciones y placeholder", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to Taller section
    const sidebar = await getWorkshopSidebar(page);
    const tallerTab = sidebar.locator('button:has-text("Taller")');
    await tallerTab.click();

    // Wait for Taller section to render
    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1")).toBeVisible({ timeout: 5000 });

    // Verify title "Ejercicios" (from seed content)
    const title = mainContent.locator("h1");
    const titleText = await title.textContent();
    expect(titleText).toContain("Ejercicios");

    // Verify instructions are visible
    const instructions = mainContent.locator("p");
    const hasInstructions = await instructions.filter({ hasText: /resolv|ejercicio/i }).count();
    expect(hasInstructions).toBeGreaterThan(0);

    // Verify placeholder message appears (strict mode: matches 2 elements, use first)
    const placeholder = mainContent.locator("text=/próximamente|disponibles/i").first();
    await expect(placeholder).toBeVisible();

    // Verify no interactive textareas or exercise form elements
    const textareas = mainContent.locator("textarea");
    const formElements = mainContent.locator("form");
    expect(await textareas.count()).toBe(0);
    expect(await formElements.count()).toBe(0);
  });
});

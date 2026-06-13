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
 * E2E Tests para Change 3b: Instalación Section (1 spec)
 *
 * RF-009: Instalación section renders numbered steps with code blocks and copy button
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'rag-intro'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos
 */

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("Workshop [3b] — Instalación Section", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed secciones+glosario para el workshop desbloqueado
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3b-2] instalacion-section-steps — pasos numerados con código y botón de copiar", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to Instalación section
    const sidebar = await getWorkshopSidebar(page);
    const instalacionTab = sidebar.locator('button:has-text("Instalación")');
    await instalacionTab.click();

    // Wait for Instalación section to render
    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1")).toBeVisible({ timeout: 5000 });

    // Verify title "Guía de Instalación" (from seed content)
    const title = mainContent.locator("h1");
    const titleText = await title.textContent();
    expect(titleText).toContain("Guía de Instalación");

    // Verify steps are rendered (3 steps in seed data)
    const stepElements = mainContent.locator("div[class*='relative']");
    expect(await stepElements.count()).toBeGreaterThan(0);

    // Verify step titles are visible
    await expect(mainContent.locator("text=Requisitos")).toBeVisible();
    await expect(mainContent.locator("text=Instala dependencias")).toBeVisible();
    await expect(mainContent.locator("text=Configura")).toBeVisible();

    // Verify code blocks are rendered
    const codeBlocks = mainContent.locator("pre");
    const codeCount = await codeBlocks.count();
    expect(codeCount).toBeGreaterThanOrEqual(3);

    // Verify language labels are visible
    await expect(mainContent.locator("text=bash").first()).toBeVisible();

    // Verify copy buttons exist
    const copyButtons = mainContent.locator("button:has-text('Copiar')");
    const copyButtonCount = await copyButtons.count();
    expect(copyButtonCount).toBeGreaterThanOrEqual(3);

    // Test copy button functionality on first code block
    const firstCopyButton = copyButtons.first();
    await firstCopyButton.click();

    // Verify "✓ Copiado" feedback appears
    await expect(mainContent.locator("text=/✓ Copiado|Copiado/")).toBeVisible({ timeout: 2500 });

    // Verify feedback disappears after 2s
    await page.waitForTimeout(2100);
    const copiado = mainContent.locator("text=/✓ Copiado/");
    const isVisible = await copiado.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    // Verify copy button shows "Copiar" again
    await expect(firstCopyButton).toContainText("Copiar");

    // Verify success message at end (from seed content)
    const successMessage = mainContent.locator("text=/¡Instalación completa/i");
    await expect(successMessage).toBeVisible();
  });

  test("[3b-2b] instalacion-multiple-copy-buttons — multiple code blocks have independent copy state", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to Instalación section
    const sidebar = await getWorkshopSidebar(page);
    const instalacionTab = sidebar.locator('button:has-text("Instalación")');
    await instalacionTab.click();

    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1")).toBeVisible({ timeout: 5000 });

    // Get all copy buttons
    const copyButtons = mainContent.locator("button:has-text('Copiar')");
    const firstButton = copyButtons.nth(0);
    const secondButton = copyButtons.nth(1);

    // Click first button
    await firstButton.click();
    await expect(mainContent.locator("text=/✓ Copiado/").first()).toBeVisible({ timeout: 2500 });

    // Second button should still show "Copiar", not "Copiado"
    await expect(secondButton).toContainText("Copiar");

    // Click second button
    await secondButton.click();
    const copiados = mainContent.locator("text=/✓ Copiado/");
    expect(await copiados.count()).toBeGreaterThan(0);
  });
});

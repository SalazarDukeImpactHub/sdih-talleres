import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";

/**
 * E2E Tests para Change 3a: Inicio Section (3 specs)
 *
 * Verifies that the Inicio section renders correctly:
 * - Hero with title + description
 * - 4 quick-link cards
 * - Click on quick-link navigates to target section
 */

test.describe("Workshop [3a] — Inicio Section", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
    await seedSectionsAndGlossary("engram");
  });

  test("[3a-6] inicio-renders — hero + title + description visible", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    // Verify hero title (from seed: 'Memoria Persistente para Agentes de IA')
    await expect(
      page.getByText("Memoria Persistente para Agentes de IA")
    ).toBeVisible();

    // Verify description
    await expect(
      page.getByText(/Aprende cómo implementar un sistema de recuerdo/)
    ).toBeVisible();
  });

  test("[3a-7] inicio-quick-links — 4 cards (Aprendizaje, Taller, Instalación, Glosario)", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    // Verify quick-link cards
    await expect(page.locator("text=Aprendizaje")).toBeVisible();
    await expect(page.locator("text=Taller")).toBeVisible();
    await expect(page.locator("text=Instalación")).toBeVisible();
    await expect(page.locator("text=Glosario")).toBeVisible();
  });

  test("[3a-8] inicio-quick-link-click — click card navega a sección", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    // Find and click a quick-link card (e.g., "Aprendizaje")
    const aprendizajeCard = page.locator("text=Aprendizaje").first();
    await aprendizajeCard.click();

    // Verify active tab changed to 'aprendizaje'
    const sidebar = page.locator('[role="navigation"]').first();
    const activeTab = sidebar.locator('button[aria-current="page"]');
    const activeLabelEl = activeTab.locator("text=Aprendizaje");
    await expect(activeLabelEl).toBeVisible();
  });
});

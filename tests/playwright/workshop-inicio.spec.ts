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
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3a-6] inicio-renders — hero + title + description visible", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Verify hero title (from seed: 'Memoria Persistente para Agentes de IA')
    await expect(
      page.getByText("Bienvenido al Taller")
    ).toBeVisible();

    // Verify description
    await expect(
      page.getByText(/Aprende conceptos clave/)
    ).toBeVisible();
  });

  test("[3a-7] inicio-quick-links — 4 cards (Aprendizaje, Taller, Instalación, Glosario)", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Verify quick-link cards
    await expect(page.getByRole("button", { name: "Ir a Aprendizaje" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ir a Taller" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ir a Instalación" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ir a Glosario" })).toBeVisible();
  });

  test("[3a-8] inicio-quick-link-click — click card navega a sección", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Find and click a quick-link card (e.g., "Aprendizaje")
    const aprendizajeCard = page.getByRole("button", { name: "Ir a Aprendizaje" });
    await aprendizajeCard.click();

    // Verify active tab changed to 'aprendizaje'
    const sidebar = await getWorkshopSidebar(page);
    const activeTab = sidebar.locator('button[aria-current="page"]');
    const activeLabelEl = activeTab.locator("text=Aprendizaje");
    await expect(activeLabelEl).toBeVisible();
  });
});

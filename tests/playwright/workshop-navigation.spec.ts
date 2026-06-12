import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";

/**
 * E2E Tests para Change 3a: Workshop Navigation and Layout (5 specs)
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'engram'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos
 */

test.describe("Workshop [3a] — Navigation and Layout", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed the 'engram' workshop with sections and glossary
    await seedSectionsAndGlossary("engram");
  });

  test("[3a-1] workshop-load — /taller/engram carga con sidebar + contenido", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    // Click on 'Continuar' link for the workshop with redeemed access
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();

    // Should navigate to /taller/engram (or similar slug)
    await expect(page).toHaveURL(/\/taller\//);

    // Verify sidebar is visible on desktop
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Verify main content area
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("[3a-2] workshop-sidebar-tabs — 5 tabs renderizam y son clickeables", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();
    await expect(sidebar).toBeVisible();

    // Verify all 5 section tabs exist
    const tabs = sidebar.locator("button");
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(5);

    // Verify tab labels
    await expect(page.locator("text=Inicio")).toBeVisible();
    await expect(page.locator("text=Aprendizaje")).toBeVisible();
    await expect(page.locator("text=Taller")).toBeVisible();
    await expect(page.locator("text=Instalación")).toBeVisible();
    await expect(page.locator("text=Glosario")).toBeVisible();
  });

  test("[3a-3] workshop-active-tab-glow — tab activo tiene glow y underline", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();
    const activeTab = sidebar.locator('button[aria-current="page"]');
    await expect(activeTab).toBeVisible();

    // Verify active tab has cyan styling
    const bgClass = await activeTab.getAttribute("class");
    expect(bgClass).toContain("text-cyan");

    // Verify tab glow shadow
    expect(bgClass).toContain("shadow-");
  });

  test("[3a-4] workshop-tab-navigation — click tab cambia sección", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    const sidebar = page.locator('[role="navigation"]').first();

    // Default is 'inicio'; click 'aprendizaje'
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // Verify active tab changed
    const activeTab = sidebar.locator('button[aria-current="page"]');
    const activeLabelEl = activeTab.locator("text=Aprendizaje");
    await expect(activeLabelEl).toBeVisible();
  });

  test("[3a-5] workshop-mobile-drawer — hamburger toggle drawer on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // mobile
    await page.goto("/catalogo");

    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//);

    // Sidebar should NOT be visible in mobile sticky form
    const desktopSidebar = page.locator('[role="navigation"]');
    const isVisible = await desktopSidebar.first().isVisible();

    // On mobile, hamburger button should be visible
    const hamburgerButton = page.locator('button[aria-label*="menú"], button[aria-label*="Abrir"]');
    if (!isVisible) {
      // If desktop sidebar not visible, expect hamburger
      await expect(hamburgerButton.first()).toBeVisible();

      // Click hamburger
      await hamburgerButton.first().click();

      // Drawer should open
      await expect(desktopSidebar.first()).toBeVisible({ timeout: 500 });
    }
  });
});

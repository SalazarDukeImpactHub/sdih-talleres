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
 * E2E Tests para Change 3a: Workshop Navigation and Layout (5 specs)
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'engram'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos
 */

test.describe("Workshop [3a] — Navigation and Layout", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed secciones+glosario para el workshop DESBLOQUEADO (rag-intro, UUID real)
    await seedSectionsAndGlossary(workshops[0].id);
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
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Sidebar visible (drawer en mobile, sticky en desktop — el helper resuelve)
    const sidebar = await getWorkshopSidebar(page);
    await expect(sidebar).toBeVisible();

    // Verify main content area
    const mainContent = page.locator("main").first();
    await expect(mainContent).toBeVisible();
  });

  test("[3a-2] workshop-sidebar-tabs — 5 tabs renderizam y son clickeables", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
    await expect(sidebar).toBeVisible();

    // Verify all 5 section tabs exist
    const tabs = sidebar.locator("button");
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(5);

    // Verify tab labels
    await expect(sidebar.locator("text=Inicio")).toBeVisible();
    await expect(sidebar.locator("text=Aprendizaje")).toBeVisible();
    await expect(sidebar.locator("text=Taller")).toBeVisible();
    await expect(sidebar.locator("text=Instalación")).toBeVisible();
    await expect(sidebar.locator("text=Glosario")).toBeVisible();
  });

  test("[3a-3] workshop-active-tab-glow — tab activo tiene glow y underline", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
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
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);

    // Default is 'inicio'; click 'aprendizaje'
    const aprendizajeTab = sidebar.locator('button:has-text("Aprendizaje")');
    await aprendizajeTab.click();

    // En mobile el drawer se cierra al clickear un tab (UX esperado).
    // Verifico por el contenido renderizado en main, no por el aria-current
    // del sidebar (que puede estar cerrado).
    await expect(
      page.locator("main").getByRole("heading", { name: "Módulo de Aprendizaje" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("[3a-5] workshop-mobile-drawer — hamburger toggle drawer on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // mobile
    await page.goto("/catalogo");

    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Sidebar desktop oculto en mobile (hidden md:flex) — solo el drawer aparece.
    const desktopSidebar = page.getByRole("navigation", { name: "Workshop sections" });
    await expect(desktopSidebar).not.toBeVisible();

    // Drawer móvil arranca cerrado
    const mobileDrawer = page.getByRole("navigation", { name: "Workshop sections mobile" });
    await expect(mobileDrawer).not.toBeVisible();

    // Click hamburger → drawer móvil abierto
    const hamburgerButton = page.getByRole("button", { name: "Abrir menú" });
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();
    await expect(mobileDrawer).toBeVisible({ timeout: 2000 });
  });
});

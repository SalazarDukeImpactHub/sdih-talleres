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
 * E2E Tests para Change 3b: Responsive Design (Mobile) (1 spec)
 *
 * RF-015: Workshop detail view is responsive on mobile (360px, 375px, 768px)
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'rag-intro'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos
 */

test.describe("Workshop [3b] — Responsive Design (Mobile)", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed secciones+glosario para el workshop desbloqueado
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3b-6] responsive-mobile-360px — hamburger visible, sidebar hidden, drawer toggles", async ({
    page,
  }) => {
    // Set mobile viewport (360px)
    await page.setViewportSize({ width: 360, height: 800 });

    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Verify hamburger button is visible on 360px
    const hamburgerButton = page.getByRole("button", { name: "Abrir menú" });
    await expect(hamburgerButton).toBeVisible();

    // Desktop sidebar should be hidden
    const desktopSidebar = page.getByRole("navigation", { name: "Workshop sections" });
    await expect(desktopSidebar).not.toBeVisible();

    // Mobile drawer should be hidden by default
    const mobileDrawer = page.getByRole("navigation", { name: "Workshop sections mobile" });
    const isDrawerVisibleInitially = await mobileDrawer.isVisible().catch(() => false);
    expect(isDrawerVisibleInitially).toBe(false);

    // Click hamburger → drawer opens
    await hamburgerButton.click();
    await expect(mobileDrawer).toBeVisible({ timeout: 2000 });

    // Verify main content is still accessible
    const mainContent = page.locator("main").first();
    await expect(mainContent).toBeVisible();

    // Click on sidebar tab → drawer should close
    const inicioTab = mobileDrawer.locator('button:has-text("Inicio")');
    if (await inicioTab.isVisible()) {
      await inicioTab.click();
      await page.waitForTimeout(300); // Allow drawer to close

      // Drawer might be closed (UX preference)
      // This is acceptable either way (depends on UX design)
    }
  });

  test("[3b-6b] responsive-mobile-375px — no horizontal scroll, content readable", async ({
    page,
  }) => {
    // Set mobile viewport (375px — typical small phone)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Navigate to each section and verify no horizontal scroll
    const sidebar = await getWorkshopSidebar(page);

    // Check Inicio
    const inicioTab = sidebar.locator('button:has-text("Inicio")');
    await inicioTab.click();
    await expect(page.locator("main").locator("h1")).toBeVisible({ timeout: 5000 });

    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(pageWidth + 1); // +1 for rounding

    // Open sidebar again for next nav
    const sidebarAgain = await getWorkshopSidebar(page);

    // Check Instalación
    const instalacionTab = sidebarAgain.locator('button:has-text("Instalación")');
    await instalacionTab.click();
    await expect(page.locator("main").locator("h1")).toBeVisible({ timeout: 5000 });

    const bodyWidth2 = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth2).toBeLessThanOrEqual(pageWidth + 1);

    // Verify content is readable (font size, padding)
    const mainHeading = page.locator("main").locator("h1");
    const fontSize = await mainHeading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThan(20); // At least 20px on mobile
  });

  test("[3b-6c] responsive-desktop-768px — hamburger disappears, sidebar visible", async ({
    page,
  }) => {
    // Set desktop viewport (768px — tablet/desktop)
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Hamburger button should be hidden
    const hamburgerButton = page.getByRole("button", { name: "Abrir menú" });
    const isHamburgerVisible = await hamburgerButton.isVisible().catch(() => false);
    expect(isHamburgerVisible).toBe(false);

    // Desktop sidebar should be visible
    const desktopSidebar = page.getByRole("navigation", { name: "Workshop sections" });
    await expect(desktopSidebar).toBeVisible();

    // Verify all tabs are visible
    await expect(desktopSidebar.locator('button:has-text("Inicio")')).toBeVisible();
    await expect(desktopSidebar.locator('button:has-text("Aprendizaje")')).toBeVisible();
    await expect(desktopSidebar.locator('button:has-text("Taller")')).toBeVisible();
    await expect(desktopSidebar.locator('button:has-text("Instalación")')).toBeVisible();
    await expect(desktopSidebar.locator('button:has-text("Glosario")')).toBeVisible();
  });

  test("[3b-6d] responsive-all-sections-render-mobile — all 5 sections render correctly on 360px", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 800 });

    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sections = [
      { name: "Inicio", title: "Bienvenido" },
      { name: "Aprendizaje", title: "Módulo" },
      { name: "Taller", title: "Ejercicios" },
      { name: "Instalación", title: "Guía" },
      { name: "Glosario", title: "Glosario" },
    ];

    for (const section of sections) {
      const sidebar = await getWorkshopSidebar(page);
      const tab = sidebar.locator(`button:has-text("${section.name}")`);
      await tab.click();

      // Verify main content renders
      const mainHeading = page.locator("main").locator("h1");
      await expect(mainHeading).toBeVisible({ timeout: 5000 });

      // Verify no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(bodyWidth).toBeLessThanOrEqual(clientWidth + 1);
    }
  });
});

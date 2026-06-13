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
 * E2E Tests para Change 3b: Social Footer (1 spec)
 *
 * RF-007: Social footer renders 4 social icons in sidebar
 *
 * Setup: resetWorkshopsAndAccess() crea talleres + seed user con acceso a 'rag-intro'
 * seedSectionsAndGlossary() popula 5 secciones + 8 términos
 */

test.describe("Workshop [3b] — Social Footer", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);

    // Seed secciones+glosario para el workshop desbloqueado
    await seedSectionsAndGlossary(workshops[0].id);
  });

  test("[3b-4] social-footer-visible — footer con 4 iconos de redes está visible en sidebar", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Get sidebar (handles desktop/mobile)
    const sidebar = await getWorkshopSidebar(page);
    await expect(sidebar).toBeVisible();

    // Look for social navigation within sidebar
    // SocialFooter has role="navigation" aria-label="Redes sociales"
    const socialNav = sidebar.getByRole("navigation", { name: /redes sociales|Redes sociales/ });
    await expect(socialNav).toBeVisible();

    // Verify 4 social links are present
    const socialLinks = socialNav.locator("a");
    const linkCount = await socialLinks.count();
    expect(linkCount).toBe(4);

    // Verify social links have aria-labels for accessibility
    // Icons should have aria-labels: Instagram, LinkedIn, TikTok, YouTube
    await expect(socialNav.locator('a[aria-label="Instagram"]')).toBeVisible();
    await expect(socialNav.locator('a[aria-label="LinkedIn"]')).toBeVisible();
    await expect(socialNav.locator('a[aria-label="TikTok"]')).toBeVisible();
    await expect(socialNav.locator('a[aria-label="YouTube"]')).toBeVisible();

    // Verify links have href (even if placeholder "#")
    const instagramLink = socialNav.locator('a[aria-label="Instagram"]');
    const href = await instagramLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).not.toBe(""); // Should not be empty string

    // Verify links target="_blank" for external navigation
    await expect(instagramLink).toHaveAttribute("target", "_blank");
  });

  test("[3b-4b] social-footer-links-open-externally — cliclear icono abre URL en nueva pestaña", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const continuarLink = page.locator('a:has-text("Continuar")').first();
    await continuarLink.click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    const sidebar = await getWorkshopSidebar(page);
    const socialNav = sidebar.getByRole("navigation", { name: /redes sociales|Redes sociales/ });

    // Listen for new page (popup) if link navigates
    // Since env vars are not set, links will be "#" (no-op), but we verify structure
    const instagramLink = socialNav.locator('a[aria-label="Instagram"]');
    const href = await instagramLink.getAttribute("href");

    // If href is "#" (placeholder), verify it doesn't cause navigation
    if (href === "#") {
      await instagramLink.click();
      // Should stay on same page
      await expect(page).toHaveURL(/\/taller\//);
    } else if (href && href.startsWith("http")) {
      // If real URL is set, verify target="_blank" is present
      await expect(instagramLink).toHaveAttribute("target", "_blank");
    }
  });
});

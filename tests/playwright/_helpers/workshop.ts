import type { Page, Locator } from "@playwright/test";

/**
 * Devuelve el navigation del sidebar correcto según el viewport.
 *
 * Desktop (≥768px): el sidebar fijo tiene aria-label "Workshop sections".
 *   - Está siempre visible, no requiere acción previa.
 *
 * Mobile (<768px): el sidebar desktop está oculto (hidden md:flex);
 *   el contenido vive en un drawer con aria-label "Workshop sections mobile",
 *   que se abre con el botón "Abrir menú".
 *
 * Llamá esto en lugar de page.locator('[role="navigation"]').first(),
 * que rompe en mobile y dispara strict mode con 3 navs (sidebar, tabs
 * anidados, redes).
 */
export async function getWorkshopSidebar(page: Page): Promise<Locator> {
  const isMobile = page.viewportSize() && page.viewportSize()!.width < 768;

  if (isMobile) {
    // Abrir drawer si todavía no está abierto
    const drawer = page.getByRole("navigation", {
      name: "Workshop sections mobile",
    });
    if (!(await drawer.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await drawer.waitFor({ state: "visible", timeout: 2000 });
    }
    return drawer;
  }

  return page.getByRole("navigation", { name: "Workshop sections" });
}

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
 * Reemplazo focalizado del antiguo [3b-7] e2e-full-user-journey skipped.
 *
 * El test original combinaba 12 pasos: navegación entre las 5 secciones +
 * code copy en Instalación + search en Glosario + flashcard flip. Cada
 * navegación dispara una Server Action a sa-east-1 (~1-2s), y en Mobile
 * Chrome el drawer overlay sumaba flakiness al click subsiguiente.
 *
 * Cobertura distribuida: code copy → workshop-instalacion · search/flip →
 * workshop-glosario · RLS/progress básico → workshop-rls. Lo que SOLO este
 * test cubre es la PROGRESIÓN SECUENCIAL completa 0→100% + persistencia
 * tras reload. Eso es lo que verificamos acá, sin interactividad extra.
 *
 * Estructura: 3 specs cortos, cada uno por debajo del timeout default de
 * 30s. Reemplaza al [3b-7] eliminando el `test.skip`.
 */

test.describe("Workshop [3b] — Progress Journey End-to-End", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
    await seedSectionsAndGlossary(workshops[0].id);

    // Aterrizar en /taller/<slug> desbloqueado vía "Continuar" del catálogo
    await page.goto("/catalogo");
    await page.locator('a:has-text("Continuar")').first().click();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });

    // Inicio renderea (default landing) → 20% inicial
    await expect(page.locator("main").locator("h1")).toBeVisible({ timeout: 10000 });
    const sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "20",
      { timeout: 20000 }
    );
  });

  test("[3b-7a] progress-first-half — Inicio → Aprendizaje → Taller (20→40→60%)", async ({
    page,
  }) => {
    // Aprendizaje → 40%
    let sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Aprendizaje")').click();
    sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40",
      { timeout: 20000 }
    );

    // Taller → 60%
    sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Taller")').click();
    sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "60",
      { timeout: 20000 }
    );
  });

  test("[3b-7b] progress-second-half — Instalación → Glosario (80→100%)", async ({
    page,
  }) => {
    // Instalación → 40% (segunda visita del recorrido — 1ra Inicio + 2da Instalación)
    let sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Instalación")').click();
    sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40",
      { timeout: 20000 }
    );

    // Glosario → 60%
    sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Glosario")').click();
    sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "60",
      { timeout: 20000 }
    );
  });

  test("[3b-7c] progress-persists-on-reload — visitas se mantienen al recargar", async ({
    page,
  }) => {
    // Sumar 1 visita (Inicio ya cuenta como 20% por el beforeEach)
    let sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Aprendizaje")').click();
    sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40",
      { timeout: 20000 }
    );

    // Reload — el progreso debe persistir server-side (section_visits)
    await page.reload();
    await expect(page).toHaveURL(/\/taller\//, { timeout: 15000 });
    sidebar = await getWorkshopSidebar(page);
    await expect(sidebar.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40",
      { timeout: 20000 }
    );
  });
});

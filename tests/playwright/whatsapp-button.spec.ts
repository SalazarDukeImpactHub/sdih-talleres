import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  setSeedUserPasswordChanged,
  resetWorkshopsAndAccess,
  seedSectionsAndGlossary,
  supabaseAdmin,
} from "./_helpers/supabase-admin";

const DUMMY_NUMBER = "5491100000000";

/**
 * E2E Spec — change 7: WhatsApp button en /taller/[slug]
 *
 * Verifica:
 * - [7-1] botón visible para alumno con acceso al taller
 * - [7-2] href usa wa.me/<numero>?text=... con mensaje genérico cuando no hay template
 * - [7-3] href usa el template del workshop con placeholders sustituidos
 */
test.describe("WhatsApp Button [7]", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await seedSectionsAndGlossary(workshops[0].id);

    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "alumna@test.com");
    await page.fill('input[name="password"]', "Talleres2026!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/catalogo", { timeout: 30000 });
  });

  test("[7-1] botón visible en /taller/rag-intro tras login", async ({
    page,
  }) => {
    await page.goto("/taller/rag-intro");
    const btn = page.locator('[data-testid="whatsapp-button"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("target", "_blank");
    await expect(btn).toHaveAttribute("rel", /noopener/);
  });

  test("[7-2] href contiene wa.me + dummy + mensaje genérico", async ({
    page,
  }) => {
    await page.goto("/taller/rag-intro");
    const btn = page.locator('[data-testid="whatsapp-button"]');
    const href = await btn.getAttribute("href");

    expect(href).toContain(`https://wa.me/${DUMMY_NUMBER}?text=`);
    expect(href).toContain("Hola%20Jennifer");
    expect(href).toContain("RAG%20Intro"); // título del seed workshop[0]
  });

  test("[7-3] template custom con placeholders {nombre} y {taller}", async ({
    page,
  }) => {
    // Setear template custom en el workshop "rag-intro"
    const customTemplate = "Hola Jen, soy {nombre} y voy con {taller}";
    const { error } = await supabaseAdmin
      .from("workshops")
      .update({ whatsapp_message_template: customTemplate })
      .eq("slug", "rag-intro");
    expect(error).toBeNull();

    await page.goto("/taller/rag-intro");
    const btn = page.locator('[data-testid="whatsapp-button"]');
    const href = await btn.getAttribute("href");

    // No deben quedar placeholders literales en el href
    expect(href).not.toContain("%7Bnombre%7D");
    expect(href).not.toContain("%7Btaller%7D");
    // El nombre del seed user es "Alumna de Prueba" y el taller es "RAG Intro"
    expect(href).toContain("Hola%20Jen");
    expect(href).toContain("Alumna%20de%20Prueba");
    expect(href).toContain("RAG%20Intro");
  });
});

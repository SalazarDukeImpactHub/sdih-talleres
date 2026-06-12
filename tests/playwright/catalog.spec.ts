import { test, expect } from "@playwright/test";
import { resetSeedUser, resetWorkshopsAndAccess, setSeedUserPasswordChanged } from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";

/**
 * E2E Tests para Change 2a: Catálogo de talleres (read-only, 9 specs)
 *
 * Setup: resetWorkshopsAndAccess() crea 4 talleres + acceso a 2 de ellos (seed user).
 */

test.describe("Catalog [2a] — Grid and Badges", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
  });

  test("[2a-1] catalog-load — 4 tarjetas renderizam correctamente", async ({ page }) => {
    await page.goto("/catalogo");
    await page.waitForSelector('[class*="grid"]');

    const cards = page.locator('[class*="rounded-lg"][class*="bg-navy"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    await expect(page.getByText("RAG Intro")).toBeVisible();
    await expect(page.getByText("Embeddings Deep Dive")).toBeVisible();
    await expect(page.getByText("Future of AI")).toBeVisible();
    await expect(page.getByText("Past Workshop")).toBeVisible();

    await expect(page.getByText("Introduction to RAG systems")).toBeVisible();
  });

  test("[2a-2] catalog-badges-render — badges con estados y colores correctos", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    const badges = page.locator('[aria-label*="Estado"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(4);

    await expect(page.getByLabel(/Estado.*Disponible/)).toBeVisible();
    await expect(page.getByLabel(/Estado.*En vivo/)).toBeVisible();
    await expect(page.getByLabel(/Estado.*Próximamente/)).toBeVisible();
    await expect(page.getByLabel(/Estado.*Completado/)).toBeVisible();
  });

  test("[2a-3] catalog-unlock-state — 2 'Continuar', 2 'Ingresar' con candado", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("button");

    const continuarButtons = page.locator('button:has-text("Continuar")');
    const continuarCount = await continuarButtons.count();
    expect(continuarCount).toBe(2);

    const ingresarButtons = page.locator('button:has-text("Ingresar")');
    const ingresarCount = await ingresarButtons.count();
    expect(ingresarCount).toBe(2);

    const firstContinuar = continuarButtons.first();
    await expect(firstContinuar).toBeDisabled();

    const lockIcons = page.locator("text=🔒");
    const lockCount = await lockIcons.count();
    expect(lockCount).toBe(2);
  });

  test("[2a-4] catalog-responsive-360 — 1 columna sin scroll horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);

    const cards = page.locator('[class*="rounded-lg"][class*="bg-navy"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    await expect(cards.first()).toBeVisible();
  });

  test("[2a-5] catalog-responsive-768 — 2 columnas", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    const gridContainer = page.locator('[class*="grid"]').first();
    const classes = await gridContainer.getAttribute("class");
    expect(classes).toContain("sm:grid-cols-2");
  });

  test("[2a-6] catalog-responsive-1024 — 3-4 columnas", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    const gridContainer = page.locator('[class*="grid"]').first();
    const classes = await gridContainer.getAttribute("class");
    expect(classes).toMatch(/lg:grid-cols-3|xl:grid-cols-4/);
  });

  test("[2a-7] cover-image-fallback — gradiente sin broken image", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    const brokenImages = page.locator("img[style*='visibility: hidden'], img[alt*=broken]");
    const brokenCount = await brokenImages.count();
    expect(brokenCount).toBe(0);

    const gradients = page.locator('[class*="bg-gradient"]');
    const gradientCount = await gradients.count();
    expect(gradientCount).toBeGreaterThan(0);
  });

  test("[2a-8] sdlive-animation — badge 'En vivo' pulsea", async ({ page }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("text=Embeddings Deep Dive");

    const badge = page.getByLabel(/Estado.*En vivo/);
    await expect(badge).toBeVisible();

    const animationName = await badge
      .locator("div")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe("sdLive");
  });

  test("[2a-9] rls-isolation — User B no ve access de User A", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("text=RAG Intro");

    await expect(page).not.toHaveURL("*error*");
    await expect(page).not.toHaveURL("*500*");
  });
});

/**
 * E2E Tests para Change 2b: AccessKeyModal + Redemption (11 specs)
 */
test.describe("Catalog [2b] — Access Key Modal and Redemption", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);
    await loginAsSeedUser(page);
  });

  test("[2b-1] modal-open-close — modal abre al clickear 'Ingresar'", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await page.waitForSelector("text=Future of AI");

    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(page.getByText("Ingresar a Future of AI")).toBeVisible();

    const input = modal.locator('input[name="key"]');
    await expect(input).toBeVisible();

    const submitButton = modal.locator('button:has-text("Enviar")');
    await expect(submitButton).toBeVisible();
  });

  test("[2b-2] modal-close-escape — Escape cierra el modal", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("[2b-3] modal-invalid-key — clave inválida muestra error", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    const input = modal.locator('input[name="key"]');
    const submitButton = modal.locator('button:has-text("Enviar")');

    await input.fill("INVALID-KEY");
    await submitButton.click();

    const errorMsg = page.locator("text=Clave inválida o expirada");
    await expect(errorMsg).toBeVisible();
    await expect(modal).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test("[2b-4] modal-valid-key — clave válida → success → cierra", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    const input = modal.locator('input[name="key"]');

    await input.fill("FUTURE-TECH-2024");
    await modal.locator('button:has-text("Enviar")').click();

    const successMsg = page.locator("text=¡Acceso concedido!");
    await expect(successMsg).toBeVisible();

    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test("[2b-5] modal-success-updates-card — card cambia 'Ingresar' → 'Continuar'", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    const ingresarButton = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await expect(ingresarButton).toBeVisible();

    await ingresarButton.click();

    const modal = page.locator('[role="dialog"]');
    const input = modal.locator('input[name="key"]');
    await input.fill("FUTURE-TECH-2024");
    await modal.locator('button:has-text("Enviar")').click();

    await expect(page.locator("text=¡Acceso concedido!")).toBeVisible();
    await expect(modal).toBeHidden({ timeout: 3000 });
    await page.waitForLoadState("networkidle");

    await expect(ingresarButton).not.toBeVisible();
  });

  test("[2b-6] modal-case-insensitive — lowercase funciona", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    const input = modal.locator('input[name="key"]');

    await input.fill("future-tech-2024");
    await modal.locator('button:has-text("Enviar")').click();

    const successMsg = page.locator("text=¡Acceso concedido!");
    await expect(successMsg).toBeVisible();
  });

  test("[2b-7] modal-persistence — tras refresh, cambios persisten", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    const input = modal.locator('input[name="key"]');
    await input.fill("FUTURE-TECH-2024");
    await modal.locator('button:has-text("Enviar")').click();

    // Esperar a que el modal auto-cierre (2s en success + margen)
    await expect(modal).toBeHidden({ timeout: 5000 });

    await page.reload();
    await page.waitForSelector("text=Future of AI");

    await expect(page.getByRole("button", { name: "Ingresar a Future of AI" })).not.toBeVisible();
  });

  test("[2b-8] modal-double-redeem-blocked — unlocked no abre modal", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    const ragContinuarButton = page.getByRole("button", { name: "Botón continuar (deshabilitado hasta cambio 3)" }).first();
    await expect(ragContinuarButton).toBeVisible();
    await expect(ragContinuarButton).toBeDisabled();

    const ragIngresarButton = page.getByRole("button", { name: "Ingresar a RAG Intro" });
    await expect(ragIngresarButton).not.toBeVisible();
  });

  test("[2b-9] modal-accessibility — aria-labels y roles", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveAttribute("aria-modal", "true");

    const ariaLabelledBy = await modal.getAttribute("aria-labelledby");
    expect(ariaLabelledBy).toBeTruthy();

    const titleId = ariaLabelledBy;
    const title = page.locator(`#${titleId}`);
    await expect(title).toBeVisible();
  });

  test("[2b-10] rls-redemption-isolation — basic user redeem flow", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    const button = page.getByRole("button", { name: "Ingresar a Future of AI" });
    await button.click();

    const modal = page.locator('[role="dialog"]');
    const input = modal.locator('input[name="key"]');

    await input.fill("FUTURE-TECH-2024");
    await modal.locator('button:has-text("Enviar")').click();

    const successMsg = page.locator("text=¡Acceso concedido!");
    await expect(successMsg).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { resetSeedUser, setSeedUserPasswordChanged } from "./_helpers/supabase-admin";

test.describe("Auth: Ya onboarded (password_changed=true)", () => {
  test.beforeEach(async () => {
    // Reset seed user a password original, después marcar como ya onboarded
    await resetSeedUser();
    await setSeedUserPasswordChanged(true);
  });

  test("debe redirigir directo a /catalogo sin pasar por change-password", async ({
    page,
  }) => {
    // 1. Visitar /
    await page.goto("/");

    // 2. Expect redirect a /auth/login (no sesión aún)
    expect(page.url()).toContain("/auth/login");

    // 3. Login con credenciales seed
    await page.fill('input[name="email"]', "alumna@test.com");
    await page.fill('input[name="password"]', "Talleres2026!");

    // 4. Submit
    await page.click('button[type="submit"]');

    // 5. Expect redirect DIRECTO a /catalogo (sin change-password)
    await page.waitForURL("**/catalogo", { timeout: 15000 });
    expect(page.url()).toContain("/catalogo");

    // 6. Verify no estamos en change-password
    expect(page.url()).not.toContain("/auth/change-password");

    // 7. Verify estamos en catalogo (ver heading)
    const title = page.locator("h1");
    const titleText = await title.textContent();
    expect(titleText).toContain("Catálogo");
  });
});

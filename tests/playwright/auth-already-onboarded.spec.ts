import { test, expect } from "@playwright/test";
import { resetSeedUser, SUPABASE_URL_FOR_TESTS, SERVICE_ROLE_KEY_FOR_TESTS } from "./_helpers/supabase-admin";
import { createClient } from "@supabase/supabase-js";

test.describe("Auth: Ya onboarded (password_changed=true)", () => {
  test.beforeEach(async () => {
    // Reset seed user y setear password_changed=true
    await resetSeedUser();

    // Update password_changed a true (usuario ya cambió contraseña)
    const admin = createClient(
      SUPABASE_URL_FOR_TESTS,
      SERVICE_ROLE_KEY_FOR_TESTS
    );

    await admin
      .from("users")
      .update({ password_changed: true })
      .eq("email", "alumna@test.com");
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
    await page.waitForURL("**/catalogo", { timeout: 5000 });
    expect(page.url()).toContain("/catalogo");

    // 6. Verify no estamos en change-password
    expect(page.url()).not.toContain("/auth/change-password");

    // 7. Verify estamos en catalogo (ver heading)
    const title = page.locator("h1");
    const titleText = await title.textContent();
    expect(titleText).toContain("Catálogo");
  });
});

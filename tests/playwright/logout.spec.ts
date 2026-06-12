import { test, expect } from "@playwright/test";
import { resetSeedUser, setSeedUserPasswordChanged } from "./_helpers/supabase-admin";

test.describe("Auth: Logout completo", () => {
  test.beforeEach(async () => {
    // Reset seed user y marcar como onboarded para poder entrar directo a /catalogo
    await resetSeedUser();
    await setSeedUserPasswordChanged(true);
  });

  test("debe logout y redirigir a /auth/login, sesión luego inaccesible", async ({
    page,
  }) => {
    // 1. Login
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "alumna@test.com");
    await page.fill('input[name="password"]', "Talleres2026!");
    await page.click('button[type="submit"]');

    // 2. Expect estar en /catalogo
    await page.waitForURL("**/catalogo", { timeout: 15000 });
    expect(page.url()).toContain("/catalogo");

    // 3. Click botón "Cerrar sesión"
    await page.click('button:has-text("Cerrar sesión")');

    // 4. Expect redirect a /auth/login
    await page.waitForURL("**/auth/login", { timeout: 15000 });
    expect(page.url()).toContain("/auth/login");

    // 5. Visitar /catalogo directo nuevamente
    await page.goto("/catalogo");

    // 6. Expect redirect de nuevo a /auth/login (sesión terminada)
    await page.waitForURL("**/auth/login", { timeout: 15000 });
    expect(page.url()).toContain("/auth/login");
  });
});

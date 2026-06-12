import { test, expect } from "@playwright/test";
import { resetSeedUser } from "./_helpers/supabase-admin";

test.describe("Auth: Flujo forzado de cambio de contraseña", () => {
  test.beforeEach(async () => {
    // Reset seed user antes de cada test
    await resetSeedUser();
  });

  test("debe forzar cambio de contraseña en primer login (password_changed=false)", async ({
    page,
  }) => {
    // 1. Visitar /
    await page.goto("/");

    // 2. Expect redirect a /auth/login
    expect(page.url()).toContain("/auth/login");

    // 3. Llenar formulario con credenciales seed
    await page.fill('input[name="email"]', "alumna@test.com");
    await page.fill('input[name="password"]', "Talleres2026!");

    // 4. Hacer submit
    await page.click('button[type="submit"]');

    // 5. Expect redirect a /auth/change-password
    await page.waitForURL("**/auth/change-password", { timeout: 5000 });
    expect(page.url()).toContain("/auth/change-password");

    // 6. Llenar formulario de cambio de contraseña
    await page.fill('input[name="currentPassword"]', "Talleres2026!");
    await page.fill('input[name="newPassword"]', "NuevaPass456!");
    await page.fill('input[name="confirmPassword"]', "NuevaPass456!");

    // 7. Hacer submit
    await page.click('button[type="submit"]');

    // 8. Expect redirect a /catalogo
    await page.waitForURL("**/catalogo", { timeout: 5000 });
    expect(page.url()).toContain("/catalogo");

    // 9. Expect ver "Catálogo — próximamente en change 2"
    const title = page.locator("h1");
    const titleText = await title.textContent();
    expect(titleText).toContain("Catálogo");
    expect(titleText).toContain("próximamente en change 2");

    // 10. Expect ver nombre "Alumna de Prueba" en TopBar
    const topBar = page.locator('[data-testid="top-bar"]');
    const topBarText = await topBar.textContent();
    expect(topBarText).toContain("Alumna de Prueba");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Auth: Login con error", () => {
  test("debe mostrar error inline cuando credenciales son inválidas", async ({
    page,
  }) => {
    // 1. Visitar login
    await page.goto("/auth/login");

    // 2. Llenar con credenciales incorrectas
    await page.fill('input[name="email"]', "alumna@test.com");
    await page.fill('input[name="password"]', "WRONG");

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Expect ver mensaje de error inline
    const errorElement = page.locator('text=Credenciales inválidas');
    await errorElement.waitFor({ timeout: 5000 });
    expect(await errorElement.isVisible()).toBe(true);

    // 5. Expect NO haber redirect (seguimos en /auth/login)
    expect(page.url()).toContain("/auth/login");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Auth: Login con error", () => {
  test("debe mostrar error inline cuando credenciales son inválidas", async ({
    page,
  }) => {
    // 1. Visitar login
    await page.goto("/auth/login");

    // 2. Llenar con credenciales incorrectas (password VÁLIDO en formato Zod, pero incorrecto en Supabase)
    // Importante: el password debe pasar el min(8) de Zod para que llegue a Supabase
    // y devuelva el error de credenciales (no el de validación de schema).
    await page.fill('input[name="email"]', "alumna@test.com");
    await page.fill('input[name="password"]', "PasswordIncorrecto123");

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Expect ver mensaje de error inline
    const errorElement = page.locator('text=Credenciales inválidas');
    // Supabase auth round-trip puede tardar más de 5s en redes lentas; subir a 15s
    await errorElement.waitFor({ timeout: 15000 });
    expect(await errorElement.isVisible()).toBe(true);

    // 5. Expect NO haber redirect (seguimos en /auth/login)
    expect(page.url()).toContain("/auth/login");
  });
});

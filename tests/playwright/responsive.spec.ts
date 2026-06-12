import { test, expect } from "@playwright/test";

test.describe("Auth: Responsive — 360px mobile", () => {
  test("debe mostrar formulario sin overflow horizontal en 360px", async ({
    page,
  }) => {
    // 1. Setear viewport a 360x800
    await page.setViewportSize({ width: 360, height: 800 });

    // 2. Visitar /auth/login
    await page.goto("/auth/login");

    // 3. Expect form visible sin overflow horizontal
    const form = page.locator("form");
    const formBox = await form.boundingBox();

    expect(formBox).not.toBeNull();
    if (formBox) {
      // Verificar que form no excede ancho del viewport
      expect(formBox.width).toBeLessThanOrEqual(360);
    }

    // 4. Verificar que inputs son accesibles (no hidden)
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    expect(await emailInput.isVisible()).toBe(true);
    expect(await passwordInput.isVisible()).toBe(true);

    // 5. Verificar que botón submit es accesible
    const submitButton = page.locator('button[type="submit"]');
    expect(await submitButton.isVisible()).toBe(true);
  });
});

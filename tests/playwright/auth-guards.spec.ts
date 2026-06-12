import { test, expect } from "@playwright/test";

test.describe("Auth: Guards — acceso sin sesión", () => {
  test("debe redirigir a /auth/login cuando se visita /catalogo sin sesión", async ({
    page,
  }) => {
    // 1. Visitar /catalogo sin estar logged in
    await page.goto("/catalogo");

    // 2. Expect redirect silent a /auth/login
    await page.waitForURL("**/auth/login", { timeout: 5000 });
    expect(page.url()).toContain("/auth/login");
  });
});

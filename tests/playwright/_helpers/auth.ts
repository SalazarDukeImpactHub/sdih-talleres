import type { Page } from "@playwright/test";

/**
 * Login del seed user vía UI.
 *
 * Precondición: el seed user debe tener password_changed=true
 * (llamá setSeedUserPasswordChanged(true) antes), sino el login
 * redirige a /auth/change-password en vez de /catalogo.
 *
 * Las credenciales deben coincidir con resetSeedUser() del helper admin.
 */
export async function loginAsSeedUser(page: Page) {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', "alumna@test.com");
  await page.fill('input[name="password"]', "Talleres2026!");
  await page.click('button[type="submit"]');
  // El round-trip a Supabase sa-east-1 puede tardar; 15s como en los demás specs
  await page.waitForURL("**/catalogo", { timeout: 15000 });
}

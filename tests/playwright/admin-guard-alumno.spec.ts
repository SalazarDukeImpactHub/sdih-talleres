import { test, expect } from "@playwright/test";
import { resetSeedUser, setSeedUserPasswordChanged, resetWorkshopsAndAccess } from "./_helpers/supabase-admin";

/**
 * [5a-2] Admin Guard: Alumno Role Blocked
 *
 * Scenario: Authenticated user with role='alumno' attempts /admin/talleres
 * Expected: Redirect to /catalogo (no admin content rendered)
 *
 * Coverage: RF-5a-1 (guard → non-admin)
 */
test("alumno user is redirected to catalogo", async ({ page }) => {
  // Setup: reset seed user (alumno) and create test workshops
  await resetSeedUser();
  await setSeedUserPasswordChanged(true);
  await resetWorkshopsAndAccess();

  // Login as alumna@test.com (alumno role)
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', "alumna@test.com");
  await page.fill('input[name="password"]', "Talleres2026!");
  await page.click("button[type='submit']");

  // Wait for redirect to /catalogo (timeout 30s — cold start del dev server tarda)
  await page.waitForURL("**/catalogo", { timeout: 30000 });

  // Now try to access /admin/talleres — should redirect back to /catalogo
  await page.goto("/admin/talleres");

  // Wait for redirect back to /catalogo
  await page.waitForURL("**/catalogo", { timeout: 30000 });

  // Verify we're redirected to /catalogo, not on admin
  expect(page.url()).toContain("/catalogo");
  expect(page.url()).not.toContain("/admin");

  // Verify catalogo h1 visible (selector específico para evitar strict mode con otros "Catálogo")
  await expect(page.getByRole("heading", { level: 1, name: /Catálogo/i })).toBeVisible();
});

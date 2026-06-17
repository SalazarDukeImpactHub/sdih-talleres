import { test, expect } from "@playwright/test";

/**
 * [5a-1] Admin Guard: Unauthenticated User
 *
 * Scenario: Unauthenticated user attempts to access /admin/talleres
 * Expected: Redirect to /auth/login (no admin content rendered)
 *
 * Coverage: RF-5a-1 (guard → unauthenticated)
 */
test("unauthenticated user is redirected to login", async ({ page, context }) => {
  // Clear cookies to ensure no session
  await context.clearCookies();

  // Navigate to /admin/talleres — should redirect to /auth/login due to page guard
  await page.goto("/admin/talleres");

  // Wait for redirect to complete
  await page.waitForURL("**/auth/login", { timeout: 15000 });

  // Verify redirect to /auth/login
  expect(page.url()).toContain("/auth/login");

  // Verify login form is visible
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

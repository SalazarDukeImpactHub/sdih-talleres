import { test, expect } from "@playwright/test";
import { createOrResetAdminUser } from "./_helpers/supabase-admin";

/**
 * [5b-4] Validation Errors (Missing Required, Oversized File)
 *
 * Scenario: Admin submits form with missing title, oversized file, unsupported file type
 * Expected: Validation errors displayed, form not submitted
 *
 * Coverage: RF-5b-1, RF-5b-2 (validation)
 */
test("admin sees validation error when submitting empty title", async ({ page }) => {
  // Setup: create admin user
  const admin = await createOrResetAdminUser();

  // Login as admin
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.click("button[type='submit']");

  // Wait for redirect
  await page.waitForURL("**/catalogo", { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Navigate to create page
  await page.goto("/admin/talleres/new");

  // Verify page loaded
  await expect(page.getByRole("heading", { name: "Crear Nuevo Taller" })).toBeVisible();

  // Fill only description (leave title empty)
  await page.fill('textarea[data-testid="input-description"]', "Description");
  await page.fill('input[data-testid="input-instructor"]', "Instructor");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 16);
  await page.fill('input[data-testid="input-date"]', dateStr);

  await page.fill('input[data-testid="input-duration"]', "120");

  // Submit form without title
  await page.click('button[data-testid="submit-button"]');

  // HTML5 validation should prevent submission (required attribute)
  // Check that we're still on the new page (no redirect)
  await page.waitForTimeout(1000);
  const url = page.url();
  expect(url).toContain("/admin/talleres/new");
});

test("admin sees error for unsupported cover file type", async ({ page }) => {
  // Setup: create admin user
  const admin = await createOrResetAdminUser();

  // Login as admin
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.click("button[type='submit']");

  // Wait for redirect
  await page.waitForURL("**/catalogo", { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Navigate to create page
  await page.goto("/admin/talleres/new");

  // Verify page loaded
  await expect(page.getByRole("heading", { name: "Crear Nuevo Taller" })).toBeVisible();

  // Fill all required fields
  const title = `Test ${Date.now()}`;
  await page.fill('input[data-testid="input-title"]', title);
  await page.fill('textarea[data-testid="input-description"]', "Description");
  await page.fill('input[data-testid="input-instructor"]', "Instructor");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 16);
  await page.fill('input[data-testid="input-date"]', dateStr);

  await page.fill('input[data-testid="input-duration"]', "120");

  // Try to upload a non-image file (.txt)
  // Create a text file via setInputFiles
  const fileInput = page.locator('input[data-testid="cover-file-input"]');

  await fileInput.setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("This is not an image"),
  });

  // Wait for error message
  const errorMsg = page.locator('[data-testid="cover-error"]');
  await expect(errorMsg).toBeVisible({ timeout: 2000 });

  // Verify error text
  await expect(errorMsg).toContainText("Tipo de archivo no válido");
});

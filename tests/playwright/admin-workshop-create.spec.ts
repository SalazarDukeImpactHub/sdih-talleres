import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, resetWorkshopsAndAccess, supabaseAdmin } from "./_helpers/supabase-admin";

/**
 * [5b-1] Create Workshop with Cover
 *
 * Scenario: Admin logs in, navigates /admin/talleres/new, fills form with cover image, creates workshop
 * Expected: Workshop inserted in DB, cover uploaded to Storage, redirected to list
 *
 * Coverage: RF-5b-1, RF-5b-2 (create + cover upload)
 */
test("admin creates workshop with cover image", async ({ page }) => {
  // Setup: create admin user
  const admin = await createOrResetAdminUser();

  // Setup: reset workshops
  await resetWorkshopsAndAccess();

  // Login as admin
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.click("button[type='submit']");

  // Wait for redirect (cold start ~30s)
  await page.waitForURL("**/catalogo", { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Navigate to create workshop page
  await page.goto("/admin/talleres/new");

  // Verify page loaded
  await expect(page.getByRole("heading", { name: "Crear Nuevo Taller" })).toBeVisible();

  // Fill form fields
  const title = `Test Workshop ${Date.now()}`;
  const description = "This is a test workshop for automation";
  const instructor = "Test Instructor";
  const duration = "120";
  const status = "disponible";

  // Title
  await page.fill('input[data-testid="input-title"]', title);

  // Description
  await page.fill('textarea[data-testid="input-description"]', description);

  // Instructor
  await page.fill('input[data-testid="input-instructor"]', instructor);

  // Date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 16);
  await page.fill('input[data-testid="input-date"]', dateStr);

  // Duration
  await page.fill('input[data-testid="input-duration"]', duration);

  // Status
  await page.selectOption('select[data-testid="input-status"]', status);

  // Upload cover: create minimal test image (50x50 px)
  // Using base64 inline to avoid file fixtures
  const base64Pixel =
    "iVBORw0KGgoAAAANSUhEUgAAADIAAABICAYAAACUcBZpAAABDElEQVR42u3BMQEAAADCoPVPbQhfoAAAAOA1v9QAAQGCAwj+D7gVEA==";
  const buffer = Buffer.from(base64Pixel, "base64");

  // Set up file input
  const fileInput = page.locator('input[data-testid="cover-file-input"]');
  await fileInput.setInputFiles({
    name: "test-cover.png",
    mimeType: "image/png",
    buffer: buffer,
  });

  // Wait for preview to appear
  await expect(page.locator('img[data-testid="cover-preview"]')).toBeVisible({ timeout: 5000 });

  // Submit form
  await page.click('button[data-testid="submit-button"]');

  // Wait for redirect to workshop list (after creation)
  await page.waitForURL("**/admin/talleres", { timeout: 10000 });

  // Verify redirect happened
  await expect(page.getByRole("heading", { name: "Talleres" })).toBeVisible();

  // Verify new workshop appears in list
  await expect(page.locator(`text="${title}"`)).toBeVisible();

  // Verify in DB via admin client (singleton del helper — sin RealtimeClient)
  const { data: workshop, error } = await supabaseAdmin
    .from("workshops")
    .select("*")
    .eq("title", title)
    .single();

  expect(error).toBeNull();
  expect(workshop).toBeDefined();
  expect(workshop?.title).toBe(title);
  expect(workshop?.description).toBe(description);
  expect(workshop?.instructor).toBe(instructor);
  expect(workshop?.status).toBe(status);
  expect(workshop?.duration_min).toBe(parseInt(duration, 10));
});

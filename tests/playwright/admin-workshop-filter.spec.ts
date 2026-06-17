import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, resetWorkshopsAndAccess } from "./_helpers/supabase-admin";

/**
 * [5a-4] Workshop Filter by Status
 *
 * Scenario: Admin views workshop list, selects filter "en vivo"
 * Expected: Table updates to show only "en vivo" workshops
 *
 * Coverage: RF-5a-3 (workshop filter)
 */
test("admin filters workshops by status", async ({ page }) => {
  // Setup: create admin user
  const admin = await createOrResetAdminUser();

  // Setup: create test workshops with different statuses
  const { workshops } = await resetWorkshopsAndAccess();

  // Login as admin
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.click("button[type='submit']");

  // Wait for redirect to /catalogo (timeout 30s — cold start del dev server tarda)
  await page.waitForURL("**/catalogo", { timeout: 30000 });

  // Small delay to ensure session is fully established in DB
  await page.waitForTimeout(1000);

  // Navigate to /admin/talleres
  await page.goto("/admin/talleres");

  // Verify all workshops are visible initially
  const tableBody = page.locator('[data-testid="workshop-table"] tbody');
  let rowCount = await tableBody.locator("tr").count();
  expect(rowCount).toBeGreaterThanOrEqual(4); // At least 4 seed workshops

  // Select filter "En vivo"
  const filterSelect = page.locator("#filter");
  await filterSelect.selectOption("en vivo");

  // Wait for table to update
  await page.waitForTimeout(500);

  // Verify only "en vivo" workshops are shown
  rowCount = await tableBody.locator("tr").count();
  expect(rowCount).toBe(1); // Should have exactly 1 live workshop

  // Find the live workshop from the seed data
  const liveWorkshop = workshops.find((w) => w.status === "en vivo");
  if (liveWorkshop) {
    await expect(page.locator(`[data-workshop-id="${liveWorkshop.id}"]`)).toBeVisible();
  }

  // Verify status badges show "en vivo" only
  const statusBadges = page.locator('[data-testid="workshop-table"] tbody td:nth-child(3)');
  const visibleStatuses = await statusBadges.allTextContents();
  for (const status of visibleStatuses) {
    expect(status.toLowerCase()).toContain("en vivo");
  }
});

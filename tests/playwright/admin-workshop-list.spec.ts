import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, resetWorkshopsAndAccess } from "./_helpers/supabase-admin";

/**
 * [5a-3] Workshop List Renders
 *
 * Scenario: Admin user logs in and navigates /admin/talleres
 * Expected: Table displays all workshops with columns and action buttons
 *
 * Coverage: RF-5a-3 (workshop list)
 */
test("admin views workshop list with all columns", async ({ page }) => {
  // Setup: create admin user
  const admin = await createOrResetAdminUser();

  // Setup: create test workshops
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

  // Verify page title (selector específico al h1 para evitar strict mode con sidebar+breadcrumb)
  await expect(page.getByRole("heading", { level: 1, name: "Talleres" })).toBeVisible();

  // Verify workshop table
  await expect(page.locator('[data-testid="workshop-table"]')).toBeVisible();

  // Verify table header columns
  await expect(page.locator("th:has-text('ID')")).toBeVisible();
  await expect(page.locator("th:has-text('Título')")).toBeVisible();
  await expect(page.locator("th:has-text('Estado')")).toBeVisible();
  await expect(page.locator("th:has-text('Fecha')")).toBeVisible();
  await expect(page.locator("th:has-text('Instructor')")).toBeVisible();
  await expect(page.locator("th:has-text('Acciones')")).toBeVisible();

  // Verify workshops are displayed
  for (const workshop of workshops) {
    await expect(page.locator(`[data-workshop-id="${workshop.id}"]`)).toBeVisible();
  }

  // Verify action buttons for first workshop
  const firstRow = page.locator('[data-testid="workshop-table"] tbody tr:first-child');
  await expect(firstRow.locator('[data-testid="workshop-edit-btn"]')).toBeVisible();
  await expect(firstRow.locator('[data-testid="workshop-view-btn"]')).toBeVisible();

  // Verify "New Workshop" button
  await expect(page.locator('a:has-text("Nuevo Taller")')).toBeVisible();
});

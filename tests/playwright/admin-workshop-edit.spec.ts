import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, resetWorkshopsAndAccess, supabaseAdmin } from "./_helpers/supabase-admin";

/**
 * [5b-2] Edit Workshop
 *
 * Scenario: Admin navigates to edit page, modifies title and description, saves
 * Expected: Workshop updated in DB, changes visible in list
 *
 * Coverage: RF-5b-3 (edit workshop)
 */
test("admin edits workshop successfully", async ({ page }) => {
  // Setup: create admin user
  const admin = await createOrResetAdminUser();

  // Setup: reset workshops
  const { workshops } = await resetWorkshopsAndAccess();
  const targetWorkshop = workshops[0]; // First fixture workshop

  // Login as admin
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.click("button[type='submit']");

  // Wait for redirect
  await page.waitForURL("**/catalogo", { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Navigate to edit page
  await page.goto(`/admin/talleres/${targetWorkshop.id}`);

  // Verify page loaded
  await expect(page.getByRole("heading", { name: "Editar Taller" })).toBeVisible();

  // Verify form is pre-filled
  const titleInput = page.locator('input[data-testid="input-title"]');
  const currentTitle = await titleInput.inputValue();
  expect(currentTitle).toBe(targetWorkshop.title);

  // Modify title and description
  const newTitle = `Updated ${targetWorkshop.title} ${Date.now()}`;
  const newDescription = "Updated description for testing";

  await titleInput.clear();
  await titleInput.fill(newTitle);

  const descInput = page.locator('textarea[data-testid="input-description"]');
  await descInput.clear();
  await descInput.fill(newDescription);

  // Submit form
  await page.click('button[data-testid="submit-button"]');

  // Wait for redirect back to list
  await page.waitForURL("**/admin/talleres", { timeout: 10000 });

  // Verify redirect
  await expect(page.getByRole("heading", { name: "Talleres" })).toBeVisible();

  // Verify changes appear in list
  await expect(page.locator(`text="${newTitle}"`)).toBeVisible();

  // Verify in DB (singleton del helper — sin RealtimeClient)
  const { data: updated, error } = await supabaseAdmin
    .from("workshops")
    .select("*")
    .eq("id", targetWorkshop.id)
    .single();

  expect(error).toBeNull();
  expect(updated?.title).toBe(newTitle);
  expect(updated?.description).toBe(newDescription);
});

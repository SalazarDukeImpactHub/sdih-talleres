import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, resetWorkshopsAndAccess, supabaseAdmin } from "./_helpers/supabase-admin";

/**
 * [5b-3] Delete Workshop with Confirmation
 *
 * Scenario: Admin navigates to edit page, clicks delete, confirms, verifies deletion
 * Expected: Workshop deleted from DB, user redirected to list, workshop no longer visible
 *
 * Coverage: RF-5b-3 (delete workshop)
 */
test("admin deletes workshop with confirmation modal", async ({ page }) => {
  const admin = await createOrResetAdminUser();
  const { workshops } = await resetWorkshopsAndAccess();
  const targetWorkshop = workshops[0];

  await page.goto("/auth/login");
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.click("button[type='submit']");
  await page.waitForURL("**/catalogo", { timeout: 30000 });
  await page.waitForTimeout(1000);

  await page.goto(`/admin/talleres/${targetWorkshop.id}`);
  await expect(page.getByRole("heading", { name: "Editar Taller" })).toBeVisible();

  // Click delete → abre modal de confirmación
  await page.click('button[data-testid="delete-button"]');
  await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();

  // Confirmar en el modal
  await page.click('button[data-testid="delete-confirm"]');

  // Tras delete exitoso, redirige a la lista
  await page.waitForURL("**/admin/talleres", { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1, name: "Talleres" })).toBeVisible();

  // Verificación DB — el workshop ya no existe (singleton del helper)
  const { data: after } = await supabaseAdmin
    .from("workshops")
    .select("id")
    .eq("id", targetWorkshop.id)
    .maybeSingle();

  expect(after).toBeNull();
});

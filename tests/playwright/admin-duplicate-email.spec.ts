import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, supabaseAdmin } from "./_helpers/supabase-admin";
import { seedWorkshop } from "./_helpers/workshop";

/**
 * E2E Spec [5c-3]: Duplicate Email Validation
 */
test.describe("Admin: Duplicate Email Validation [5c-3]", () => {
  let adminEmail: string;
  let adminPassword: string;
  let workshopId: string;

  test.beforeEach(async ({ page }) => {
    const admin = await createOrResetAdminUser();
    adminEmail = admin.email;
    adminPassword = admin.password;

    const workshop = await seedWorkshop({
      title: "Test Workshop",
      instructor: "Instructor Test",
      status: "disponible",
    });
    workshopId = workshop.id;

    await page.goto("/auth/login");
    await page.fill('input[data-testid="input-email"]', adminEmail);
    await page.fill('input[data-testid="input-password"]', adminPassword);
    await page.click('button[data-testid="btn-submit"]');
    await page.waitForURL(/\/admin/);
  });

  test("should reject duplicate email on second creation", async ({ page }) => {
    const testEmail = `alumno-${Date.now()}@test.local`;
    const testPassword = "TempPassword123";

    // Crear primer alumno
    const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    await supabaseAdmin.from("users").insert({
      id: authUser?.user.id,
      email: testEmail,
      role: "alumno",
      password_changed: false,
    });

    // Navegar a students page
    await page.goto(`/admin/talleres/${workshopId}/alumnos`);
    await page.waitForSelector("table");

    // Click "Nuevo Alumno"
    await page.click('button[data-testid="btn-new-student"]');
    await page.waitForSelector('[data-testid="create-student-modal"]');

    await page.fill('input[data-testid="input-email"]', testEmail);
    await page.fill('input[data-testid="input-password"]', testPassword);
    await page.click('button[data-testid="btn-create"]');

    // Esperar error message
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });

    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toContain("Email");
  });
});

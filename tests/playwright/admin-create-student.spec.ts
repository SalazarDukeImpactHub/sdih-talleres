import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, supabaseAdmin, seedWorkshop } from "./_helpers/supabase-admin";

/**
 * E2E Spec [5c-1]: Create Student
 * Admin crea un nuevo alumno y recibe clave de acceso en modal.
 */
test.describe("Admin: Create Student [5c-1]", () => {
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

  test("should create a new student and display access key", async ({
    page,
  }) => {
    await page.goto(`/admin/talleres/${workshopId}/alumnos`);
    await page.waitForSelector("table", { timeout: 5000 });

    await page.click('button[data-testid="btn-new-student"]');
    await page.waitForSelector('[data-testid="create-student-modal"]');

    const testEmail = `alumno-${Date.now()}@test.local`;
    const testPassword = "TempPassword123";
    await page.fill('input[data-testid="input-email"]', testEmail);
    await page.fill('input[data-testid="input-password"]', testPassword);
    await page.click('button[data-testid="btn-create"]');

    await page.waitForSelector('[data-state="key-revealed"]', { timeout: 5000 });

    const keyText = await page.locator("code").first().textContent();
    expect(keyText).toBeTruthy();

    const dbUser = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", testEmail)
      .single();
    expect(dbUser.data).toBeTruthy();
    expect(dbUser.data.role).toBe("alumno");
  });
});

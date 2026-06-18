import { test, expect } from "@playwright/test";
import { createOrResetAdminUser, supabaseAdmin } from "./_helpers/supabase-admin";
import { seedWorkshop } from "./_helpers/workshop";

/**
 * E2E Spec [5c-2]: Student Table Displays Progress
 */
test.describe("Admin: Student Progress Display [5c-2]", () => {
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

  test("should display student progress percentage", async ({ page }) => {
    // Crear alumno en DB
    const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
      email: `alumno-${Date.now()}@test.local`,
      password: "TestPassword123",
      email_confirm: true,
    });

    await supabaseAdmin.from("users").insert({
      id: authUser?.user.id,
      email: authUser?.user.email,
      role: "alumno",
      password_changed: false,
    });

    // Crear acceso key
    await supabaseAdmin.from("workshop_access").insert({
      user_id: authUser?.user.id,
      workshop_id: workshopId,
      access_key: "TEST-KEY-123",
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Navegar a students page
    await page.goto(`/admin/talleres/${workshopId}/alumnos`);
    await page.waitForSelector("table");

    // Esperar que se cargue alumno
    await page.waitForSelector(`[data-testid="student-row"]`, { timeout: 5000 });

    // Verificar que el % aparece
    const progressCell = page.locator("text=/\d+%/").first();
    await expect(progressCell).toBeVisible();
  });
});

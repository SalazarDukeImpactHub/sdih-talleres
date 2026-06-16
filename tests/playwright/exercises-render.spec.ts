import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
  seedExercises,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";

/**
 * E2E Test Suite for Exercise Card Render [4a-1]
 *
 * Design Decision D-4: Exercise cards render with all required elements
 * - Number badge (1, 2, 3, 4)
 * - Title, objective (with ⚡ icon)
 * - Prompt text (monospace, pre-wrap)
 * - Textarea (initially empty)
 * - "Listo" button (initially disabled)
 * - Status badge ("Pendiente" gray)
 *
 * Setup: beforeEach creates workshops + sections + 4 exercises via seedExercises()
 * Acceptance: All 4 exercise cards render correctly
 */

test.describe("Exercise Cards [4a-1] — Render", () => {
  test.beforeEach(async ({ page }) => {
    // Reset everything and login as seed user
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);

    // Seed sections and exercises for first workshop
    const workshopId = workshops[0].id;
    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);

    // Navigate to workshop taller section
    await loginAsSeedUser(page);
    await page.goto(`/taller/${workshops[0].slug}`);
    await page.waitForSelector("text=Taller", { timeout: 5000 });

    // Click on Taller in sidebar to navigate to exercises
    await page.click('button:has-text("Taller")');
    await page.waitForSelector("text=Configura tu primer store", { timeout: 5000 });
  });

  test("[4-1] — 4 exercise cards render with correct structure", async ({
    page,
  }) => {
    // Verify 4 exercise cards are visible
    const exerciseCards = page.locator('[class*="bg-navy-900"][class*="border"][class*="rounded-lg"]').filter({
      has: page.locator('[class*="font-mono"]'),
    });

    const cardCount = await exerciseCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Check for number badges (1, 2, 3, 4)
    await expect(page.locator('[class*="rounded-full"]').filter({ hasText: "1" })).toBeVisible();
    await expect(page.locator('[class*="rounded-full"]').filter({ hasText: "2" })).toBeVisible();
    await expect(page.locator('[class*="rounded-full"]').filter({ hasText: "3" })).toBeVisible();
    await expect(page.locator('[class*="rounded-full"]').filter({ hasText: "4" })).toBeVisible();

    // Check for titles
    await expect(page.getByText("Configura tu primer store de memoria")).toBeVisible();
    await expect(page.getByText("Implementá búsqueda semántica")).toBeVisible();
    await expect(page.getByText("Conectá tu storage a un LLM")).toBeVisible();
    await expect(page.getByText("Optimizá la búsqueda de memoria")).toBeVisible();

    // Check for objectives (with ⚡ icon)
    await expect(page.getByText("Aprender a crear un almacén de vectores")).toBeVisible();
    await expect(page.getByText("Crear búsqueda inteligente con embeddings")).toBeVisible();

    // Check for prompt text (monospace pre-wrap)
    const promptBlocks = page.locator('pre[class*="font-mono"]');
    const promptCount = await promptBlocks.count();
    expect(promptCount).toBeGreaterThanOrEqual(4);

    // Verify first prompt contains expected text (substring)
    const firstPrompt = promptBlocks.first();
    await expect(firstPrompt).toContainText("vectores");

    // Check for textareas (initially empty)
    const textareas = page.locator('textarea[placeholder*="respuesta"]');
    const textareaCount = await textareas.count();
    expect(textareaCount).toBeGreaterThanOrEqual(4);

    // Verify first textarea is empty
    const firstTextarea = textareas.first();
    await expect(firstTextarea).toHaveValue("");

    // Check for "Marcar como listo" buttons (initially disabled)
    const buttons = page.locator('button:has-text("Marcar como listo")');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(4);

    // Verify first button is disabled (no text in textarea)
    const firstButton = buttons.first();
    await expect(firstButton).toBeDisabled();

    // Check for status badges ("Pendiente" gray)
    await expect(page.locator('[class*="bg-gray-500"][class*="text-white"]').filter({ hasText: "Pendiente" })).toBeVisible();
  });

  test("[4-1] — Textarea placeholder visible", async ({ page }) => {
    // Verify placeholder text is visible in textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toHaveAttribute("placeholder", /respuesta/i);
  });

  test("[4-1] — Status badge color correct", async ({ page }) => {
    // Verify status badge has gray color (pending state)
    const statusBadge = page.locator('[class*="bg-gray-500"][class*="text-white"]').filter({ hasText: "Pendiente" }).first();
    await expect(statusBadge).toHaveClass(/bg-gray-500/);
  });
});

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
 * E2E Test Suite for Copy Prompt Button [4a-2]
 *
 * Design Decision D-2 & D-6: CopyButton copies prompt text to clipboard
 * - Requires clipboard permissions (test.use)
 * - Button label changes to "Copiado" on success
 * - Clipboard content matches prompt_text exactly
 * - Label reverts after 2s
 *
 * Setup: beforeEach creates workshops + sections + 4 exercises via seedExercises()
 * Acceptance: Copy button works correctly, clipboard has prompt, label changes/reverts
 */

test.describe("Exercise Copy Prompt [4a-2] — Copy Button", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

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

  test("[4-2] — Click copy button, label changes to 'Copiado', reverts after 2s", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Find first copy button (should say "Copiar prompt")
    const copyButton = page.locator('button:has-text("Copiar prompt")').first();
    await expect(copyButton).toBeVisible();

    // Click copy button
    await copyButton.click();

    // Verify label changes to "Copiado"
    await expect(copyButton).toContainText("Copiado");

    // Read clipboard and verify it contains expected prompt text
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("vectores");
    expect(clipboardText.length).toBeGreaterThan(50);

    // Wait 2.5s for label to revert
    await page.waitForTimeout(2500);

    // Verify label reverted to "Copiar prompt"
    await expect(copyButton).toContainText("Copiar prompt");
  });

  test("[4-2] — Copy button is disabled while showing 'Copiado'", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Find first copy button
    const copyButton = page.locator('button:has-text("Copiar prompt")').first();

    // Click copy button
    await copyButton.click();

    // Verify button is disabled
    await expect(copyButton).toBeDisabled();

    // Wait for revert
    await page.waitForTimeout(2500);

    // Verify button is enabled again
    await expect(copyButton).not.toBeDisabled();
  });

  test("[4-2] — Multiple exercises' copy buttons work independently", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Get all copy buttons
    const copyButtons = page.locator('button:has-text("Copiar prompt")');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Click first button
    const firstButton = copyButtons.nth(0);
    await firstButton.click();
    await expect(firstButton).toContainText("Copiado");

    // Second button should still say "Copiar prompt" (not affected)
    const secondButton = copyButtons.nth(1);
    await expect(secondButton).toContainText("Copiar prompt");
    await expect(secondButton).not.toBeDisabled();

    // Click second button
    await secondButton.click();
    await expect(secondButton).toContainText("Copiado");
    await expect(secondButton).toBeDisabled();

    // First button should have reverted by now (or be reverting)
    await page.waitForTimeout(2500);
    await expect(firstButton).toContainText("Copiar prompt");
    await expect(firstButton).not.toBeDisabled();
  });

  test("[4-2] — Clipboard contains full prompt text", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Expected prompt from seed data
    const expectedPromptSnippet = "vectores de embeddings en un almacén de memoria";

    // Click copy button
    const copyButton = page.locator('button:has-text("Copiar prompt")').first();
    await copyButton.click();

    // Read clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Verify it contains expected snippet
    expect(clipboardText).toContain(expectedPromptSnippet);
  });
});

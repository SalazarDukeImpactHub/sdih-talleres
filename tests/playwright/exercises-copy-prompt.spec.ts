import { test, expect } from "@playwright/test";
import {
  resetSeedUser,
  resetWorkshopsAndAccess,
  setSeedUserPasswordChanged,
  seedSectionsAndGlossary,
  seedExercises,
} from "./_helpers/supabase-admin";
import { loginAsSeedUser } from "./_helpers/auth";
import { getWorkshopSidebar } from "./_helpers/workshop";

/**
 * E2E Test Suite for Exercise Copy Prompt Button [4a-2]
 *
 * Selectores: data-testid="copy-button" + data-state="idle|copied" para
 * referenciar el botón independiente de su texto (que cambia al cliquear).
 */

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("Exercise Copy Prompt [4a-2] — Copy Button", () => {
  test.beforeEach(async ({ page }) => {
    await resetSeedUser();
    const { workshops } = await resetWorkshopsAndAccess();
    await setSeedUserPasswordChanged(true);

    const workshopId = workshops[0].id;
    await seedSectionsAndGlossary(workshopId);
    await seedExercises(workshopId, 4);

    await loginAsSeedUser(page);
    await page.goto(`/taller/${workshops[0].slug}`);

    const sidebar = await getWorkshopSidebar(page);
    await sidebar.locator('button:has-text("Taller")').click();

    await page
      .getByTestId("exercise-card")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  });

  test("[4-2] — Click copy: label cambia, copia al clipboard, vuelve tras 2s", async ({
    page,
  }) => {
    const firstCard = page.getByTestId("exercise-card").first();
    const copyButton = firstCard.getByTestId("copy-button");

    // Estado inicial idle
    await expect(copyButton).toHaveAttribute("data-state", "idle");
    await expect(copyButton).toContainText("Copiar prompt");

    await copyButton.click();

    // Estado copied + texto cambió
    await expect(copyButton).toHaveAttribute("data-state", "copied");
    await expect(copyButton).toContainText("Copiado");

    // Clipboard tiene el prompt
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("vectores");
    expect(clipboardText.length).toBeGreaterThan(50);

    // Vuelve a idle tras 2s
    await page.waitForTimeout(2300);
    await expect(copyButton).toHaveAttribute("data-state", "idle");
    await expect(copyButton).toContainText("Copiar prompt");
  });

  test("[4-2] — Copy button disabled mientras está en 'Copiado'", async ({
    page,
  }) => {
    const firstCard = page.getByTestId("exercise-card").first();
    const copyButton = firstCard.getByTestId("copy-button");

    await expect(copyButton).toBeEnabled();
    await copyButton.click();
    await expect(copyButton).toBeDisabled();

    // Tras 2s vuelve a enabled
    await page.waitForTimeout(2300);
    await expect(copyButton).toBeEnabled();
  });

  test("[4-2] — Copy buttons de 4 ejercicios funcionan independientes", async ({
    page,
  }) => {
    const cards = page.getByTestId("exercise-card");
    await expect(cards).toHaveCount(4);

    // Click solo en el segundo: el primero debe seguir idle
    const secondCopy = cards.nth(1).getByTestId("copy-button");
    const firstCopy = cards.nth(0).getByTestId("copy-button");

    await secondCopy.click();
    await expect(secondCopy).toHaveAttribute("data-state", "copied");
    await expect(firstCopy).toHaveAttribute("data-state", "idle");

    // Clipboard tiene el prompt del SEGUNDO ejercicio
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("búsqueda semántica");
  });
});

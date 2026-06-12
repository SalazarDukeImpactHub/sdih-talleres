import { test, expect } from "@playwright/test";

test.describe("Auth: Restricted page — VPN stub", () => {
  test("debe mostrar página restringida con componentes esperados", async ({
    page,
  }) => {
    // 1. Visitar /restricted (página pública)
    await page.goto("/restricted");

    // 2. Expect ver logo cerebro (emoji) + título + texto
    const brainEmoji = page.locator('text=🧠');
    expect(await brainEmoji.isVisible()).toBe(true);

    // 3. Expect ver título "Acceso restringido"
    const title = page.locator('text=Acceso restringido');
    expect(await title.isVisible()).toBe(true);

    // 4. Expect ver texto VPN
    const vpnText = page.locator('text=VPN');
    expect(await vpnText.isVisible()).toBe(true);

    // 5. Expect ver link de contacto (href o botón con acción)
    const contactLink = page.locator('a[href*="mailto:"], a[href*="contact"], button:has-text("contacto")');
    expect(await contactLink.isVisible()).toBe(true);
  });
});

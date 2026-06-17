import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Load .env.local so helpers (supabase-admin) can read SUPABASE_SERVICE_ROLE_KEY.
// Next.js auto-loads .env.local for the webServer, but the Playwright Node.js
// process (and the spec helpers) does not — so we load it explicitly.
try {
  process.loadEnvFile(path.resolve(__dirname, ".env.local"));
} catch {
  // .env.local missing (e.g. CI). Assume env vars come from the host.
}

export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: "**/*.spec.ts",
  // Los specs comparten el mismo usuario seed en Supabase (alumna@test.com),
  // entonces no pueden correr en paralelo o se pisan password_changed entre sí.
  // Diseño correcto a futuro: 1 user seed por spec. Por ahora: serial.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300000,
  },
});

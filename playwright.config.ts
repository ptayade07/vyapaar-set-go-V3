import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  // fullyParallel: false only serializes tests within one file -- Playwright still runs separate
  // spec files across multiple workers by default. Several concurrent browser sessions all hitting
  // the same dev server and Neon connection pool at once (each query already ~1.4s round-trip)
  // caused real timeouts here that had nothing to do with app or test correctness. One worker only.
  workers: 1,
  // Neon's per-query round-trip in this environment runs close to 1.5s even warm (see README's
  // Database Setup With Neon section), and several flows here chain multiple page loads -- the
  // 30s default is too tight for that, not for anything the app itself is doing slowly.
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

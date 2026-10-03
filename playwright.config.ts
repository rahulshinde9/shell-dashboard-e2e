import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(
  (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.CI,
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4200",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: [
    {
      command: "npm start -- --host 0.0.0.0",
      cwd: "../mfe-dashboard",
      url: "http://localhost:4201/remoteEntry.js",
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
    {
      command: "npm start -- --host 0.0.0.0",
      cwd: "../app-shell-angular",
      url: "http://localhost:4200",
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
  ],
});

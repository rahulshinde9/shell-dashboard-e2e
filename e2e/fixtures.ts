import { expect, test as base, type Page } from "@playwright/test";

type ShellFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<ShellFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      if (window.location.origin !== "http://localhost:4200") {
        return;
      }

      window.localStorage.setItem(
        "authState",
        JSON.stringify({
          isLoggedIn: true,
          user: {
            username: "synthetic-e2e",
            email: "e2e@example.test",
            name: "E2E User",
          },
          token: "synthetic-test-only",
        }),
      );
    });

    await use(page);
  },
});

export { expect };

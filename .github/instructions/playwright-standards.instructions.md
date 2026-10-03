---
name: Shell Dashboard Playwright Standards
description: "Use when writing or changing Playwright E2E tests for the Angular app shell, federated dashboard remote, authentication, responsive navigation, Module Federation fallbacks, or cross-MFE flows."
applyTo: ["e2e/**/*.ts", "playwright.config.ts"]
---

# Shell Dashboard Playwright Standards

## Architecture And Isolation

- This E2E project uses Playwright 1.63.x to exercise the Angular 22 app-shell host (`http://localhost:4200`) and Angular 22 SSR dashboard remote (`http://localhost:4201`, remote entry `/remoteEntry.js`, exposed module `./DashboardModule`). The Playwright web servers start the remote before the host. Keep the E2E project responsible for orchestration, not application implementation.
- Separate three test layers: host-only shell behavior with remote requests intercepted; remote-only behavior through a standalone preview only when that remote supports standalone bootstrap; and integrated host-plus-remote journeys using the configured federation servers. This dashboard currently throws a shared-module eager-consumption error when launched directly, so verify its `remoteEntry.js` contract and exercise its UI through the shell until standalone bootstrap is supported. Name the layer in the test title and avoid silently substituting one for another.
- The host currently owns `/home`, `/auth/**`, `/error/**`, the `/mfa/react-dashboard` host route, and four coming-soon `/mfa/*` routes. `/mfa/dashboard` loads the dashboard remote and falls back to the host's MFE-down screen if loading fails. Keep assertions aligned with those actual route owners.
- Assert only cross-MFE contracts that exist: host navigation to the remote, remote rendering within the host, route/breadcrumb synchronization, and the configured load-failure fallback. Do not invent an event bus, shared store, or query synchronization contract. If one is added, test its public contract at both producer and consumer boundaries.
- Test resilience deterministically by intercepting or aborting the remote-entry request and asserting the host fallback. Test normal integration without that interception. Do not depend on a remote being unavailable on the network.

## Page Objects And Locators

- Use small, typed page/component objects composed by a shell page. Keep shell header/navigation objects separate from domain objects owned by the dashboard remote. A shell page may contain a dashboard page object; do not create one locator class for every application concern.
- Prefer user-facing locators in this order: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, then a documented test id. Never use XPath, styling classes, Material implementation selectors, or deep DOM chains as primary locators.
- Add a `data-testid` only when the user-facing contract is genuinely ambiguous or unavailable. Prefix it with the owning boundary, such as `shell-...` or `dashboard-...`; avoid adding test-only markup to production components for convenience.
- Do not use `page.locator('div > button.mat-primary')`, `nth()` against unstable collections, or selectors coupled to Angular/Material internals. Scope duplicate controls by a semantic landmark or form.

Typed composition example:

```ts
import type { Locator, Page } from "@playwright/test";

export class ShellNavigation {
  constructor(private readonly page: Page) {}

  application(name: string): Locator {
    return this.page.getByRole("link", { name: `Open ${name}` });
  }

  menuItem(name: string): Locator {
    return this.page.getByRole("link", { name, exact: true });
  }

  async openMenu(): Promise<void> {
    await this.page.getByRole("button", { name: "Toggle sidebar" }).click();
  }
}

export class DashboardRemotePage {
  constructor(private readonly page: Page) {}

  heading(name: string): Locator {
    return this.page.getByRole("heading", { name, exact: true });
  }

  emailField(): Locator {
    return this.page.getByRole("textbox", { name: "Email" });
  }
}

export class ShellPage {
  readonly navigation: ShellNavigation;
  readonly dashboard: DashboardRemotePage;

  constructor(readonly page: Page) {
    this.navigation = new ShellNavigation(page);
    this.dashboard = new DashboardRemotePage(page);
  }
}
```

## Async Behavior And Hydration

- Never use arbitrary sleeps such as `page.waitForTimeout()`. Wait on observable user-facing state with web-first assertions (`expect(locator).toBeVisible()`, `toHaveURL`, `toHaveText`) or on a specific network contract with `page.waitForResponse()`.
- Register response waits before triggering the action. Match method, URL, and expected status; do not wait on generic `networkidle` for pages with federation or ongoing requests.
- For Angular routing, hydration, and lazy federated chunks, assert the destination URL and the actual remote landmark/heading. A successful shell route alone does not prove that the remote rendered.
- Avoid racing drawer transitions. Click the accessible toggle, then assert the expected menu item is visible. At widths up to 839px, verify both application shortcuts and workspace menu are present in the open drawer; verify selecting a workspace closes the mobile drawer while desktop navigation remains open.

## Authentication And Network

- Prefer a test fixture with a deterministic, synthetic session for tests of authenticated shell UI. Never commit real credentials or real `storageState`. Keep any generated state outside the repository and out of traces/artifacts.
- Test authentication itself through the login screen with synthetic credentials and a mocked local API response. Cover validation, success, failure, logout, and unauthenticated guard redirect separately. Do not mistake synthetic client storage for an authorization test; server/API authorization requires a separately asserted response.
- For cross-origin cookie behavior, use the real configured test origin and assert cookies through Playwright's context APIs without printing values. Never disable TLS verification to handle origin problems.
- Use `page.route()` for deterministic API contracts, 401/403/500 fault injection, and remote-entry failure. Match the precise endpoint and method so unrelated traffic remains real. Do not leak auth headers to remote or third-party origins in mocks.

Safe federated journey example:

```ts
import { expect, test } from "@playwright/test";
import { ShellPage } from "./pages/shell.page";

test("shell loads the dashboard remote and its primary content", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await page.goto("/mfa/dashboard");

  await expect(page).toHaveURL(/\/mfa\/dashboard$/);
  await expect(shell.dashboard.heading("Dashboard")).toBeVisible();
  await expect(shell.dashboard.emailField()).toBeVisible();

  await shell.navigation.openMenu();
  await expect(shell.navigation.menuItem("Performance")).toBeVisible();
});
```

Safe synthetic auth fixture example:

```ts
import { test as base } from "@playwright/test";

type AuthFixtures = { authenticatedPage: void };

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "authState",
        JSON.stringify({
          isLoggedIn: true,
          user: {
            username: "synthetic-e2e",
            email: "e2e@example.test",
            name: "Test User",
          },
          token: "synthetic-test-only",
        }),
      );
    });
    await use();
  },
});
```

## Coverage And Artifacts

- For each changed screen, cover its primary user action, validation/disabled/error state when applicable, navigation destination, and keyboard-accessible name. Avoid asserting implementation details that do not affect users.
- The current changed shell behavior includes public/auth pages, home links/error cards, shell breadcrumbs/theme/profile/logout, desktop and mobile two-rail navigation, all six app shortcuts and six workspace destinations, dashboard remote success/failure, and footer absence from public/authenticated layouts. Reconcile this checklist against the live route map before adding tests; do not claim a placeholder route has domain functionality.
- Keep tests isolated, reset only the state they create, and use unique synthetic values. Configure trace/video/screenshot retention for failure diagnosis without persisting credentials or customer data.
- When adding a test, run the narrow spec first, then the suite/build gate required by the E2E project. Report unavailable remotes, backend dependencies, or environment blockers rather than weakening assertions.

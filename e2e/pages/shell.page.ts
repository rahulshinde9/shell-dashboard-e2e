import type { Locator, Page } from "@playwright/test";

export class ShellHeader {
  readonly breadcrumb: Locator;
  readonly sidebarToggle: Locator;
  readonly userMenu: Locator;

  constructor(private readonly page: Page) {
    this.breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    this.sidebarToggle = page.getByRole("button", {
      name: "Toggle sidebar",
    });
    this.userMenu = page.getByRole("button", { name: "User menu" });
  }

  themeToggle(): Locator {
    return this.page.getByRole("button", {
      name: /Switch to (light|dark) theme/,
    });
  }
}

export class ShellNavigation {
  readonly applications: Locator;
  readonly workspaceMenu: Locator;

  constructor(private readonly page: Page) {
    this.applications = page.getByRole("navigation", {
      name: "Applications",
    });
    this.workspaceMenu = page.getByRole("navigation", {
      name: "Workspace menu",
    });
  }

  application(name: string): Locator {
    return this.applications.getByRole("link", { name: `Open ${name}` });
  }

  workspaceItem(name: string): Locator {
    return this.workspaceMenu.getByRole("link", { name, exact: true });
  }

  group(name: string): Locator {
    return this.page.getByRole("heading", { name, level: 2 });
  }
}

export class DashboardRemotePage {
  readonly heading: Locator;
  readonly emailField: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole("heading", {
      name: "Dashboard",
      exact: true,
    });
    this.emailField = page.getByRole("textbox", { name: "Email" });
  }
}

export class ShellPage {
  readonly header: ShellHeader;
  readonly navigation: ShellNavigation;
  readonly dashboard: DashboardRemotePage;
  readonly footer: Locator;

  constructor(readonly page: Page) {
    this.header = new ShellHeader(page);
    this.navigation = new ShellNavigation(page);
    this.dashboard = new DashboardRemotePage(page);
    this.footer = page.locator("app-footer");
  }
}

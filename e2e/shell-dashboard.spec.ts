import { expect, test } from "./fixtures";
import { ShellPage } from "./pages/shell.page";

const APPLICATION_SHORTCUTS = [
  { name: "Finance Suite", route: "/mfa/dashboard", section: "Finance Suite" },
  {
    name: "Analytics Studio",
    route: "/mfa/react-dashboard",
    section: "Analytics Studio",
  },
  { name: "MandapPro", route: "/mfa/mandap-pro", section: "MandapPro" },
  {
    name: "Planning Desk",
    route: "/mfa/financial-planning",
    section: "Planning Desk",
  },
  {
    name: "School Suite",
    route: "/mfa/school-management",
    section: "School Suite",
  },
  {
    name: "Client Relations",
    route: "/mfa/customer-management",
    section: "Client Relations",
  },
] as const;

const WORKSPACE_DESTINATIONS = [
  { name: "Dashboard", route: "/mfa/dashboard", section: "Dashboard" },
  {
    name: "Performance",
    route: "/mfa/react-dashboard",
    section: "Performance",
  },
  { name: "Events", route: "/mfa/mandap-pro", section: "Events" },
  {
    name: "Financial Planning",
    route: "/mfa/financial-planning",
    section: "Financial Planning",
  },
  { name: "Education", route: "/mfa/school-management", section: "Education" },
  { name: "Clients", route: "/mfa/customer-management", section: "Clients" },
] as const;

test("public dashboard link sends unauthenticated visitors to login", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Welcome to Angular Learning Hub" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Technology Stack" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Error Pages" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Learning & Experimentation" }),
  ).toBeVisible();
  await expect(shell.footer).toHaveCount(0);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);

  await page.goto("/home");
  await page.getByRole("button", { name: "View Dashboard" }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("login and forgot-password navigation validates the public auth pages", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Get Started" }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await page.locator("form").getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Username is required")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();

  await page.getByRole("button", { name: "Forgot Password?" }).click();
  await expect(page).toHaveURL(/\/auth\/forgot-password$/);
  const email = page.getByRole("textbox", { name: "Email" });
  await expect(email).toBeVisible();
  await page.getByRole("button", { name: "Send Reset Instructions" }).click();
  await expect(
    page.getByText("Please enter a valid email address"),
  ).toBeVisible();
  await email.fill("not-an-email");
  await page.getByRole("button", { name: "Send Reset Instructions" }).click();
  await expect(
    page.getByText("Please enter a valid email address"),
  ).toBeVisible();
  await email.fill("e2e@example.test");
  await page.getByRole("button", { name: "Send Reset Instructions" }).click();
  await expect(
    page.getByText("Password reset instructions have been sent to your email."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to Login" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("home error cards open their pages and primary navigation returns", async ({
  page,
}) => {
  const errorPages = [
    {
      link: "403 Forbidden",
      path: "/error/403",
      heading: "403 - Access Forbidden",
      action: "Go Home",
      actionPath: /\/home$/,
    },
    {
      link: "404 Not Found",
      path: "/error/404",
      heading: "404 - Page Not Found",
      action: "Go Home",
      actionPath: /\/home$/,
    },
    {
      link: "Session Expired",
      path: "/error/session-expired",
      heading: "Session Expired",
      action: "Login Again",
      actionPath: /\/auth\/login$/,
    },
    {
      link: "HTTP Error",
      path: "/error/error",
      heading: "500 - Internal Server Error",
      action: "Go to Home",
      actionPath: /\/home$/,
    },
    {
      link: "MFE Down",
      path: "/error/mfe-down",
      heading: "Micro Frontend Unavailable",
      action: "Go to Home",
      actionPath: /\/home$/,
    },
  ];

  for (const errorPage of errorPages) {
    await page.goto("/");
    await page.getByRole("link", { name: new RegExp(errorPage.link) }).click();

    await expect(page).toHaveURL(new RegExp(`${errorPage.path}$`));
    await expect(
      page.getByRole("heading", { name: errorPage.heading }),
    ).toBeVisible();
    await page.getByRole("button", { name: errorPage.action }).click();
    await expect(page).toHaveURL(errorPage.actionPath);
  }
});

test("authenticated shell loads the federated dashboard", async ({
  authenticatedPage: page,
}) => {
  const shell = new ShellPage(page);
  await page.goto("/mfa/dashboard");

  await expect(page).toHaveURL(/\/mfa\/dashboard$/);
  await expect(shell.dashboard.heading).toBeVisible();
  await expect(shell.dashboard.emailField).toBeVisible();
  await expect(shell.dashboard.emailField).toHaveAttribute("required", "");
  await expect(shell.dashboard.emailField).toHaveAttribute(
    "placeholder",
    "Enter email",
  );
  await shell.dashboard.emailField.fill("person@example.test");
  await expect(shell.dashboard.emailField).toHaveValue("person@example.test");
  await expect(shell.header.breadcrumb).toContainText("Finance Suite");
  await expect(shell.header.breadcrumb).toContainText("Dashboard");
  await expect(shell.footer).toHaveCount(0);
});

test("desktop navigation exposes all applications and workspace destinations", async ({
  authenticatedPage: page,
}) => {
  const shell = new ShellPage(page);
  await page.route("http://localhost:4202/assets/remoteEntry.js", (route) =>
    route.abort(),
  );
  await page.goto("/mfa/dashboard");
  await expect(shell.dashboard.heading).toBeVisible();

  for (const application of APPLICATION_SHORTCUTS) {
    await expect(shell.navigation.application(application.name)).toBeVisible();
  }

  await shell.navigation.application("Finance Suite").hover();
  await expect(
    page.getByText("Finance Suite", { exact: true }).last(),
  ).toBeVisible();

  for (const destination of WORKSPACE_DESTINATIONS) {
    await expect(
      shell.navigation.workspaceItem(destination.name),
    ).toBeVisible();
  }

  await shell.header.sidebarToggle.click();
  await expect(shell.navigation.group("Overview")).toBeVisible();
  await expect(shell.navigation.group("Workspaces")).toBeVisible();

  for (const destination of WORKSPACE_DESTINATIONS) {
    await shell.navigation.workspaceItem(destination.name).click();
    await expect(page).toHaveURL(new RegExp(`${destination.route}$`));
    await expect(shell.header.breadcrumb).toContainText(destination.section);

    if (destination.name === "Dashboard") {
      await expect(shell.dashboard.emailField).toBeVisible();
    } else if (destination.name === "Performance") {
      await expect(
        page.getByRole("heading", { name: "Micro Frontend Unavailable" }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { name: "Coming Soon" }),
      ).toBeVisible();
    }
  }

  await shell.header.sidebarToggle.click();
  await expect(shell.navigation.group("Overview")).toHaveCount(0);
  await expect(shell.navigation.workspaceItem("Dashboard")).toBeVisible();
});

test("successful login and logout clear the authenticated session", async ({
  page,
}) => {
  const authHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:4200",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };

  await page.route("http://localhost:8080/api/auth/**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: authHeaders });
      return;
    }

    const response = route.request().url().endsWith("/login")
      ? {
          token: "e2e-login-token",
          user: {
            username: "e2e-user",
            email: "e2e@example.com",
            name: "E2E User",
          },
        }
      : { message: "Logged out" };

    await route.fulfill({ status: 200, headers: authHeaders, json: response });
  });

  await page.goto("/auth/login");
  await page.getByLabel("Username").fill("e2e-user");
  await page.getByLabel("Password").fill("e2e-password");
  await page.locator("form").getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/mfa\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "User menu" }).click();
  const logoutResponse = page.waitForResponse(
    (response) =>
      response.url() === "http://localhost:8080/api/auth/logout" &&
      response.request().method() === "POST",
  );
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await logoutResponse;

  await expect(page).toHaveURL(/\/auth\/logout$/);
  await expect(
    page.getByText("Successfully Logged Out", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(window.localStorage.getItem("authState") ?? "{}")
            .isLoggedIn,
      ),
    )
    .toBe(false);

  await page.goto("/mfa/dashboard");
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("rejected credentials keep the visitor on login and show the API message", async ({
  page,
}) => {
  const authHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:4200",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };

  await page.route("http://localhost:8080/api/auth/login", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: authHeaders });
      return;
    }

    await route.fulfill({
      status: 401,
      headers: authHeaders,
      json: { message: "Invalid username or password" },
    });
  });

  await page.goto("/auth/login");
  await page.getByLabel("Username").fill("wrong-user");
  await page.getByLabel("Password").fill("synthetic-wrong-password");
  await page.locator("form").getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByText("Invalid username or password")).toBeVisible();
});

test("application shortcuts update the route and breadcrumb for every application", async ({
  authenticatedPage: page,
}) => {
  const shell = new ShellPage(page);
  await page.route("http://localhost:4202/assets/remoteEntry.js", (route) =>
    route.abort(),
  );
  await page.goto("/mfa/dashboard");
  await expect(shell.dashboard.emailField).toBeVisible();

  for (const application of APPLICATION_SHORTCUTS) {
    await shell.navigation.application(application.name).click();
    await expect(page).toHaveURL(new RegExp(`${application.route}$`));
    await expect(shell.header.breadcrumb).toContainText(application.section);
  }
});

test("header theme controls persist and the profile menu exposes its actions", async ({
  authenticatedPage: page,
}) => {
  const shell = new ShellPage(page);
  await page.goto("/home");

  await shell.header.themeToggle().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.goto("/mfa/dashboard");
  await expect(shell.dashboard.emailField).toBeVisible();
  await expect(shell.header.themeToggle()).toHaveAccessibleName(
    "Switch to light theme",
  );
  await shell.header.themeToggle().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await shell.header.userMenu.click();
  await expect(
    page.getByRole("menuitem", { name: "My Profile" }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Logout" })).toBeVisible();
  await expect(shell.footer).toHaveCount(0);
});

test("mobile drawer shows both rails and closes after workspace navigation", async ({
  authenticatedPage: page,
}) => {
  const shell = new ShellPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mfa/dashboard");
  await expect(shell.dashboard.emailField).toBeVisible();

  const primaryNavigation = page.locator(
    'aside[aria-label="Primary navigation"]',
  );
  await expect(primaryNavigation).toHaveAttribute("aria-hidden", "true");
  await shell.header.sidebarToggle.click();

  await expect(shell.navigation.applications).toBeVisible();
  await expect(shell.navigation.workspaceMenu).toBeVisible();
  await expect(shell.navigation.application("Finance Suite")).toBeVisible();
  await expect(shell.navigation.application("Client Relations")).toBeVisible();
  await expect(shell.navigation.workspaceItem("Dashboard")).toBeVisible();
  await expect(
    shell.navigation.workspaceItem("Financial Planning"),
  ).toBeVisible();

  await shell.header.sidebarToggle.click();
  await expect(primaryNavigation).toHaveAttribute("aria-hidden", "true");
  await shell.header.sidebarToggle.click();
  await expect(shell.navigation.applications).toBeVisible();

  await page
    .getByRole("button", { name: "Close sidebar" })
    .click({ position: { x: 350, y: 422 } });
  await expect(primaryNavigation).toHaveAttribute("aria-hidden", "true");

  await shell.header.sidebarToggle.click();
  await shell.navigation.workspaceItem("Events").click();
  await expect(page).toHaveURL(/\/mfa\/mandap-pro$/);
  await expect(
    page.getByRole("heading", { name: "Coming Soon" }),
  ).toBeVisible();
  await expect(primaryNavigation).toHaveAttribute("aria-hidden", "true");
});

test("dashboard remote entry is available to the shell federation host", async ({
  request,
}) => {
  const response = await request.get("http://localhost:4201/remoteEntry.js");

  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("javascript");
});

test("failed dashboard remote entry degrades to the shell MFE fallback", async ({
  authenticatedPage: page,
}) => {
  await page.route("http://localhost:4201/remoteEntry.js", (route) =>
    route.abort(),
  );
  await page.goto("/mfa/dashboard");

  await expect(
    page.getByRole("heading", { name: "Micro Frontend Unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to Home" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("React remote fallback retry keeps the user on the unavailable screen", async ({
  authenticatedPage: page,
}) => {
  let loadFailureCount = 0;
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("React MFE Load Failure")
    ) {
      loadFailureCount += 1;
    }
  });

  await page.route("http://localhost:4202/assets/remoteEntry.js", (route) =>
    route.abort(),
  );

  await page.goto("/mfa/react-dashboard");
  await expect(
    page.getByRole("heading", { name: "Micro Frontend Unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect.poll(() => loadFailureCount).toBe(1);

  await page.getByRole("button", { name: "Retry" }).click();
  await expect.poll(() => loadFailureCount).toBe(2);
  await expect(
    page.getByRole("heading", { name: "Micro Frontend Unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page).toHaveURL(/\/mfa\/react-dashboard$/);
});

test("coming-soon actions both return to the dashboard remote", async ({
  authenticatedPage: page,
}) => {
  const shell = new ShellPage(page);
  await page.goto("/mfa/mandap-pro");
  await expect(
    page.getByRole("heading", { name: "Coming Soon" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Go Back" }).click();
  await expect(shell.dashboard.emailField).toBeVisible();

  await shell.navigation.application("MandapPro").click();
  await expect(
    page.getByRole("heading", { name: "Coming Soon" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dashboard" }).click();
  await expect(shell.dashboard.emailField).toBeVisible();
});

test("HTTP error back action returns to its previous route", async ({
  page,
}) => {
  await page.goto("/home");
  await page.getByRole("link", { name: /HTTP Error/ }).click();
  await expect(
    page.getByRole("heading", { name: "500 - Internal Server Error" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Go Back" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

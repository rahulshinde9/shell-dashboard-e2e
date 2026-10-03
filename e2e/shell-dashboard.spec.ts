import { expect, test, type Page } from "@playwright/test";

async function restoreSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "authState",
      JSON.stringify({ isLoggedIn: true, user: null, token: "e2e-session" }),
    );
  });
}

async function navigateThroughSidebar(
  page: Page,
  label: string,
): Promise<void> {
  const routeByLabel: Record<string, string> = {
    Dashboard: "/mfa/dashboard",
    "React Dashboard": "/mfa/react-dashboard",
    MandapPro: "/mfa/mandap-pro",
    "Financial Planning": "/mfa/financial-planning",
    "School Management": "/mfa/school-management",
    "Customer Management": "/mfa/customer-management",
  };

  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  await page.locator(`app-sidebar a[href="${routeByLabel[label]}"]`).click();
}

test("public dashboard link sends unauthenticated visitors to login", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Welcome to Angular Learning Hub" }),
  ).toBeVisible();
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
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
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
    await page
      .locator(".error-card-link")
      .filter({ hasText: errorPage.link })
      .click();

    await expect(page).toHaveURL(new RegExp(`${errorPage.path}$`));
    await expect(
      page.getByRole("heading", { name: errorPage.heading }),
    ).toBeVisible();
    await page.getByRole("button", { name: errorPage.action }).click();
    await expect(page).toHaveURL(errorPage.actionPath);
  }
});

test("restored session loads the dashboard remote inside the shell", async ({
  page,
}) => {
  await restoreSession(page);

  await page.goto("/mfa/dashboard");

  await expect(page).toHaveURL(/\/mfa\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  const emailInput = page.getByRole("textbox", { name: "Email" });
  await expect(emailInput).toBeVisible();
  await expect(emailInput).toHaveAttribute("required", "");
});

test("authenticated sidebar navigates to every current app section", async ({
  page,
}) => {
  await restoreSession(page);
  await page.goto("/mfa/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await navigateThroughSidebar(page, "React Dashboard");
  await expect(page).toHaveURL(/\/mfa\/react-dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Micro Frontend Unavailable" }),
  ).toBeVisible();

  await navigateThroughSidebar(page, "Dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const comingSoonPages = [
    { label: "MandapPro", path: "mandap-pro" },
    { label: "Financial Planning", path: "financial-planning" },
    { label: "School Management", path: "school-management" },
    { label: "Customer Management", path: "customer-management" },
  ];

  for (const appPage of comingSoonPages) {
    await navigateThroughSidebar(page, appPage.label);
    await expect(page).toHaveURL(new RegExp(`/mfa/${appPage.path}$`));
    await expect(
      page.getByRole("heading", { name: "Coming Soon" }),
    ).toBeVisible();

    await navigateThroughSidebar(page, "Dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  }
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

# Shell and Dashboard E2E

Standalone Playwright project for testing the existing app-shell and dashboard micro-frontend flow.

## Setup

From this project directory, install dependencies for the runner and both Angular applications, then install the Playwright browser:

```bash
npm install
npm --prefix ../app-shell-angular install
npm --prefix ../mfe-dashboard install
npx playwright install chromium
```

## Run

```bash
npm test
```

Playwright starts the shell and dashboard dev servers automatically. Tests cover the unauthenticated dashboard redirect to login and dashboard rendering inside the shell with a restored session.

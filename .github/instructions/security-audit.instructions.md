---
name: Shell Dashboard E2E Security Review
description: "Use when auditing or remediating security in Playwright E2E tests, fixtures, authentication state, browser contexts, test targets, traces, screenshots, or CI configuration."
applyTo: ["e2e/**/*.ts", "playwright.config.ts"]
---

# Shell Dashboard E2E Security Review

- Treat this repository as a Playwright 1.63.x TypeScript test project, not an Angular application. Do not prescribe Angular component or server changes as if this repository owns them; identify the sibling app that owns a reproduced finding.
- Never hardcode passwords, access tokens, cookies, private keys, or production customer data in tests, fixtures, snapshots, or configuration. Load required test credentials from CI-provided environment variables and fail safely when required values are absent.
- Treat Playwright `storageState`, browser profiles, traces, videos, screenshots, and test reports as potentially sensitive artifacts. Keep authenticated state outside version control, restrict artifact retention/access, and avoid capturing secrets or PII in routine failure output.
- Audit `baseURL`, projects, global setup, and CI invocations to ensure security tests target local/approved test environments, not production or arbitrary origins. Do not weaken TLS or browser security checks to make tests pass.
- `page.evaluate` and DOM access are valid testing tools, not automatic application vulnerabilities. Flag them when they execute untrusted code, expose credentials, or create unsafe dependencies; use them sparingly and keep test payloads inert and confined to approved local targets.
- Verify negative authorization tests assert server/API denial as well as client-side navigation behavior. A route-guard redirect alone does not prove authorization.
- Report only reproducible, evidence-backed risks with severity, OWASP category, precise paths/lines, and a safe fix. Never reproduce a vulnerability against an unapproved live service, print secrets, or modify files unless remediation is explicitly requested.
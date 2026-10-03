---
name: Audit Shell Dashboard E2E Security
description: "Audit Playwright 1.63 E2E configuration and tests for credential, artifact, target-environment, and security-assertion risks."
argument-hint: "Optional spec, fixture, CI flow, or security scenario to prioritize"
agent: "agent"
---

@workspace

Perform a read-only security audit of the Playwright 1.63.x `shell-dashboard-e2e` project. Apply [Shell Dashboard E2E Security Review](../instructions/security-audit.instructions.md). Prioritize `$ARGUMENTS`; inspect `playwright.config.ts`, E2E specs, fixtures/global setup, package scripts, and CI/artifact configuration present in this repository.

Audit hardcoded credentials, committed or over-retained `storageState`, trace/video/screenshot leakage, unsafe test targets, disabled TLS/browser security, auth tests that trust only client guards, and unsafe execution of untrusted content. Do not label ordinary Playwright DOM inspection as an app XSS flaw without a credible data path. Do not modify files or run tests against production. For issues owned by the shell/dashboard source, identify the owning sibling repository and provide the needed code-level replacement there without editing it here.

For each confirmed finding provide **File** (relative path/line), **Issue** (severity, OWASP category, impact), **Current Code** (minimal evidence; redact values), **Refactored Code** (drop-in Playwright/CI replacement or exact owning-app replacement location), and **Validation** (safe local/CI assertion). Order findings Critical, High, Medium, then Low, and finish with a flat **Action Checklist** in severity order. If no issues are confirmed, state that and note any environment/artifact controls that could not be verified.
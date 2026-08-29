# Wreckmarch Testing and Deployment Policy

This document defines the browser verification gate adopted for `main`.

## Required pipeline

1. Run quality checks, unit tests, static build, Playwright E2E, and local Chromium smoke in GitHub Actions.
2. Deploy `main` to GitHub Pages only after the fast correctness gates pass.
3. After Pages finishes deploying, run a second **Live Chromium smoke** against the deployed Pages URL.
4. The live smoke must verify that the game boots into an active playable scene and the expected presentation/runtime readiness markers are present.
5. The live smoke fails on any of these browser signals:
   - `console.error`
   - `pageerror`
   - `requestfailed`
   - boot failure
   - playability/readiness assertion timeout
6. Preserve smoke/install/browser diagnostics as GitHub Actions artifacts when the live test fails.
7. A failed deployed `main` opens or updates one deduplicated GitHub Issue named `[LIVE] deployed main smoke failed` with commit, workflow run, live URL, and diagnostic tail.
8. The same Issue is automatically closed after a later deployed `main` passes the live smoke.

## Browser standard

The canonical automated browser is Playwright Chromium. The smoke runner uses Playwright's installed Chromium by default. `WM_CHROME_PATH` remains an optional override for local debugging only.

## Acceptance rule

A major gameplay/refactor milestone is not considered verified in production merely because unit tests or a local smoke test passed. The deployed GitHub Pages build must pass the Live Chromium smoke before the live build is treated as verified.

Warnings are not fatal by themselves. Only actual `console.error`, uncaught page errors, failed requests, or failed readiness/playability assertions fail the live gate.

## Architecture rule

This is a test/deployment gate, not another gameplay runtime layer. It must never patch game behavior to make tests pass. If the live gate detects a failure, fix the canonical owner of the bug and keep the smoke test as regression protection.

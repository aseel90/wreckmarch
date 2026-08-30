# Wreckmarch Testing and Deployment Policy

This document defines the canonical browser verification and deployment gate adopted for `main`.

## Current implementation status

- [x] Playwright Chromium is the canonical automated browser. — **Status:** ✅ DONE
- [x] Pre-deploy Chromium smoke runs in CI. — **Status:** ✅ DONE
- [x] Post-deploy Live Chromium smoke runs after GitHub Pages deployment. — **Status:** ✅ DONE
- [x] Live smoke collects `console.error`, `pageerror`, and `requestfailed`. — **Status:** ✅ DONE
- [x] Failure diagnostics are preserved as workflow artifacts. — **Status:** ✅ DONE
- [x] A deployed `main` failure opens/updates one deduplicated Issue. — **Status:** ✅ DONE
- [x] A later successful deployed `main` closes that Issue automatically. — **Status:** ✅ DONE
- [ ] Run E2E as three isolated Playwright shards with one worker per runner. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Use isolated retries and fail CI if any test is classified as flaky. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Merge shard blob reports into one canonical Playwright HTML report. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Route PR failure diagnostics through the Issue API permission already granted to the workflow. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Confirm the sharded E2E gate and Live Chromium gate on `main`. — **Status:** 🟡 IMPLEMENTED / PR + LIVE VERIFY

> **Status reviewed:** 2026-08-30.

## Required pipeline

1. Run quality checks/unit tests/static build, Playwright E2E, and local Chromium smoke in GitHub Actions.
2. Execute Playwright E2E as **3 GitHub Actions shards in parallel**.
3. Every E2E shard runs with **exactly one Playwright worker**. Do not increase workers inside one CI runner to gain speed.
4. Keep `fullyParallel: false` for Wreckmarch so sharding happens at the test-file level and individual files retain their existing execution semantics.
5. Each shard uploads a Playwright **blob report** plus its own textual install/test diagnostics.
6. A separate canonical job named **`E2E`** downloads all shard artifacts, merges the blob reports, produces one HTML report, and is the final E2E gate seen by branch protection/CI consumers.
7. CI retries failed tests once using Playwright **`retryStrategy: isolated`** so retries happen after the normal run, one-by-one, minimizing interference from other tests.
8. CI uses **`failOnFlakyTests: true`**. A test that fails once and only passes on retry is still a failed CI gate; retries are diagnostic evidence, not permission to hide instability.
9. Trace collection uses **`on-first-retry`** in CI. Passing first attempts do not pay trace overhead; a retry captures evidence for the failure.
10. Deploy `main` to GitHub Pages only after the fast correctness gates required by the workflow pass.
11. After Pages finishes deploying, run a second **Live Chromium smoke** against the deployed Pages URL.
12. The live smoke must verify that the game boots into an active playable scene and the expected presentation/runtime readiness markers are present.
13. The live smoke fails on any of these browser signals:
    - `console.error`
    - `pageerror`
    - `requestfailed`
    - boot failure
    - playability/readiness assertion timeout
14. Preserve browser/install/test diagnostics as GitHub Actions artifacts when a gate fails.
15. A failed deployed `main` opens or updates one deduplicated GitHub Issue named `[LIVE] deployed main smoke failed` with commit, workflow run, live URL, and diagnostic tail.
16. The same Issue is automatically closed after a later deployed `main` passes the live smoke.

## E2E architecture

Canonical layout:

```text
Quality ───────────────────────────────┐
                                      │
E2E shard 1/3 (1 worker) ────────┐    │
E2E shard 2/3 (1 worker) ────────┼──> E2E report/gate
E2E shard 3/3 (1 worker) ────────┘    │
                                      │
Smoke ─────────────────────────────────┘
```

The three shard jobs are implementation details. The stable public gate remains **`E2E`** so existing CI consumers and branch-protection rules do not need to depend on matrix-generated check names.

### Why this architecture

- Isolation is preferred over multiple workers competing for CPU/game-loop/browser resources on the same runner.
- Parallel speed comes from independent GitHub runners, not from sharing one runner between multiple browser workers.
- Blob reports preserve traces/screenshots/attachments from all shards and can be merged into one report.
- An isolated retry can distinguish a deterministic failure from interference, while `failOnFlakyTests` prevents the retry from silently turning a flaky test green.
- The system must expose the failing shard/test automatically; temporary one-off diagnostic workflows are not part of the canonical architecture.

## PR diagnostics rule

The workflow currently grants `issues: write`. PRs are also issue resources in GitHub's API, so automated PR failure comments must use the Issue comment path (`gh issue comment`) rather than relying on a separate pull-request write permission.

For E2E failures, the canonical `E2E` aggregation job should comment once with:

- merged Playwright failure summary
- failing shard result
- useful tails from shard logs
- an uploaded merged HTML report containing traces/screenshots/attachments

Do not create a separate diagnostic workflow merely to discover which test failed.

## Browser standard

The canonical automated browser is Playwright Chromium. The smoke runner uses Playwright's installed Chromium by default. `WM_CHROME_PATH` remains an optional override for local debugging only.

## Acceptance rule

A major gameplay/refactor milestone is not considered verified in production merely because unit tests, a shard, or a local smoke test passed. All three E2E shards must pass without a flaky classification, the canonical `E2E` report/gate must pass, and the deployed GitHub Pages build must pass the Live Chromium smoke before the live build is treated as verified.

Warnings are not fatal by themselves. Only actual `console.error`, uncaught page errors, failed requests, failed readiness/playability assertions, deterministic E2E failures, or flaky E2E classifications fail their corresponding gates.

## Architecture rule

This is a test/deployment gate, not another gameplay runtime layer. It must never patch game behavior to make tests pass. If a browser gate detects a failure, fix the canonical owner of the bug and keep the test as regression protection.

Do not add `*-fix`, `*-hotfix`, or permanent temporary diagnostic workflows. The canonical owners are `playwright.config.ts`, `.github/workflows/pages.yml`, the relevant test file, and the relevant production module when a real gameplay defect is proven.

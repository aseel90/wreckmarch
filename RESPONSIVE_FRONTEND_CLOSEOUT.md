# WRECKMARCH — Responsive Frontend Remediation Closeout

**Closeout date:** 2026-09-03  
**Verified HEAD:** `fa77873d5786e6baee51ff46c671aa9e7dae7e62`  
**Status:** RESPONSIVE ACCEPTANCE GATE VERIFIED

This note closes the screenshot-driven remediation tracked by `RESPONSIVE_FRONTEND_AUDIT.md`. It does not replace the original audit evidence; it records the verified remediation state reached after that audit.

## Verified remediation

- Safe-area-aware frontend sizing is centralized through `--wm-safe-top/right/bottom/left` with production fallback to `env(safe-area-inset-*)`.
- Main and Workshop/Progression no longer rely on horizontally pannable safe-area geometry in the responsive matrix.
- Workshop/Progression preserves intentional vertical scrolling while horizontal scrolling is forbidden by the E2E contract.
- Canonical Results owns the live run-end surface. Legacy `TEST UI v5` / HUD-owned Results ownership is no longer accepted by the quality/live gates.
- Character Select, Results, Pause, Settings and the gameplay HUD are covered by the responsive frontend matrix and safe-area/rotation checks.
- The gameplay HUD consumes the same safe-area simulation contract used by the frontend matrix.
- HUD suppression during the upgrade overlay remains preserved after the safe-area integration.
- Landscape → portrait → landscape is covered for shell duplication/rotate-layer regressions.
- Shotgun remains locked/non-playable; responsive work did not create a Shotgun runtime definition.

## Responsive regression matrix

The maintained Playwright matrix includes:

- 568×320
- 667×375
- 736×414
- 768×360
- 812×375 with simulated notch/safe-area insets
- 844×390
- 896×414
- 932×430
- 960×540
- 1024×600
- 1280×720

Portrait/rotation coverage includes the 375×812 and 430×932 classes, with the Rotate layer required to remain above Pause and confirmation overlays.

## Verification evidence

On verified HEAD `fa77873d5786e6baee51ff46c671aa9e7dae7e62`:

- Quality: **success**
- E2E: **success**
- Smoke: **success**
- Live Chromium smoke: **recovered / success**
- iOS live verification: **PASSED**
- Open `ci-failure` issues at closeout: **none**

The preceding regression on `00518d64c5a8ef897b1d81f5f8124bae914c510c` was real: upgrade overlay HUD suppression was lost while sharing the safe-area contract. `fa77873d` restored the existing `openUpgradeCards` ownership behavior and listener cleanup; the current-HEAD CI recovery verifies that fix.

## Acceptance decision

The responsive remediation gate is complete. Subsequent work may proceed to Character Ownership / later roadmap stages, subject to the normal requirement that new commits keep the responsive matrix, existing Runner behavior, gameplay balance, RNG, rarity and Shotgun lock gates green.

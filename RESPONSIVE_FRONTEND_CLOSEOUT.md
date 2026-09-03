# WRECKMARCH — Responsive Frontend Remediation Closeout

**Closeout date:** 2026-09-03  
**Automated baseline HEAD:** `947bfb6dac550954cffe86128809208c34d4bb84`  
**Status:** AUTOMATED RESPONSIVE GATE VERIFIED — REAL-DEVICE iOS RE-CHECK PENDING

This note records the automated closeout state for the screenshot-driven remediation tracked by `RESPONSIVE_FRONTEND_AUDIT.md`. It does not replace the original audit evidence. Final real-device acceptance remains pending until the post-fix iPhone landscape screenshots are re-checked.

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

On the stabilization PR merged as `947bfb6dac550954cffe86128809208c34d4bb84`:

- Quality: **success**
- E2E shards + aggregate: **success**
- Smoke: **success**
- Responsive matrix: **success**, including safe-area/notch and rotation coverage
- Upgrade HUD suppression regression: **fixed and verified by E2E**
- Main-branch Live Chromium redeploy for `947bfb6`: **awaiting final bridge confirmation at documentation correction time**
- Real-device iOS re-check after `947bfb6`: **PENDING — user screenshots required**
- Open `ci-failure` issues at documentation correction time: **none**

The preceding regression on `00518d64c5a8ef897b1d81f5f8124bae914c510c` was real: upgrade overlay HUD suppression was lost while sharing the safe-area contract. `fa77873d` restored the existing `openUpgradeCards` ownership behavior and listener cleanup. `947bfb6` then cache-busted the canonical HUD assets and extended the Live readiness window without changing gameplay behavior.

## Acceptance decision

The automated responsive remediation gate is complete. **Final real-device acceptance is not complete yet.** Character Ownership may continue as a read-only audit, but no Character Ownership runtime change should land until the post-fix iPhone re-check confirms Main, Workshop/Progression and canonical Results no longer require horizontal panning or show stale ownership. New commits must keep the responsive matrix, existing Runner behavior, gameplay balance, RNG, rarity and Shotgun lock gates green.

# WRECKMARCH — Real-Device Responsive Report

**Device pass:** 2026-09-03  
**Evidence family:** `IMG_0646.jpeg` → `IMG_0653.png`  
**Observed host:** `aseel90.github.io` in a real mobile landscape browser with visible browser chrome.  
**Baseline deployed code represented by the screenshots:** post-`947bfb6` responsive stabilization.  
**Status:** PARTIAL PASS — three real-device collisions remained and are being fixed on `responsive-real-device-final`.

This report supplements `RESPONSIVE_FRONTEND_AUDIT.md`. The automated matrix is necessary but is not treated as a substitute for the real-device screenshots because the browser chrome, real safe-area geometry and Safari text/layout behavior exposed defects that did not appear in the clean Playwright viewport.

## 1. `IMG_0646.jpeg` — Main / Deployment Terminal

### What is correct

- Deployment panel fits vertically and horizontally.
- PLAY, SETTINGS, WORKSHOP and LEADERBOARD are all reachable.
- No page-level left/right pan is visible.
- Bottom status/footer stays inside the shell.
- Safe outer frame remains visible on all four sides.

### Defect

**P0 — `WRECKMARCH` wordmark is internally clipped.**

The wordmark is cut at the right side before the deployment panel. This is not the same defect as the earlier page-wide horizontal overflow: the page itself fits, while the brand column clips its child because `.wm-main-brand` is overflow-constrained and the 812-ish short-landscape grid allocates too much width to the terminal column.

### Fix contract

- The complete literal `WRECKMARCH` must be visible.
- The wordmark's scroll width must not exceed the brand content width.
- Its right bound must stay left of the deployment panel with a measurable gap.
- Fix by allocating a more appropriate short-landscape grid and responsive wordmark size, not by exposing overflow or allowing horizontal scrolling.

---

## 2. `IMG_0647.jpeg` — Workshop / top of Progression

### What is correct

- `WORKSHOP` heading is fully visible.
- Description is centered and wraps normally.
- Rank panel fits completely.
- All five stats are simultaneously visible: Runs, Best Survival, Highest Level, Lifetime Scrap and Workshop Scrip.
- The previous screenshot family's page-wide left/right displacement is not visible.
- Back control stays within the safe shell.

### Remaining observation

This capture verifies the top portion only. Workshop intentionally permits vertical scrolling; automated E2E still owns the deep-scroll requirement that `scrollLeft` stays zero. A final device deep-scroll screenshot remains useful, but there is no visible horizontal defect in this capture.

**Verdict:** real-device top-section PASS.

---

## 3. `IMG_0648.jpeg` — Settings

### What is correct

- Back control is reachable and not clipped.
- Header and explanatory text fit.
- COMBAT AUDIO and SCREEN SHAKE rows fit edge-to-edge without horizontal pan.
- Toggle controls remain inside the row and have clear touch areas.
- RESET DEFAULTS remains centered and reachable.
- No visible collision with browser safe areas.

### Minor presentation note

There is substantial unused lower space. This is acceptable for the current two-setting screen and is not a responsive defect; it gives future settings room without forcing vertical compression.

**Verdict:** real-device PASS.

---

## 4. `IMG_0649.jpeg` — Character Select

### What is correct

- Header and explanatory copy fit.
- Runner and locked Shotgun preview cards are both visible at once.
- Runner art, name and SELECT action remain readable.
- Shotgun preview, LOCKED state and weapon silhouette remain readable.
- No card crosses the safe shell.
- No page-level horizontal pan is visible.
- Production lock is visually preserved; the responsive pass does not activate Shotgun.

### Minor presentation note

The footer instruction is low-contrast/small compared with the card labels, but remains legible in the supplied image. This is a presentation polish item, not a blocking fit defect.

**Verdict:** real-device PASS.

---

## 5. `IMG_0650.jpeg` — Canonical Results

### What is correct

- The live device now shows the canonical `WRECKMARCH // RUN REPORT` surface.
- Legacy `TEST UI v5` ownership is absent.
- RUNNER DOWN reason/title fits.
- Five result cells fit on one row: Survived, Scrap, Level, Survivor, Workshop Scrip.
- `19s` correctly shows no Scrip reward (`—`) because the run is below the permanent reward threshold.
- PLAY AGAIN and MAIN MENU both fit and remain large touch targets.
- SEND REPORT and its status fit below the primary actions.
- No horizontal pan is visible.

### Minor presentation note

`TELEMETRY READY` is intentionally secondary and quite small. It remains readable here. Longer report error text must continue to wrap rather than increase Results width.

**Verdict:** canonical ownership PASS + real-device fit PASS.

---

## 6. `IMG_0651.jpeg` — Gameplay HUD

### What is correct

- Canvas remains full bleed beneath browser chrome.
- World geometry is not letterboxed.
- Main HUD rail fits the landscape width.
- WRECKMARCH/Wave, Level, Scrap and XP rail are readable.
- Touch joystick stays in the lower-left gameplay region.
- Fullscreen control stays above the home-indicator region.

### Defect

**P1 — DOM Pause trigger overlaps the HUD timer.**

The timer at the far-right side of the Phaser HUD is partly covered by the Pause button; only a fragment remains visible. The two controls are owned by different layers, so raw `W - safeRight` placement is not sufficient.

### Fix contract

- Phaser HUD must reserve a fixed logical slot for the DOM Pause trigger.
- Timer right bound must be at least 6px left of the Pause trigger's left bound at the 812×375 notch class.
- Compact widths may reduce the XP bar width instead of allowing timer/Pause or Scrap/timer collisions.

---

## 7. `IMG_0652.jpeg` — Pause

### What is correct

- RUN PAUSED panel is centered and fully visible despite browser chrome reducing usable height.
- RESUME remains the dominant action.
- SETTINGS, RESTART RUN and EXIT TO MAIN all fit.
- No vertical clipping is visible.
- No horizontal pan is visible.
- Footer/status remain inside the panel.

### Minor presentation note

The final runtime-ownership footer is intentionally low prominence and does not compete with actions. No responsive change is required from this screenshot.

**Verdict:** real-device PASS.

---

## 8. `IMG_0653.png` — Upgrade Cards

### What is correct

- Level/header area fits.
- All three upgrade cards remain simultaneously visible.
- Common/Epic treatments remain distinct.
- Card art, name, description and mechanical result rows are readable.
- The third card itself fits inside the viewport; there is no card-grid horizontal pan.

### Defect

**P0/P1 — browser-mode FULLSCREEN control overlays Fleet Feet.**

The floating FULLSCREEN control covers the lower-right card's stat/progression area. This is an ownership collision: the browser utility is not part of the Upgrade selection surface and must not sit above it.

### Fix contract

- Fullscreen remains hidden before Gameplay is actually ready.
- Fullscreen is hidden whenever the gameplay HUD is suppressed for Upgrade selection.
- Closing Upgrade restores Fullscreen in normal browser-mode gameplay.
- Standalone/PWA behavior remains unchanged.

---

## Cross-screen conclusions from the second device pass

### Confirmed fixed since the first screenshot audit

- Workshop top-level page-wide horizontal displacement.
- Legacy HUD-owned Results surface.
- Results horizontal fit.
- Settings horizontal fit.
- Character Select horizontal fit.
- Pause panel fit.
- Upgrade card grid fit.

### Remaining blocking defects found only on the real device

1. Main wordmark internal clipping.
2. Pause trigger covering the HUD timer.
3. Fullscreen utility covering Upgrade Cards.

These defects explain why automated `scrollWidth <= clientWidth` alone is not a sufficient responsive acceptance criterion. Component-to-component collision checks are now required in addition to page overflow checks.

## Acceptance extension

The final responsive gate now additionally requires:

- full Main wordmark bounds inside `.wm-main-brand` and before `.wm-main-panel`;
- gameplay timer right bound <= Pause trigger left bound minus 6px on 812×375 safe-area geometry;
- Fullscreen hidden on pre-game frontend surfaces;
- Fullscreen hidden during Upgrade selection and restored after Upgrade closes;
- existing 11-landscape + 2-portrait matrix remains green;
- Workshop vertical-only scroll behavior remains green;
- canonical Results ownership remains green;
- Runner gameplay/balance/RNG/rarity unchanged;
- Shotgun remains production locked.

## Final decision for this evidence set

**REAL-DEVICE RESPONSIVE ACCEPTANCE: NOT YET COMPLETE.**

The screenshots prove major progress and close most of the original P0 responsive failures, but the three collisions above must be corrected, pass full CI/Smoke/E2E/Live, and then be re-checked on the real device before the responsive phase is finally closed and Character Ownership runtime changes resume.

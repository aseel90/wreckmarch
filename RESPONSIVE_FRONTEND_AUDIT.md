# WRECKMARCH — Responsive Frontend Screenshot Audit

**Audit date:** 2026-09-03  
**Status:** Findings recorded. Responsive remediation is required before Character Ownership / Leaderboard frontend expansion.  
**Evidence:** User-supplied live screenshots `IMG_2059.jpeg`, `IMG_2060.png`, `IMG_2061.png`, `IMG_2062.png`, `IMG_2063.png`, `IMG_2064.jpeg`, `IMG_2065.png`, `IMG_2066.jpeg`, `IMG_2067.png`.

## 1. Capture context

- The PNG captures are 1624×750 physical pixels. This is strongly consistent with an approximately 812×375 CSS-pixel landscape viewport at 2× device scale, although the exact browser/device pixel ratio was not supplied.
- The JPEG captures are 1536×709 physical pixels and appear to come from the same/similar mobile-landscape family with browser/capture cropping.
- The user explicitly reported that some frontend surfaces extend beyond the viewport and require horizontal panning.
- The screenshots confirm real horizontal overflow on Workshop/Progression and expose a Main layout collision that the existing 844×390 no-safe-area gate does not catch.

## 2. Global root causes

### R1 — viewport-width children inside safe-area-padded shells — P0

`.wm-shell-screen` already subtracts real usable width with left/right padding that includes `env(safe-area-inset-left/right)`. Several child surfaces then size themselves again from the full viewport with `vw`:

- Character Select: `94vw`
- Settings: `88vw` / `86vw`
- Results: `90vw` / `86vw`
- Progression/Workshop: `92vw`
- Pause uses an independent padded overlay plus `88vw` panel sizing.

On a notched landscape phone, the usable content width can be much smaller than the CSS viewport. A child sized to `92vw` can therefore be wider than its parent's content box. Because `.wm-shell-screen` currently uses `overflow: auto`, this becomes a horizontally scrollable screen instead of an obvious clipped failure.

**Required direction:** shell children must size against the safe content box (`width: min(<max>, 100%)`, `max-width: 100%`, `min-width: 0`) rather than reusing viewport width inside the padded shell. Horizontal scrolling must not be used as the fallback for core screens.

### R2 — responsive breakpoints use raw viewport width instead of usable safe width — P0

Important compact rules currently activate at `760px`, `720px`, `620px`, etc. An ~812px landscape viewport does not trigger these rules even when notch/safe-area padding reduces usable width into the range those compact layouts were designed for.

**Required direction:** prefer intrinsic grid wrapping / `minmax(0, 1fr)` / `auto-fit` and content-box constraints. Where breakpoints are still necessary, short-landscape rules must cover common 812–932px phones and should be validated with simulated safe-area insets.

### R3 — Main short-landscape rule increases the title at the wrong time — P0

Base Main title uses `8.4vw`. The `max-height: 560px` landscape rule changes it to `9.2vw`. On an ~812×375 phone, this makes `WRECKMARCH` larger while the first grid column is narrow and safe-area padding is consuming horizontal room. The title then runs into/under the right deployment panel.

**Required direction:** short landscape must reduce/constrain the brand title based on available column width, not enlarge it. Main grid children must also use `min-width: 0`.

### R4 — Progression header can size from max-content — P0

`.wm-progression-header` has `max-width: 760px` but no explicit safe-content width. Under the centered grid shell, the long explanatory sentence can produce a wider-than-usable item and is visibly clipped in the live capture.

**Required direction:** `width: min(760px, 100%)`, wrapping enabled, no max-content horizontal expansion.

### R5 — fixed five-column stat layouts do not adapt to usable width — P1

Progression and canonical Results use fixed five-column grids. At phone widths with safe areas, the layout should wrap intrinsically rather than depend on a `max-width: 720px` viewport breakpoint.

**Required direction:** adaptive grid based on real available width; desktop can keep five columns, phone landscape can become 3+2 or 4+1 without horizontal overflow.

### R6 — live Results screenshot does not match the canonical Results owner on `main` — P0 investigation

`IMG_2065.png` and `IMG_2059.jpeg` show a legacy/test-style run-complete surface with `RUN COMPLETE`, `RUNNER DOWN`, `RUN AGAIN`, `SEND REPORT`, and `TEST UI v5` / transport messaging. The canonical `src/ui/results-screen.js` on `main` owns a WRECKMARCH shell Results presentation with five canonical stats, `PLAY AGAIN`, `MAIN MENU`, and Workshop Scrip presentation.

This is not only a visual issue: live routing/cache/runtime ownership must be verified before Results responsive sign-off, otherwise responsive tests may validate a different surface than the player receives.

### R7 — current responsive E2E does not simulate safe areas — P1

The existing frontend mobile flow gate at 844×390 is useful but browser test safe-area values are normally zero. It therefore cannot reproduce the notch-driven width loss visible in these captures.

**Required direction:** centralize safe-area values behind CSS custom properties that default to `env(...)`, then override them in E2E to simulate notched phones.

---

## 3. Screenshot-by-screenshot findings

### Screenshot 1 — `IMG_2060.png` — Main / Deployment Terminal

**Severity: P0 — layout collision and potential horizontal overflow.**

Observed:

- The `WRECKMARCH` wordmark is visibly cut/collided at the right side where the deployment panel begins.
- Left brand content is larger than its assigned grid column; the panel visually masks/overlaps the end of the title.
- The right panel itself is readable and its actions have usable touch dimensions.
- Bottom footer remains visible and the home indicator does not cover the primary controls.

Technical cause:

- Main uses minimum grid columns of 300px + 340px plus a large gap and safe-area-aware outer padding.
- An ~812px raw viewport misses the `max-width:760px` compact Main rule.
- On short landscape, the title is increased to `9.2vw`, making the collision worse.
- Grid items do not have a sufficiently strict `min-width:0` / contained wordmark contract.

Required fix:

- Add a real short-phone Main layout covering the 812–932px landscape family.
- Use safe-content sizing, `minmax(0, ...)`, and `min-width:0` on brand/panel grid items.
- Reduce title size under short landscape and ensure the full `WRECKMARCH` wordmark is visible without clipping or horizontal pan.
- Acceptance: Main must never need horizontal or vertical scrolling on supported landscape phones.

### Screenshot 2 — `IMG_2064.jpeg` — Character Select

**Severity: P1 — current capture is visually usable, architecture remains overflow-prone.**

Observed:

- Both Runner and locked Shotgun cards are visible at once.
- Header, Back button and footer status fit inside the capture.
- Runner artwork, Select button and Shotgun Locked state are readable.
- No obvious overlap is visible in this specific capture.

Technical risk:

- `.wm-character-grid` uses `width: min(720px, 94vw)` inside a shell that already consumes safe-area padding.
- On a notched device the actual safe content box can be smaller than `94vw`, allowing hidden horizontal overflow even if this capture happens to look centered.
- The `max-width:620px` fallback changes each card to a vertically stacked 210px-min-height card; that is risky for 568×320 short landscape.

Required fix:

- Change grid width to safe-content `100%` with a 720px cap.
- Keep two compact horizontal cards while usable width permits; do not switch to tall vertical cards solely because raw viewport width crosses 620px.
- Add a 568×320 / 667×375 gate proving both cards and controls remain reachable without horizontal pan.

### Screenshot 3 — `IMG_2066.jpeg` — Gameplay HUD

**Severity: P1/P2 — generally healthy in this capture; safe-area and bottom-control validation still required.**

Observed:

- Top HUD is contained with visible left/right margins.
- Pause control is fully visible and sufficiently separated from the right edge in this capture.
- Gameplay canvas fills the viewport without visible horizontal page movement.
- Movement hint is low on screen but remains above the home indicator.
- Virtual movement area is visible at lower left, though subtle.

Required validation/fix:

- Bind HUD/right Pause and bottom hints to the same centralized safe-area variables used by frontend screens.
- Ensure bottom instruction/joystick never enters the home-indicator safe zone on shorter phones.
- Add resize/orientation tests proving HUD remains stable after landscape → portrait → landscape.

### Screenshot 4 — `IMG_2067.png` — Pause

**Severity: P1 — good current layout, short-width risk remains.**

Observed:

- Pause panel is fully visible and centered.
- Resume has strong hierarchy and all visible controls have comfortable touch size.
- No horizontal overflow is visible in this 1624×750 capture.
- The final `EXIT TO MAIN` occupies only the left half of the two-column action grid, leaving visual dead space on the right. This is an aesthetic imbalance, not a functional blocker.

Technical risk:

- Pause overlay has safe-area padding, while its panel can still use `88vw`; on 568px-wide short phones with significant side insets, `88vw` can exceed the usable inner width.

Required fix:

- Panel width must be `min(520px, 100%)` relative to the padded overlay.
- Add short-height/short-width fallback that can wrap actions without page-level horizontal pan.
- Ensure Rotate Device overlay always layers above Pause/confirmation when orientation changes.

### Screenshot 5 — `IMG_2061.png` — Settings

**Severity: P1 — visually stable here; same safe-width architecture risk exists.**

Observed:

- Header, Back button, both setting rows, toggles and Reset Defaults fit cleanly.
- No visible text clipping.
- Touch targets look comfortably sized.
- Layout has generous unused vertical space, which is acceptable and preferable to crowding.

Technical risk:

- Header/panel widths use `88vw` / `86vw` inside the safe-area-padded shell.
- A notched or narrower short landscape device can therefore create horizontal shell overflow even though this capture looks correct.

Required fix:

- Replace inner `vw` sizing with safe-content `100%` caps.
- Preserve current visual spacing; this screen does not need aggressive compression.
- E2E must assert `scrollWidth <= clientWidth` and all rows/toggles inside bounds.

### Screenshot 6 — `IMG_2062.png` — Workshop / top

**Severity: P0 — confirmed live horizontal overflow.**

Observed:

- The explanatory sentence begins off-screen; the first character(s) of `Permanent...` are visibly clipped at the left edge.
- The Workshop Rank block begins beyond the visible left boundary rather than respecting a normal margin.
- Five stats are forced into one row while the screen is in a phone-landscape context.
- Back button remains fixed while the content underneath has a different horizontal extent.
- This is consistent with a horizontally scrollable `.wm-progression-screen`, not a harmless visual crop.

Technical cause:

- Progression screen consumes safe-area + 34px side padding.
- Child blocks use `92vw` from the full viewport instead of `100%` of the remaining safe content.
- Header lacks explicit safe-content width.
- `max-width:720px` wrapping never activates on an ~812px raw viewport even though usable width is much smaller.

Required fix:

- This is the highest-priority responsive correction.
- All Progression/Workshop blocks: `width:min(880px,100%)`, `max-width:100%`, `min-width:0`.
- Header: `width:min(760px,100%)` and normal wrapping.
- Stats: intrinsic/adaptive wrapping rather than raw-viewport breakpoint.
- After fixing child widths, Progression may retain vertical scrolling but must explicitly prohibit horizontal scrolling.

### Screenshot 7 — `IMG_2063.png` — Workshop / horizontally displaced lower section

**Severity: P0 — strongest proof of horizontal panning.**

Observed:

- The screenshot is horizontally displaced relative to the top Workshop capture.
- The left edge of the current content does not line up with the fixed Back control.
- The rightmost Workshop Scrip stat is clipped against/outside the right edge.
- The `TERMINAL PLATES` container extends past the viewport to the right.
- The user must move horizontally to inspect content that should fit in a landscape mobile screen.

Conclusion:

- Horizontal scrolling is confirmed behavior, not a theoretical CSS concern.
- Do not hide the symptom with `overflow-x:hidden` before correcting the oversized children; that would merely make content unreachable.
- Correct widths/grids first, then enforce `overflow-x:hidden` as a regression guard while keeping `overflow-y:auto` for Workshop.

### Screenshot 8 — `IMG_2065.png` — Run Complete / Results live surface

**Severity: P0 investigation + P1 responsive follow-up.**

Observed:

- The displayed result surface itself is centered and does not visibly overflow horizontally in this capture.
- `RUN AGAIN` and `SEND REPORT` are comfortably sized.
- Home indicator remains below the result panel.
- However the UI is the legacy/test presentation (`RUN COMPLETE`, `RUNNER DOWN`, `TEST UI v5`) and is not the canonical Results screen currently owned by `src/ui/results-screen.js` on `main`.
- Canonical Main Menu action, five canonical result stats and Workshop Scrip result presentation are absent from this live screenshot.

Required action:

- Investigate live runtime/cache ownership before calling Results responsive-complete.
- Once the canonical Results surface is confirmed live, test its `90vw` / five-column layout against safe-area widths; current canonical CSS has the same nested-viewport-width risk described in R1/R5.

### Screenshot 9 — `IMG_2059.jpeg` — Report transport error/retry state

**Severity: P2 for layout, tied to P0 Results ownership investigation.**

Observed:

- Retry Report button itself fits in the supplied crop.
- `ERROR TRANSPORT • remote reporting disabled` is very small and low contrast.
- Status appears designed as a single short line; a longer transport/server error could grow beyond its intended area or become unreadable on smaller phones.
- The presentation appears to belong to the same legacy/test Results surface as `IMG_2065.png`.

Required fix:

- Canonical report status should have an explicit safe max-width, wrapping behavior and readable minimum size/contrast.
- Error text must not change the width of the Results surface or create horizontal overflow.
- Keep report retry one-shot semantics separate from layout.

---

## 4. Priority repair order

1. **P0 — Safe-content sizing architecture:** replace nested `vw` widths inside safe-area-padded frontend containers with `100%`-relative caps; centralize safe-area variables.
2. **P0 — Main:** repair ~812×375 short-landscape grid/title collision and remove horizontal pan possibility.
3. **P0 — Workshop/Progression:** remove confirmed horizontal overflow; header, rank, stats, catalog, milestones and roster must share one safe content width. Vertical scroll remains allowed.
4. **P0 — Results live ownership:** determine why user receives legacy/test Results instead of canonical Results on current live flow.
5. **P1 — Character Select:** make cards intrinsic to safe content and validate 568×320 / 667×375.
6. **P1 — Canonical Results:** adaptive five-stat wrapping and safe-content actions/report area.
7. **P1 — Pause / Settings:** convert `vw` panel widths to safe-content sizing and verify short landscape.
8. **P1 — Gameplay HUD:** unify safe-area variables and test bottom/top overlays with real simulated insets.
9. **P2 — report error copy:** readable wrapped transport/error state.

## 5. Required responsive regression matrix

Landscape frontend matrix:

- 568×320
- 667×375
- 736×414
- 768×354/360 class
- 812×375 — explicitly represents the screenshot family that exposed the defect
- 844×390 — existing canonical mobile gate
- 896×414
- 932×430
- 960×540 — gameplay baseline
- 1024×600
- 1280×720 sanity

Portrait checks:

- 390×844
- 430×932

Portrait is not a playable layout. The requirement is that Rotate Device fully covers frontend/gameplay/pause/confirmation surfaces and survives returning to landscape.

## 6. Safe-area simulation contract

Introduce centralized values such as:

- `--wm-safe-top`
- `--wm-safe-right`
- `--wm-safe-bottom`
- `--wm-safe-left`

Production defaults resolve to `env(safe-area-inset-*)`. E2E can override them to simulate notched devices, for example meaningful 40–50px landscape side insets and a bottom home-indicator inset.

Do not rely on Playwright's default zero-safe-area environment to declare mobile responsiveness complete.

## 7. Acceptance gate

Responsive frontend is not complete until automated validation proves:

- `document.documentElement.scrollWidth <= innerWidth`.
- Every core shell also satisfies `scrollWidth <= clientWidth`.
- Main, Character Select, Pause, Settings and canonical Results require no horizontal scrolling and no vertical scrolling on supported landscape sizes.
- Workshop may scroll vertically but **never horizontally**.
- Essential controls remain within safe viewport bounds.
- Core touch controls remain at least 44px high/wide where applicable.
- Long labels/status/error copy wrap without expanding the page width.
- Safe-area simulated runs pass.
- Landscape → portrait → landscape does not duplicate screens, lose state, resume gameplay unexpectedly, or place Rotate below another overlay.
- Shotgun remains locked and no responsive work changes gameplay/balance/RNG/rarity.

## 8. Current audit decision

**Responsive status: NOT COMPLETE.**

The screenshots provide direct production evidence that the frontend can become horizontally scrollable on real landscape mobile geometry. Existing 844×390 E2E remains useful but is insufficient because it does not exercise safe-area insets and does not represent the ~812×375 layout that exposed the failure.

Responsive remediation and the new matrix gate should be completed before adding further frontend-heavy Character Ownership or Leaderboard work.

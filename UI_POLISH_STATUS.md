# WRECKMARCH — Mobile UI Polish Status

**Updated:** 2026-08-26

## G1 — Overlay / UI state

- ✅ End-run overlay uses the live landscape viewport instead of legacy portrait constants.
- ✅ Gameplay HUD and joystick are suppressed while upgrade/end-run overlays are active and restored after upgrade selection closes.
- ✅ Playwright coverage guards the upgrade HUD state and full-width end-run layout.

## G2 — Upgrade cards

- ✅ Final upgrade cards keep the high-resolution `c5-upgrade-sheet` source instead of being replaced by the lower-resolution C3 atlas.
- ✅ Common / Rare / Epic / Legendary cards have distinct frame, glow, accent and label treatments.
- ✅ Owned upgrades expose the next level in the footer.
- ✅ Playwright coverage verifies the HD art source and all rarity treatments.
- ✅ Smoke contract now matches the HD rarity-card runtime/self-test logs.

## G3 — Full-bleed mobile shell

- ✅ The browser shell no longer relies on `100dvh`, which could leave the page background visible as a black strip on some landscape mobile browsers.
- ✅ `body` and `#game-shell` use fixed full-viewport bounds (`inset: 0`) while gameplay controls continue to respect safe-area insets.
- ✅ Live cache versions are bumped for the updated shell, HUD and D1 card runtime.

## Deployment gate

This branch exists only to force the current UI-polish state through the normal pull-request CI gate and then through a real merge-to-main deploy event. No gameplay balance or combat behavior changes are included.

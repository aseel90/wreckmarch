# WRECKMARCH — Implementation Status

Persistent project implementation log. Update this file after every meaningful development batch.

**Last updated:** 2026-08-24

Legend: ✅ implemented · 🟡 implemented but still needs polish · ⬜ planned · ❌ superseded/removed

## Project / deployment

- ✅ GitHub repository + GitHub Pages deployment.
- ✅ Mobile portrait browser build.
- ✅ Phaser 3.90 runtime with local vendor fallback.
- ✅ `?debug=1` diagnostics.
- ✅ Debug panel is collapsible on mobile.
- ✅ Chromium smoke test gates PRs before merge/deploy.

## Phase A — Hero-owned combat core

- ✅ Run starts with the Hero only.
- ✅ Hero is the primary damage source and auto-fires at the nearest enemy.
- ✅ Enemies target the Hero only.
- ✅ Fortress HP / escort-loss fail state removed.
- ✅ Floating HP bar above Hero.
- ✅ Hit flash, damage feedback, knockback and 450 ms post-hit invulnerability.
- ✅ Scrap Rat basic enemy remains the current test enemy.

## Phase B — Large world + camera

- ✅ World expanded to roughly `2200 × 2200`.
- ✅ Old single-screen rounded arena removed.
- ✅ Smooth camera follow + movement look-ahead.
- ✅ Enemy spawning moved outside the current viewport.
- ✅ Projectile cleanup respects world coordinates.
- ✅ Touch movement tuned around a 285 base speed with analog joystick power.
- ✅ Visible starter weapon architecture added and kept swappable for future upgrade cards.

## Phase B.1 — Weapon + environment polish

- ✅ Dedicated asset files added for the starter Rivet Gun.
- ✅ Dedicated asset files added for two wrecked-vehicle variants.
- ✅ Dedicated ground-detail asset files added (`ground-a.svg`, `ground-b.svg`).
- ✅ Weak rectangle/circle wreck placeholders replaced by asset-based wrecks.
- ✅ Old random oval-heavy ground presentation replaced with cleaner asset-based surface detail plus road bands.
- ✅ Rivet Gun now pivots around a hand anchor (approximately ±28 px from Hero center) instead of orbiting the torso.
- ✅ Bullet muzzle position follows the anchored gun pose.
- ✅ Weapon remains replaceable through `primaryWeapon.texture`, so future cards can swap/evolve weapons.
- 🟡 Exact hand offset, weapon scale and world-art density still require final mobile screenshot tuning.

## Art status

- 🟡 Scrap Runner art is readable and consistent with the concept, but animation is still prototype-quality.
- 🟡 Scrap Rat art is readable but attack/hit/death animation needs a future pass.
- 🟡 Wasteland is now asset-based for major props, but final polish is not finished.
- ⬜ If SVG art is still insufficient for a specific prop, transparent PNG production assets can replace it without changing gameplay systems.

## Superseded systems

- ❌ Fortress present automatically at run start.
- ❌ Fortress HP.
- ❌ Enemies targeting Fortress.
- ❌ Fortress destruction ending the run.
- ❌ Large Fortress HP bar at top of screen.

## Next approved phase — Phase C

Not implemented yet:

- ⬜ Scrap becomes the in-run XP/progression resource.
- ⬜ Top Scrap/XP progress bar.
- ⬜ Level counter and increasing Scrap requirement.
- ⬜ Overflow Scrap handling.
- ⬜ Pause gameplay on level-up.
- ⬜ Show 3 weighted-random upgrade cards.
- ⬜ Hero upgrade family.
- ⬜ Utility upgrade family.
- ⬜ `CALL THE RIG` card to summon the optional Fortress companion.
- ⬜ Fortress cards remain locked until the Fortress is summoned.
- ⬜ Synergies/evolutions after prerequisites are owned.

## Later roadmap

- ⬜ Scrap Brute.
- ⬜ Scrap Shooter.
- ⬜ Scrap Exploder.
- ⬜ Elite variants.
- ⬜ Mini boss + first world boss.
- ⬜ Hero weapon build paths.
- ⬜ Fortress module build paths.
- ⬜ Utility builds and cross-system synergies.

See `GAMEPLAY_REDESIGN_PLAN.md` for the full approved design and architecture.

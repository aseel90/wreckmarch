# WRECKMARCH — Implementation Status

Persistent project implementation log. Update this file after every meaningful development batch.

**Last updated:** 2026-08-25

Legend: ✅ implemented · 🟡 implemented but still needs polish · ⬜ planned · ❌ superseded/removed

## Project / deployment

- ✅ GitHub repository + GitHub Pages deployment.
- ✅ Mobile landscape browser build (`960 × 540` internal reference, responsive FIT scaling).
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
- ✅ Bullet muzzle position follows the weapon pose.
- ✅ Weapon remains replaceable through the primary-weapon architecture.
- ✅ Phase C replaces the approximate hand offset with a shoulder/arm Weapon Rig that visibly connects the gun to the Hero.
- ✅ Wrecked vehicles are scaled up in Phase C so world props read larger than the Hero/enemies.

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

## Phase C — Combat correction + Scrap upgrade loop

- ✅ Weapon Rig uses a dedicated arm/hand asset connected at the Hero shoulder; the gun is mounted at the hand/grip rather than floating beside the body.
- ✅ Wrecked vehicles are enlarged to correct world scale.
- ✅ Scrap Rats are reduced in visual scale; elites remain slightly larger.
- ✅ Rat collision circle is rebuilt around torso/head and excludes the tail.
- ✅ Swept projectile collision prevents fast bullets from tunneling through enemies between frames.
- ✅ Optional `HITBOX ON/OFF` overlay is available in `?debug=1`.
- ✅ Scrap is now the in-run XP/progression resource.
- ✅ Top Scrap/XP progress bar + level counter.
- ✅ Increasing Scrap requirements and overflow handling.
- ✅ Gameplay pauses on level-up and shows 3 weighted-random cards.
- ✅ Initial Hero cards: Heavy Rivets, Overclock, Long Barrel, Twin Riveter.
- ✅ Initial Utility cards: Fleet Feet, Scrap Magnet, Armor Plate.
- ✅ `CALL THE RIG` can appear randomly from Level 2 onward.
- ✅ Fortress is an invulnerable companion, follows/catches up to the Hero and provides support fire after summon.
- ✅ Fortress-only cards remain locked until summon; initial modules include Rig Overdrive and Twin Cannon.
- 🟡 Card balance and first-level timing still require mobile playtest tuning.
- ❌ Continuous rotating single-arm Weapon Rig is superseded by the Phase C.1 8-direction two-handed pose system.
- ⬜ Synergies/evolutions remain a later Phase C+ addition after the base card loop is validated.

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

## Phase C.1 — Landscape combat UX rebuild

- ✅ Gameplay reference resolution changed from portrait `540 × 960` to landscape `960 × 540`.
- ✅ Portrait browsers show a rotate-device gate instead of squeezing the game vertically.
- ✅ HUD is rearranged for horizontal play: title/timer/wave, centered Scrap XP bar, level and Scrap counters.
- ✅ Starter Rivet Gun now uses 8 discrete two-handed aiming poses rather than continuously rotating the whole arm around the Hero.
- ✅ Runtime weapon pose switches to the nearest 45° direction; bullets still aim accurately at the target.
- ✅ Upgrade selection moved to a dedicated `UpgradeScene`, isolating its input from the gameplay joystick.
- ✅ World-scene input is disabled while cards are open, preventing touch events from leaking into movement.
- ✅ Three upgrade cards are laid out side-by-side for landscape play.
- ✅ Every current ability has a dedicated visual icon asset.
- ✅ Card colors are category-based: Hero/rust orange, Utility/cyan, Fortress/brass-gold.
- ✅ Keyboard left/right + Enter/Space and 1/2/3 selection hooks are included as a foundation for Smart TV/gamepad navigation.
- 🟡 The new two-handed pose art remains prototype SVG and should be judged on-device before final sprite/PNG production.

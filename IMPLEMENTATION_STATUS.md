# WRECKMARCH — Implementation Status

This file is the persistent implementation log for the project. Update it after every meaningful development batch so any developer or AI agent can immediately see what is real, what is experimental, and what is still only planned.

**Last updated:** 2026-08-24

## Status legend

- ✅ Implemented and present in the playable build
- 🟡 Implemented partially / prototype quality / needs replacement
- ⬜ Planned, not implemented yet
- ❌ Removed / superseded

---

## A. Project / Deployment

- ✅ GitHub repository initialized.
- ✅ Mobile portrait browser prototype exists.
- ✅ GitHub Pages deployment workflow exists.
- ✅ Debug mode available with `?debug=1`.
- ✅ Debug console can be collapsed/expanded on mobile.
- ✅ Browser smoke test exists in GitHub Actions.
- ✅ Phaser 3.90 runtime is used.
- ✅ Production-style art runtime pass added for current prototype visuals.

## B. Current Playable Prototype

- ✅ One-thumb/touch movement.
- ✅ Keyboard movement fallback for desktop testing.
- ✅ Scrap pickups exist.
- ✅ Enemy spawning exists.
- ✅ Basic projectile combat exists.
- ✅ Hit flash / particles / recoil / screen feedback exist.
- ✅ Scrap Rat basic enemy exists.
- ✅ Scrap Runner visual concept is represented in-game.
- ❌ Fortress is no longer present at run start; its art remains available for the later optional companion summon.
- ✅ Wasteland visual dressing exists in prototype form.
- 🟡 Hero animation is still prototype/vector-runtime quality, not final sprite production quality.
- 🟡 Rat animation is still prototype quality.
- 🟡 Fortress animation/visual layering is still early production quality.
- ✅ World expanded to a `2200 × 2200` roaming space with camera follow.
- ✅ Starter `Scrap Rivet Gun` is visible in the Hero's hand and projectiles spawn from its muzzle.
- ✅ Hero movement uses tuned analog speed, acceleration and deceleration instead of instant full-speed movement.

## C. Systems That Are Now Superseded

The following were implemented in the old prototype but are no longer part of the approved design and must be removed/refactored:

- ❌ Fortress present automatically at run start.
- ❌ Fortress has HP.
- ❌ Enemies can damage/kill Fortress.
- ❌ Fortress destruction ends the run.
- ❌ Large Fortress HP bar at top of screen.
- ❌ Fortress acts as an escort/protection objective.

## D. Approved Core Redesign — Not Yet Implemented

### Hero-centered combat

- ✅ Start run with Hero only.
- ✅ Hero becomes primary starting damage source with auto-fire.
- ✅ Enemies target Hero only.
- ✅ Floating Hero HP bar above player.
- ✅ Local damage numbers / stronger hit feedback.
- ✅ 450 ms hero invulnerability window after taking damage, with short knockback.

### Scrap / Level progression

- ⬜ Scrap becomes in-run XP/progression resource.
- ⬜ Top Scrap/XP progress bar.
- ⬜ Level counter.
- ⬜ Increasing Scrap requirement per level.
- ⬜ Overflow Scrap handling.

### Upgrade cards

- ⬜ Pause gameplay on level-up.
- ⬜ Show 3 upgrade cards.
- ⬜ Weighted random upgrade pool.
- ⬜ Hero upgrade family.
- ⬜ Utility upgrade family.
- ⬜ Fortress upgrade family locked until Fortress summon.
- ⬜ Synergy/Evolution prerequisite system.
- ⬜ Rarity system later.
- ⬜ Reroll/Skip later.

### Fortress companion redesign

- ⬜ `CALL THE RIG` random upgrade card.
- ⬜ Fortress hidden at run start.
- ⬜ Fortress summon/arrival effect.
- ⬜ Fortress cannot take normal damage.
- ⬜ Enemies do not target Fortress.
- ⬜ Fortress follows Hero as a companion.
- ⬜ Catch-up acceleration if too far behind.
- ⬜ Fortress support attack logic.
- ⬜ Fortress-specific cards appear only after summon.
- ⬜ Fortress visually evolves with chosen modules.

### Large world

- ✅ Replace single-screen arena with `2200 × 2200` world coordinates.
- ✅ Remove visible rounded arena boundary.
- ✅ Smooth camera follow.
- ✅ Camera look-ahead.
- ✅ Spawn enemies outside viewport.
- ✅ Larger Wasteland dressing with roads, terrain patches, cracks, metal debris and wreck landmarks.
- ✅ World-safe projectile cleanup.
- 🟡 Pickup/enemy long-distance recycling is safe enough for current prototype scale; chunk recycling remains later optimization.
- ⬜ Chunk/recycling system later if needed.

## E. Enemy Roadmap

- ✅ Scrap Rat prototype.
- ⬜ Scrap Brute.
- ⬜ Scrap Shooter.
- ⬜ Scrap Exploder.
- ⬜ Elite variants.
- ⬜ Mini boss.
- ⬜ First world boss.

## F. Build / Evolution Roadmap

- ⬜ Hero weapon build paths.
- ⬜ Fortress module build paths.
- ⬜ Utility build paths.
- ⬜ Fire + Oil synergy.
- ⬜ Tesla + Wet/Water synergy.
- ⬜ Drone + Rocket synergy.
- ⬜ Freeze + Saw synergy.

## G. Current Priority

**PHASE A and PHASE B are implemented. Do not add more enemy families yet.**

The next development batch is **PHASE C — Scrap Level Bar + Cards**:

1. Convert collected Scrap into level XP.
2. Add a top Scrap/XP progress bar and level counter.
3. Increase Scrap requirement per level and preserve overflow.
4. Pause combat on level-up.
5. Present 3 weighted random upgrade cards.
6. Start with Hero and Utility upgrade families.
7. Keep Fortress cards locked until `CALL THE RIG` is introduced in the following companion phase.

Phase B also established a visible, swappable starter weapon interface so future cards can replace/evolve the `Scrap Rivet Gun` without rewriting combat.

See `GAMEPLAY_REDESIGN_PLAN.md` for the complete approved design.

---

## H. Important Existing Milestones

- `aeffdf7...` — Visual slice v1: Scrap Runner, Scrap Rat and Fortress.
- `07541ff...` — Real browser smoke test before Pages deploy.
- `96c1c07...` — Production art pass: Runner, Rat, Fortress and wasteland.

These are historical milestones, not necessarily the final architecture.


## I. Phase A Implementation Notes

- Hero now spawns alone; the Fortress is not constructed at run start.
- Fortress HP, Fortress collision damage, and Fortress-loss fail state are removed from active gameplay.
- Starting shots originate from the Scrap Runner and target the nearest enemy.
- Scrap Rats path directly to the Hero.
- Hero HP is rendered above the character and follows movement.
- Hits show floating damage, red feedback, screen shake, short knockback, and a 450 ms invulnerability window.
- Old Fortress upgrade selection is disabled until the new Phase B card system is built.

---

## J. Roadmap Correction After Mobile Review

- The large-world/camera work was originally listed after the Scrap/card system.
- Mobile testing showed the small rounded arena is a more immediate gameplay problem, so the order is now corrected.
- Current Phase B is Large World + Camera.
- Scrap/Level/Card progression moves to Phase C.
- This is a priority reorder only; no approved feature has been removed.


## K. Phase B Implementation Notes

- World size is now `2200 × 2200`; the old rounded single-screen arena is gone.
- Camera smoothly follows the Hero with directional look-ahead.
- Enemy spawns are generated outside the active camera view and enter from the surrounding world.
- Wasteland ground now contains broken road bands, terrain variation, cracks, metal fragments, landmark wrecks, barrels and scrap piles.
- Hero base speed is tuned to `285` world units/second at full input.
- Touch movement now supports analog intensity instead of jumping instantly to full speed.
- Acceleration/deceleration smoothing is applied to reduce both sluggishness and twitchiness.
- `Scrap Rivet Gun` is visible, aims independently, recoils, and bullets originate from its muzzle.
- Primary weapon state is isolated behind `equipPrimaryWeapon(...)` so future upgrade cards can change weapon stats/appearance.

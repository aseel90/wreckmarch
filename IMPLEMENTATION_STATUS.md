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
- 🟡 World is currently too small and still feels like a single-screen arena.

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

- ⬜ Replace single-screen arena with large world coordinates.
- ⬜ Remove visible rounded arena boundary.
- ⬜ Smooth camera follow.
- ⬜ Camera look-ahead.
- ⬜ Spawn enemies outside viewport.
- ⬜ Larger Wasteland dressing.
- ⬜ World-safe pickups / projectile cleanup.
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

**PHASE A is implemented. Do not add more enemies yet.**

After the latest mobile review, the roadmap has been reordered so the restrictive arena is fixed before the level-card system.

The next development batch is **PHASE B — Large World + Camera**:

1. Expand the play world to roughly `2200 × 2200` for the first test.
2. Remove the visible rounded arena boundary.
3. Add smooth camera follow and light movement-direction look-ahead.
4. Spawn enemies outside the current viewport instead of at the visible arena edge.
5. Spread Wasteland dressing across world coordinates.
6. Make bullets, pickups, and enemies clean up safely when far from the active camera/player.
7. Keep the Hero-only combat rules from Phase A unchanged.

After Phase B is stable, **PHASE C — Scrap Level Bar + Cards** will add the top XP bar, levels, overflow Scrap, 3-card choices, and weighted Hero/Utility upgrades.

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

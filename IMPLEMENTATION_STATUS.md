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
- ✅ Fortress visual concept is represented in-game.
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

- ⬜ Start run with Hero only.
- ⬜ Hero becomes primary starting damage source.
- ⬜ Enemies target Hero instead of Fortress.
- ⬜ Floating Hero HP bar above player.
- ⬜ Local damage numbers / stronger hit feedback.
- ⬜ Short hero invulnerability window after taking damage.

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

**Do not add more enemies yet.**

The next development batch must focus on:

1. Hero-only run start.
2. Remove Fortress HP/fail state.
3. Hero auto-attack and hero-targeting enemies.
4. Hero HP bar above player.
5. Scrap XP bar and level-up system.
6. Three-card upgrade selector.
7. Large world + smooth camera.
8. Only then add optional `CALL THE RIG` companion summon.

See `GAMEPLAY_REDESIGN_PLAN.md` for the complete approved design.

---

## H. Important Existing Milestones

- `aeffdf7...` — Visual slice v1: Scrap Runner, Scrap Rat and Fortress.
- `07541ff...` — Real browser smoke test before Pages deploy.
- `96c1c07...` — Production art pass: Runner, Rat, Fortress and wasteland.

These are historical milestones, not necessarily the final architecture.

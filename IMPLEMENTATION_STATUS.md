# WRECKMARCH — Implementation Status

Persistent project implementation log. Update this file after every meaningful development batch.

**Last updated:** 2026-09-04

Legend: ✅ implemented · 🟡 implemented but still needs polish · ⬜ planned · ❌ superseded/removed

## Current project state / active priority

- ✅ Upgrade System 2.0 is closed on `main` through PR #326 / `298ea21f1c89ea553fe05feb1b733c01f8a7efbf`; the final natural Production run lasted 794.244s and passed the >600s gameplay gate.
- ✅ Combat & Build Balance WS1–WS23 is a closed regression baseline. Do not restart scalar tuning from a single noisy run.
- ✅ Responsive frontend remediation is closed; reopen only for a reproducible screen/layout regression.
- ✅ Quality, Smoke, sharded Chromium E2E, aggregate E2E and post-merge Live Chromium are the required deployment gates.
- 🟡 **Active next production track: WS14-C — Shotgun Character identity + production art.** WS14-D selection/definition and WS14-E activation remain blocked behind WS14-C.
- ⬜ `FUTURE_RUN_WORLD_ENCOUNTER_ROADMAP.md` remains R0-gated until Character Ownership / character-production closes; repair/stability and Upgrade System 2.0 gates are already satisfied.

Canonical documentation map: `DOCUMENTATION_INDEX.md`.

## Project / deployment

- ✅ GitHub repository + GitHub Pages deployment.
- ✅ Mobile landscape browser build (`960 × 540` internal reference, responsive FIT scaling).
- ✅ Phaser 3.90 runtime with local vendor fallback.
- ✅ `?debug=1` diagnostics.
- ✅ Debug panel is collapsible on mobile.
- ✅ Chromium smoke test gates PRs before merge/deploy.
- ✅ GitHub Actions runs quality, Playwright E2E and production smoke checks in parallel before deployment.
- ✅ Main-branch CI failures are bridged into an open `[CI] main is failing` Issue with the `ci-failure` label, failed-job results, commit and workflow-run links; the Issue auto-closes after a fully successful `main` run.

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
- ✅ Transparent generated PNG production art is now used for the Phase C.3 weapon, Fortress, upgrade cards and wreck props.

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
- ❌ Continuous rotating single-arm Weapon Rig is superseded by the Phase C.1/C.3 directional two-handed pose system.
- ⬜ Synergies/evolutions remain a later Phase C+ addition after the base card loop is validated.

## Phase F0 — Production foundation / ownership cleanup

- ✅ Data-driven playable-character boundary is live; Runner remains the only current character while future character definitions can supply their own stats/combat tuning.
- ✅ Enemy definitions, registry, factory and spawn ownership are separated from the legacy scene.
- ✅ Enemy movement is dispatched through `EnemyBehaviorSystem` with `chase` as the first behavior.
- ✅ Enemy projectile damage, knockback, hit feedback, death and Scrap-drop rules are owned by `EnemyCombatSystem`.
- ✅ Hero contact damage, knockback, hit feedback and invulnerability are owned by `PlayerDamageSystem`; Runner tuning lives in `CharacterDefinition`.
- ✅ `CombatSystem` is the authoritative live combat boundary and directly owns bullet/enemy and hero/enemy Arcade overlaps.
- ✅ `game.js` no longer creates combat overlaps or contains legacy `onBulletHit`, `killEnemy`, or `enemyTouchesHero` implementations.
- ✅ Phase C swept-projectile collision dispatches directly to `CombatSystem`; the final `onBulletHit` compatibility shim has been removed.
- ✅ Unit + Playwright coverage guards single overlap ownership, direct swept-hit dispatch, projectile damage/death/drop parity, contact damage and Runner i-frames.
- ✅ Combat damage/death/contact/overlap ownership is fully separated from the legacy scene/runtime callbacks.
- ✅ `WeaponSystem` now owns Hero/Rig target acquisition and firing, while `ProjectileSystem` exclusively owns projectile construction, swept-hit checks, bounds cleanup and lifetime.
- ✅ Historical B/B1/C/C1/C2/C3/C4/C5/D1 layers no longer define `autoFire`, `findNearestEnemy`, `getWeaponMuzzle`, `fireHeroBullet`, `updateBullets`, or call `bullets.create(...)`; they only configure weapon profiles, sockets and visual/audio feedback.
- ✅ `game.js` updates the authoritative `ProjectileSystem` then `WeaponSystem`; ownership is installed with Enemy Foundation before the historical visual/gameplay phases run.
- ✅ Unit + Playwright coverage guards target acquisition, support volleys, exclusive projectile construction and absence of legacy weapon/projectile scene callbacks.

## Later roadmap — ordered future run/world expansion

This expansion is **approved for later implementation only**. Repair/stability and Upgrade System 2.0 are now closed; do not activate the expansion until the remaining Character Ownership / character-production gate (WS14-C → WS14-D → WS14-E) is closed and CI/Live remains green.

Canonical ordered roadmap: `FUTURE_RUN_WORLD_ENCOUNTER_ROADMAP.md`.

High-level dependency order:

- ⬜ Future-run data/telemetry contract while retaining the current 10-wave curve as the regression baseline.
- ⬜ Large-world streaming/activation foundation; compare `7200 / 9600 / 12000`, with `~9600 × 9600` the current preferred target.
- ⬜ Districts, landmarks and Boss-capable clearings.
- ⬜ Encounter Director v2 + five-Act pacing + event/threat budgets.
- ⬜ Boss Encounter Controller: warning → enemy retreat → temporary arena lock → Boss fight → reward → arena release.
- ⬜ Special-encounter reward framework.
- ⬜ Early roster expansion: E04 Wreckling + E05 Fuse Tick + first random Events.
- ⬜ Champion framework + M01 Wreck Hound Alpha (~5:00).
- ⬜ E10 Magnet Warden + M02 Boilerback (~10:00).
- ⬜ Mid-game roles: E06 Scrap Drone + E07 Pipe Crawler + E12 Signal Herald.
- ⬜ B02 The Roadbreaker Major Boss / first full locked Boss Arena (~15:00).
- ⬜ Late-game roles: E08 Hook Raider + E09 Rivet Brute + E11 Ash Stalker + E13 Arc Warden.
- ⬜ M03 Chain Hauler (~20:00) + late Event layer.
- ⬜ Final Surge + B01 The Scrap Marshal Final Boss (~25:00); Boss death = standard-run Win.
- ⬜ Survival Cards / Synergies / Evolutions integration for longer-run build depth.
- ⬜ Full 25-minute production balance/performance closeout.
- ⬜ Workshop Scrip recalibration only after final run duration is proven.
- ⬜ Standard Win polish; Endless / `KEEP DRIVING` remains a far-later post-win mode.

The current `2200 × 2200` world and 10-wave curve remain valid production/test baselines until this future roadmap is activated; they are not the final intended game length/world size.

See `GAMEPLAY_REDESIGN_PLAN.md` for the earlier approved redesign foundation and `WRECKMARCH_ENEMY_ROSTER.md` for accepted enemy identities.

## Phase C.1 — Landscape combat UX rebuild

- ✅ Gameplay reference resolution changed from portrait `540 × 960` to landscape `960 × 540`.
- ✅ Portrait browsers show a rotate-device gate instead of squeezing the game vertically.
- ✅ HUD is rearranged for horizontal play: title/timer/wave, centered Scrap XP bar, level and Scrap counters.
- ✅ Starter Rivet Gun uses 8 discrete two-handed aiming poses rather than continuously rotating the whole arm around the Hero.
- ✅ Runtime weapon pose switches to the nearest 45° direction; bullets still aim accurately at the target.
- ✅ Upgrade selection moved to a dedicated `UpgradeScene`, isolating its input from the gameplay joystick.
- ✅ World-scene input is disabled while cards are open, preventing touch events from leaking into movement.
- ✅ Three upgrade cards are laid out side-by-side for landscape play.
- ✅ Every current ability has a dedicated visual icon asset.
- ✅ Card colors are category-based: Hero/rust orange, Utility/cyan, Fortress/brass-gold.
- ✅ Keyboard left/right + Enter/Space and 1/2/3 selection hooks are included as a foundation for Smart TV/gamepad navigation.
- ❌ Prototype SVG two-hand weapon art is superseded by the exclusive PNG perspective art in Phase C.3.

---

## L. Phase C.2 — Responsive Visual Foundation

- ✅ Browser viewport is adaptive instead of forcing a boxed 16:9 canvas.
- ✅ Camera zoom is pulled back slightly for more battlefield visibility.
- ✅ HUD reflows to live landscape width and uses less vertical space.
- ✅ Muzzle offsets are pose-specific so projectiles originate from the illustrated barrel.
- ✅ Upgrade card sizing adapts to the live landscape viewport.
- ✅ Browser smoke test gates the responsive visual foundation.

## Phase C.3 — Exclusive PNG art + movement/combat polish

- ✅ Exclusive transparent PNG art replaces the previous temporary weapon/Fortress/card/wreck presentation.
- ✅ Weapon aim remains accurate while the rendered weapon switches among fixed directional poses.
- ✅ Fortress follow motion is velocity-based instead of directly teleporting toward the Hero.
- ✅ Fortress wheels rotate from actual travel distance.
- ✅ Enemy crowd separation reduces visual stacking while preserving Hero pursuit.
- ✅ Browser self-tests cover atlas availability, weapon readability, Fortress parts, cards, wrecks, crowd separation, Fortress motion and wheel rotation.

## Phase C.3.1 — Real atlas frame registration

- ✅ Atlas crop/display bug fixed by registering real Phaser texture frames against decoded PNG source images.
- ✅ Production art keeps native/full-size frame dimensions instead of the broken 1×1 placeholder atlas metadata.
- ✅ Browser self-tests cover full-size weapon/Fortress/card rendering.

## Phase C.4 — Permanent weapon sockets + spring Rig + PNG terrain

- ✅ Weapon sockets are pose-specific and stay attached to the Hero body without rendering a third hand.
- ✅ Fortress follow motion uses velocity, acceleration, arrival slowdown and limited catch-up speed instead of direct positional lerp.
- ✅ Fortress wheels remain synchronized with actual movement.
- ✅ Terrain roads use PNG surface assets and preserve a clear draw order below gameplay actors.
- ✅ Browser self-tests cover weapon sockets, third-hand absence, ground/road rendering, Rig spring motion and wheels.

## Phase C.5 — Aim-facing body + HD cards + visible road network

- ✅ Hero body orientation follows current aim direction without changing gameplay movement direction.
- ✅ Upgrade card art is rendered from 2× vector sources for sharper landscape presentation.
- ✅ Road network coverage is expanded so asphalt is visible during normal play instead of only at isolated positions.
- ✅ Browser self-tests cover body aim, third-hand absence, HD card art and road/ground visibility.

## Phase D.1 — Runner + mechanical arm + premium cards + real vehicle scale

- ✅ Runner gains animated leg motion instead of a static body.
- ✅ Mechanical weapon arm is integrated with the body and replaces separate floating hand sprites.
- ✅ Upgrade cards use premium PNG illustrations.
- ✅ Road/asphalt presentation is reinforced for visibility across the large world.
- ✅ Wrecked vehicles use a more believable scale relative to the Runner.
- ✅ Browser self-tests cover animated legs, mechanical arm integration, card quality, road visibility and vehicle scale.

## Phase E.0 — Fast terrain bootstrap

- ✅ Fast terrain is installed before the heavier historical visual stack.
- ✅ Terrain reports readiness in debug diagnostics and exposes a DOM readiness flag.

## Phase E.1 — Persistent asphalt ownership cleanup

- ✅ Final asphalt renderer owns the visible road layer after all historical terrain passes.
- ✅ Legacy road cover/repaint paths are removed from the final visible layer.
- ✅ Road ordering is deterministic: ground below asphalt, gameplay actors above it.
- ✅ Browser self-tests verify road segments, spawn-area asphalt, no legacy cover, draw ordering and 12-second persistence.

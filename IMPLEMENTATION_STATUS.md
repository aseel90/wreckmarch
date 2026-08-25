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

---

## M. Phase C.3 — Exclusive Art + Motion / Combat Polish

- ✅ Exclusive generated PNG art sheet was cropped into dedicated production pieces for 8 Rivet Gun directions, Rig chassis/turret/wheels/dust, upgrade illustrations, and wreck props.
- ✅ Cropped pieces are packed into an optimized transparent atlas and cropped at runtime, keeping the generated art intact while remaining GitHub-connector friendly.
- ✅ Rivet Gun uses exclusive 8-direction perspective art and two visible hands/arms instead of the thin prototype SVG weapon.
- ✅ Muzzle position remains tied to the active aim pose and supports multi-shot spread.
- ✅ Fortress visual is rebuilt from separate chassis, turret, wheel and shadow layers.
- ✅ Fortress follow motion uses velocity, acceleration, arrival slowdown and limited catch-up speed instead of direct positional lerp.
- ✅ Fortress wheels rotate from actual travel speed; chassis has subtle speed-dependent suspension movement.
- ✅ Fortress turret turns with angular lag and only fires after it aligns with the target.
- ✅ Speed-dependent dust trails make vehicle movement readable.
- ✅ Enemy population cap plus local separation/swarm bias reduces unreadable stacking.
- ✅ Wreck props use exclusive damaged-vehicle art at more believable world scale.
- ✅ UpgradeScene V3 uses large exclusive illustrated art for current Hero / Utility / Fortress cards.
- ✅ Camera is pulled back slightly and the top HUD is thinner.
- ✅ Browser gate decodes the atlas and tests directional weapon dimensions, Rig parts, card/wreck art, crowd-control installation, Rig travel and real wheel rotation before merge.

Validation target: PR Chromium smoke test must pass all Phase C.3 checks before merge.

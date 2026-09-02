# WS15 — Enemy Role / Range Matchup Safety

Status: **RUNNER BASELINE IN IMPLEMENTATION / SHORT-RANGE CHARACTER VALIDATION DEFERRED**

## Scope decision

WS15 is split so the deferred Shotgun character does not block the current balance program.

- **WS15-A — Runner baseline (now):** verify Scrap Rat, Rust Hound and Sawbug preserve distinct pressure roles against the current Runner and freeze deterministic regression gates.
- **WS15-B — future short-range matchup:** repeat the range/pressure review after the Shotgun character is actually activated in WS14-E. This is intentionally deferred and does not block WS16.

No new enemy, no HP inflation and no speculative rebalance is approved by opening WS15.

## Architecture finding

The audit found duplicated Rust Hound tuning:

- `src/enemies/definitions/rust-hound.js` contained one behavior profile.
- `RUN_BALANCE.enemyRoles['rust-hound']` contained a second live Run profile and `RunDirector` also owned the chase-speed multiplier.

That violates the one-source-of-truth rule and is risky for future Android packaging because gameplay meaning depended on a runtime overlay.

### Migration rule

Preserve the already production-validated live Run behavior, but move its numeric ownership and application into the canonical enemy domain.

- Rust Hound canonical definition owns chase multiplier, slide range, hold range, cooldown, telegraph, recovery and steering values.
- `hound-pounce.js` applies the canonical chase multiplier; Run Director no longer multiplies enemy movement speed.
- Sawbug canonical definition remains the sole owner of ranged/acid behavior numbers.
- Run Balance references the canonical Hound/Sawbug behavior objects; it owns wave timing, spawn weights and run threat budgeting only.
- Run Director may assign run role/threat and point at the canonical behavior profile, but it carries no second movement/combat numeric copy.

This is an ownership migration, **not an intended buff or nerf**.

## Runner role baseline

### Scrap Rat — swarm chaser

- Threat value: 1.
- Normal base speed: 88–122.
- Even at Wave 10 speed scaling (1.09x), a normal Rat maxes at about 133, well below Runner base move speed 255.
- Rat remains the roster backbone by spawn weight (52% at Wave 10 before pressure-phase modifiers).
- Acceptance intent: a single Rat is avoidable; groups create space pressure and punish poor pathing.

### Rust Hound — readable hunter

Canonical live Run profile:

- Chase multiplier: 0.72x, now applied by the Hound behavior itself.
- Slide lane: 100–270.
- Hold range: 130.
- Telegraph: 300 ms.
- Slide: 360 speed for 480 ms (about 173 px committed travel).
- Cooldown: 1450–1850 ms after recovery.
- Recovery: 360 ms.

Runner base move speed is 255 and Fleet Feet remains capped below 280. The Hound therefore cannot win by ordinary chase speed, but its 360 committed slide exceeds player movement speed. The telegraph + committed slide window remains readable enough to reward movement rather than unavoidable contact.

### Sawbug — ranged anti-camp pressure

- Preferred range: 250–380.
- Retreat threshold: 205.
- Stationary fire reach: 430.
- Telegraph: 320 ms.
- Acid projectile: 275 speed, 2200 ms lifetime, 11 damage.
- Stationary cooldown multiplier: 0.78x.

Projectile lifetime allows roughly 605 px of travel, safely beyond the maximum fire envelope. Stationary targets receive the faster firing cycle; moving targets retain reaction time. This preserves the intended job: force repositioning rather than act as another contact chaser.

## Existing production evidence

RUN-0026 already showed all three enemies surviving long enough to express their roles under a high-power Runner build:

- Peak active enemies: 31.
- Median sampled TTK: approximately 6.48 s Scrap Rat / 5.27 s Rust Hound / 8.81 s Sawbug.
- The run reached Wave 10 without a standing-still screen-delete failure signal.

This evidence does not replace WS15 regression tests, but it is enough to reject an unsupported numeric rebalance at the start of the workstream.

## Deterministic gates

- [ ] Run Balance contains no copied Hound/Sawbug combat tuning literals; it references canonical definitions.
- [ ] Hound chase-speed scaling is applied by `hound-pounce`, not Run Director.
- [ ] Rat remains slower than Runner even under Wave 10 speed scaling and remains the roster backbone by weight.
- [ ] Hound normal chase remains slower than Runner while committed slide remains faster than max Fleet Feet movement.
- [ ] Hound telegraph/slide response budget remains readable.
- [ ] Sawbug retreat/preferred/stationary ranges remain ordered correctly.
- [ ] Sawbug projectile lifetime can cover its full firing envelope.
- [ ] Sawbug stationary pressure remains stricter than moving-target pressure.
- [ ] Existing Rust Hound/Sawbug behavior tests stay green.
- [ ] Quality + Smoke + Chromium E2E pass on the exact WS15-A head SHA.
- [ ] Production deploy / live smoke pass on the merged SHA.

## Stop rule

Do not change enemy HP, damage, spawn weights, wave pressure or attack coefficients from this baseline unless deterministic evidence or production telemetry shows a repeatable role failure. WS16 owns wave/difficulty scaling; do not smuggle WS16 changes into WS15.

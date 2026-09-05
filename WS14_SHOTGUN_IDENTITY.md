# Workstream 14 — Shotgun Character Combat Identity

> **Canonical naming contract:** the player-facing character name is **Wrecker**. The internal character ID and weapon/archetype identifiers remain `shotgun`; do not rename those technical IDs as part of presentation naming.

Status: ✅ WS14-A/B COMPLETE / WRECKER ACTIVATION STILL GATED

This workstream defines the Wrecker combat archetype without turning it into Runner-with-more-projectiles. The Shotgun weapon A1 numeric package is frozen and merged. The Wrecker character definition is also implemented at the approved current baseline; activation remains gated only by real Production full-run approval.

## Current implementation status — 2026-09-05

- WS14-A intrinsic volley architecture: **complete**.
- WS14-B Shotgun A1 weapon foundation: **complete and Production-deployed**.
- Approved weapon package remains: `5 pellets / ±0.24 rad / 720 ms / range 330 / 1.75x total volley`.
- Wrecker character definition is implemented at `110 HP / 255 move speed / passive disabled`.
- Dedicated Wrecker production art is implemented as baked idle/run body textures plus an independent `shotgun.svg` weapon layer and front-hand overlay.
- Wrecker runtime composition, aim alignment and C5/D1 production presenters are implemented behind the locked production gate.
- Character Select may preview Wrecker, but canonical access remains locked.
- Remaining activation blocker is owned by `src/characters/shotgun-production-gate.js`: **real Production full-run approval**.

## Approved identity direction

- Runner remains the safer ranged/sustained-fire archetype.
- Wrecker spends more of its power budget on **short-range burst and frontal crowd coverage**.
- It pays for that value with **lower effective range and higher positioning risk**.
- Character and weapon identities remain separate: the Wrecker character definition selects the registered Shotgun signature weapon; the Weapon Registry owns the weapon's base definition.

## Volley contract

- Shotgun multishot is **intrinsic to the weapon definition**, not a hidden Twin/Triple upgrade.
- A trigger owns one bounded **total volley damage budget**.
- Pellets divide that volley budget; adding pellets never means `pelletCount × full base damage`.
- Spread is symmetric around the aim direction and owned by the weapon fire profile.
- Pellet count, spread angle, cadence, range and total volley multiplier are **frozen by the approved WS14-B A1 package**; changes require a new balance decision rather than silent retuning.
- Crit remains independent per projectile unless later telemetry proves the variance is unhealthy; this preserves the existing projectile-level critical-hit contract.

## Upgrade compatibility contract

- Twin Riveter, Triple Riveter and Explosive Rivet remain Rivet-Gun-only and must not enter Wrecker/Shotgun rolls.
- General cards remain eligible when technically compatible; the offer system must not become a synergy/recommendation engine.
- Pierce, Ricochet and Shrapnel damage remain derived from each pellet's already-budgeted primary damage, so direct + secondary damage cannot recover full damage per pellet.
- Projectile/effect volume from pellet × secondary-mechanic combinations must be measured against PB1/mobile ceilings before WS14 is marked DONE; later WS21 can tighten global performance policy if required.

## Architecture slice — WS14-A

**Implementation status:** ✅ COMPLETE in PR #198 / main `a5aab030f0b86ed17aed22fa62fbfa5252a3a519`. The canonical intrinsic volley architecture is merged with Runner preserved at one projectile, zero spread and `1.0x` intrinsic volley. The later WS14-B A1 decision froze the Shotgun weapon values, and WS14-E subsequently added the Wrecker character definition while preserving the production activation lock.

Completed architecture contract:

1. Add a canonical weapon `fireProfile` containing intrinsic projectile count, half-spread radians and total volley damage multiplier.
2. Make WeaponSystem resolve the intrinsic weapon volley when no Rivet multishot mechanical upgrade owns the trigger.
3. Keep Twin/Triple as Rivet-specific overrides, preserving their current live spread and damage budgets.
4. Freeze Rivet Gun as a one-projectile `1.0x` intrinsic volley so Runner behavior does not change.
5. Add deterministic tests with a test-only spread weapon; do not ship Shotgun content in this architecture slice.

## Historical gate to numeric Shotgun implementation — PASSED by WS14-B

WS14-A passed the required Quality, Smoke and Chromium gates on PR #198 with no Runner regression. This gate was subsequently satisfied by the explicit WS14-B A1 approval for pellet count, spread angle, cadence, effective range and total volley multiplier. Those weapon values are now implemented.

The current stop rule is narrower: Wrecker remains locked until deterministic gates stay green and a real Production gameplay/D1 full run is approved. Only after that evidence may the production lock be removed.

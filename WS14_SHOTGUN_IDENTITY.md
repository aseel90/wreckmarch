# Workstream 14 — Shotgun Character Combat Identity

> **Canonical naming contract:** the player-facing character name is **Wrecker**. The internal character ID and weapon/archetype identifiers remain `shotgun`; do not rename those technical IDs as part of presentation naming.

Status: ✅ WS14-A/B COMPLETE / CHARACTER ACTIVATION STILL GATED

This workstream defines the next playable combat archetype without turning it into Runner-with-more-projectiles. The Shotgun weapon A1 numeric package is now frozen and merged. Character-level gameplay values such as HP, movement speed and any passive remain intentionally unapproved until the character production-definition gate is decided; they must not be copied from Runner or guessed.


## Current implementation status — 2026-09-03

- WS14-A intrinsic volley architecture: **complete**.
- WS14-B Shotgun A1 weapon foundation: **complete and Production-deployed**.
- Approved weapon package remains: `5 pellets / ±0.24 rad / 720 ms / range 330 / 1.75x total volley`.
- Dedicated Shotgun production art exists as **2 idle + 3 run frames** with an independent `shotgun.svg` weapon layer.
- Shotgun runtime composition, aim alignment and C5/D1 production presenters are implemented behind the locked production gate.
- Character Select may preview Shotgun, but canonical access remains locked.
- Remaining activation blockers are owned by `src/characters/shotgun-production-gate.js`: **character gameplay definition** and **real Production full-run approval**.
- No character HP, movement speed or passive value is approved by this document.

## Approved identity direction

- Runner remains the safer ranged/sustained-fire archetype.
- The Shotgun archetype spends more of its power budget on **short-range burst and frontal crowd coverage**.
- It pays for that value with **lower effective range and higher positioning risk**.
- Character and weapon identities remain separate: the character definition selects a registered signature weapon; the Weapon Registry owns the weapon's base definition.

## Volley contract

- Shotgun multishot is **intrinsic to the weapon definition**, not a hidden Twin/Triple upgrade.
- A trigger owns one bounded **total volley damage budget**.
- Pellets divide that volley budget; adding pellets never means `pelletCount × full base damage`.
- Spread is symmetric around the aim direction and owned by the weapon fire profile.
- Pellet count, spread angle, cadence, range and total volley multiplier are **frozen by the approved WS14-B A1 package**; changes require a new balance decision rather than silent retuning.
- Crit remains independent per projectile unless later telemetry proves the variance is unhealthy; this preserves the existing projectile-level critical-hit contract.

## Upgrade compatibility contract

- Twin Riveter, Triple Riveter and Explosive Rivet remain Rivet-Gun-only and must not enter Shotgun rolls.
- General cards remain eligible when technically compatible; the offer system must not become a synergy/recommendation engine.
- Pierce, Ricochet and Shrapnel damage remain derived from each pellet's already-budgeted primary damage, so direct + secondary damage cannot recover full damage per pellet.
- Projectile/effect volume from pellet × secondary-mechanic combinations must be measured against PB1/mobile ceilings before WS14 is marked DONE; later WS21 can tighten global performance policy if required.

## Architecture slice — WS14-A

**Implementation status:** ✅ COMPLETE in PR #198 / main `a5aab030f0b86ed17aed22fa62fbfa5252a3a519`. The canonical intrinsic volley architecture is merged with Runner preserved at one projectile, zero spread and `1.0x` intrinsic volley. The later WS14-B A1 decision froze the Shotgun weapon values; character-level HP/speed/passive values remain a separate activation decision.

Completed architecture contract:

1. Add a canonical weapon `fireProfile` containing intrinsic projectile count, half-spread radians and total volley damage multiplier.
2. Make WeaponSystem resolve the intrinsic weapon volley when no Rivet multishot mechanical upgrade owns the trigger.
3. Keep Twin/Triple as Rivet-specific overrides, preserving their current live spread and damage budgets.
4. Freeze Rivet Gun as a one-projectile `1.0x` intrinsic volley so Runner behavior does not change.
5. Add deterministic tests with a test-only spread weapon; do not ship Shotgun content in this architecture slice.

## Historical gate to numeric Shotgun implementation — PASSED by WS14-B

WS14-A passed the required Quality, Smoke and Chromium gates on PR #198 with no Runner regression. This gate was subsequently satisfied by the explicit WS14-B A1 approval for pellet count, spread angle, cadence, effective range and total volley multiplier. Those weapon values are now implemented; this historical stop rule must not be misread as permission to guess the still-unapproved character-level HP/speed/passive values.

After numeric approval, WS14-B requires deterministic volley/DPS/projectile-volume scenarios plus a real Production gameplay/D1 validation run before WS14 can be marked DONE.

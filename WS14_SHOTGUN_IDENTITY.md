# Workstream 14 — Shotgun Character Combat Identity

Status: 🟡 DESIGN / ARCHITECTURE IN PROGRESS

This workstream defines the next playable combat archetype without turning it into Runner-with-more-projectiles. Final numeric character/weapon values remain intentionally unfrozen until the identity and interaction contract below has deterministic coverage.

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
- Exact pellet count, spread angle, cadence, range and total volley multiplier are **not frozen yet**.
- Crit remains independent per projectile unless later telemetry proves the variance is unhealthy; this preserves the existing projectile-level critical-hit contract.

## Upgrade compatibility contract

- Twin Riveter, Triple Riveter and Explosive Rivet remain Rivet-Gun-only and must not enter Shotgun rolls.
- General cards remain eligible when technically compatible; the offer system must not become a synergy/recommendation engine.
- Pierce, Ricochet and Shrapnel damage remain derived from each pellet's already-budgeted primary damage, so direct + secondary damage cannot recover full damage per pellet.
- Projectile/effect volume from pellet × secondary-mechanic combinations must be measured against PB1/mobile ceilings before WS14 is marked DONE; later WS21 can tighten global performance policy if required.

## Architecture slice — WS14-A

Before assigning Shotgun numbers:

1. Add a canonical weapon `fireProfile` containing intrinsic projectile count, half-spread radians and total volley damage multiplier.
2. Make WeaponSystem resolve the intrinsic weapon volley when no Rivet multishot mechanical upgrade owns the trigger.
3. Keep Twin/Triple as Rivet-specific overrides, preserving their current live spread and damage budgets.
4. Freeze Rivet Gun as a one-projectile `1.0x` intrinsic volley so Runner behavior does not change.
5. Add deterministic tests with a test-only spread weapon; do not ship Shotgun content in this architecture slice.

## Gate to numeric Shotgun implementation

WS14-B may choose final Shotgun numbers only after WS14-A passes Quality, Smoke and Chromium with no Runner regression. Numeric implementation then requires deterministic volley/DPS/projectile-volume scenarios and a real Production gameplay/D1 validation run before WS14 can be marked DONE.

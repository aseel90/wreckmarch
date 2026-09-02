# WS22 — Deterministic Interaction Matrix

Status: IMPLEMENTED / CI VALIDATION PENDING

## Purpose

Lock the highest-risk combat mechanic combinations with deterministic regression coverage before U4 reintegration. This workstream is protective only: it does not change gameplay values, card RNG, rarity, or build availability.

## Locked matrix

- Triple Riveter + Pierce
- Triple Riveter + Shrapnel
- Pierce + Ricochet
- Shrapnel + Ricochet + Pierce
- Triple Riveter + Explosive Rivet
- Explosive Rivet + Pierce + Ricochet
- Maximum chained projectile package: Triple + Pierce + Ricochet + Shrapnel + Explosive

## Invariants

1. Triple Riveter remains exactly three symmetric projectiles sharing the approved 1.60x volley budget.
2. Chained secondary mechanics use the canonical shared secondary-damage budget and cannot exceed +1.0 added damage budget.
3. Pierce, Ricochet, Shrapnel and Explosion counts remain bounded by their canonical caps.
4. Explosive Rivet has one projectile owner at most per multi-shot volley; Triple must not create three explosive procs from one cadence event.
5. The maximum chained package is scaled by the shared budget instead of stacking every standalone mechanic at full value.
6. No interaction test is allowed to steer card RNG or remove naturally weak/off-build choices.

## Exit gate

WS22 is complete when the dedicated unit matrix plus repository Quality, Smoke and E2E checks pass without gameplay changes. After that, proceed to WS23 U4 balance gate/reintegration.

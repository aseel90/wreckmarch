# Workstream 20 — Build Identities + Anti-Mandatory-Card Validation

Status: 🟡 ACTIVE / DETERMINISTIC IMPLEMENTATION

## Goal

Prove that Wreckmarch can support at least three genuinely distinct build archetypes without making one card mandatory across unrelated builds. WS20 does **not** tune card numbers from theory; it first turns build identity into deterministic evidence, then requires Production gameplay evidence before closing the Wave-8 viability gate.

## PB1 gates

- Minimum distinct Wave-8-capable archetypes: **3**.
- Maximum one-card share of final direct-power budget: **35%**.
- A card must not be mandatory across unrelated builds.
- Direct power still obeys the late envelope / red-flag rules from `src/balance/power-budget.js`.
- Crowd, support and survivability tradeoffs are evaluated on their own axes rather than pretending every useful card is direct DPS.

## Deterministic candidate archetypes

These are validation candidates, not promised final meta builds:

1. **Scalar / Precision** — Heavy Rivets + Overclock + Critical Rivet + Twin Riveter. Identity: concentrated primary-volley damage and cadence with bounded crit.
2. **Crowd / Chain** — Overclock + Twin Riveter + Piercing + Ricochet + Shrapnel + Explosive Rivet. Identity: coverage and bounded one-depth secondary mechanics rather than pure scalar damage.
3. **Survival / Support** — Heavy Rivets + Overclock + Armor Plate + Field Repair + Impact Shield + Call the Rig. Identity: lower primary ceiling exchanged for max-HP/recovery/shield/support pressure.

No candidate is allowed to become the definition of a recommended build in the offer system. Cards remain valid/off-build choices unless mechanically incompatible.

## Deterministic delivery rule

The three candidate snapshots live in the existing canonical deterministic balance scenario suite. This is measurement-only code: it must not add a new runtime owner, change offer weighting, force a card into the player pool, or modify live card/enemy/wave numbers.

## Closure rules

- [ ] Deterministic snapshots exist for all three candidates.
- [ ] Candidate signatures are mechanically distinct.
- [ ] No upgrade ID is present in all three candidates.
- [ ] Scalar candidate remains inside PB1 late direct-power ceiling.
- [ ] Crowd candidate demonstrates bounded secondary mechanics without recursive full-strength chains.
- [ ] Survival/support candidate demonstrates real non-DPS budget ownership rather than disguising hero damage as support damage.
- [ ] One-card direct-power attribution is measured against the PB1 35% rule.
- [ ] At least three distinct archetypes have real Production evidence reaching Wave 8 or equivalent accepted gate.
- [ ] Quality / Smoke / Chromium shards / aggregate E2E green on the final WS20 implementation head.
- [ ] Exact-SHA Production verification green if live runtime paths change.

Until the Production viability requirement is satisfied, WS20 remains open even if deterministic tests are green.

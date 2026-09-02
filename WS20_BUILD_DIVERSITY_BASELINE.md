# Workstream 20 — Build Identities + Anti-Mandatory-Card Validation

Status: 🟡 ACTIVE / ONE-CARD ATTRIBUTION IMPLEMENTATION

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

1. **Scalar / Precision** — Heavy Rivets L4 + Overclock L4 + Critical Rivet L4 + Twin Riveter L2. Identity: concentrated primary-volley damage and cadence with bounded crit; Heavy/Overclock stop at L4 so neither single card exceeds the PB1 35% direct-power share.
2. **Crowd / Chain** — Overclock L4 + Twin Riveter L2 + Piercing L3 + Ricochet L2 + Shrapnel L2 + Explosive Rivet L3. Identity: coverage and bounded one-depth secondary mechanics rather than pure scalar damage; Overclock stops at L4 for the same attribution reason.
3. **Survival / Support** — Heavy Rivets L4 + Fleet Feet L3 + Armor Plate L4 + Field Repair L3 + Impact Shield L2 + Call the Rig L1. Identity: lower primary ceiling exchanged for mobility/max-HP/recovery/shield/support pressure. Overclock is intentionally absent so the candidate does not inherit the same cadence meta as the two offensive archetypes.

No candidate is allowed to become the definition of a recommended build in the offer system. Cards remain valid/off-build choices unless mechanically incompatible.

## Deterministic delivery rule

The three candidate snapshots live in the existing canonical deterministic balance scenario suite. This is measurement-only code: it must not add a new runtime owner, change offer weighting, force a card into the player pool, or modify live card/enemy/wave numbers.

## One-card attribution rule

WS20 measures direct-power concentration with a canonical leave-one-card-out replay:

`share = max(0, fullDirectDps - directDpsWithoutCard) / fullDirectDps`

- The PB1 ceiling is **0.35**.
- This denominator is the final direct-power budget, matching `POWER_BUDGET.buildDiversity.maxSingleCardShareOfFinalDirectPowerBudget`; it is not the gain-above-baseline denominator.
- Pure crowd/utility/survivability cards can correctly report `0` on this **direct-power** axis. Their value is not treated as zero overall: Production telemetry / secondary-damage / survivability evidence owns those axes.
- Candidate-level changes made to satisfy this gate do not alter live card definitions or offer weights.

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

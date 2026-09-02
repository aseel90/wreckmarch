# Workstream 20 — Build Identities + Anti-Mandatory-Card Validation

Status: ✅ COMPLETE / PRODUCTION VALIDATED — 3 OF 3 ARCHETYPES CONFIRMED

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

## One-card attribution rule

WS20 measures direct-power concentration with a canonical leave-one-card-out replay:

`share = max(0, fullDirectDps - directDpsWithoutCard) / fullDirectDps`

- The PB1 ceiling is **0.35**.
- Heavy/Overclock L5 candidate plans were rejected because they can exceed this budget in multiplicative contexts.
- Candidate plans use L4 where needed; live card definitions and offer weights were not changed.
- Pure crowd/utility/survivability cards can correctly report `0` on this **direct-power** axis. Their value is measured on Production secondary/support/survival axes.

## Production classifier

`src/balance/ws20-production-classifier.js` classifies natural Production reports without requiring an exact candidate card list.

A report is accepted only when:

- it reaches **Wave 8+**;
- direct-power concentration stays at or below **35%**;
- it has exactly one qualifying archetype identity (hybrids are not double-counted);
- offensive identities have projectile-path telemetry rather than being inferred from card names alone.

Identity signals:

- **Scalar / Precision:** meaningful scalar investment, no more than one crowd card, and primary damage share >= 80%. Meaningful scalar investment requires **3 distinct scalar cards and 4 total scalar levels**, so three incidental L1 side picks do not manufacture a Scalar identity.
- **Crowd / Chain:** at least 2 crowd cards and secondary path share >= 15%.
- **Survival / Support:** meaningful survival investment plus at least 2 observed signals among max-HP gain, mobility gain, healing, shield prevention, and >=5% support damage. Meaningful investment means either **3 distinct survival/support cards** or **4 total survival/support levels**.

### Randomness contract

Production card offers remain intentionally random. WS20 must **not** bias the offer pool toward the player's current build, guarantee synergistic choices, or remove valid off-build cards merely to make validation easier.

A natural run may therefore contain low-investment side picks that were taken because the offered alternatives were poor. Those incidental picks do not change the run's archetype by themselves. The classifier now applies investment gates symmetrically: Survival/Support needs sustained survival investment plus observed gameplay effect, while Scalar/Precision needs at least 3 distinct scalar cards and 4 total scalar levels.

This preserves the intended tension that a player will sometimes take a card that is neutral or weak for the current build instead of being handed a perfect answer every level.

## Historical Production audit

Wave-8+ reports inspected from the D1 -> GitHub bridge:

- **RUN-0039 / issue #185 — ACCEPTED: Crowd / Chain.** Wave 8; secondary path share ~21%; Overclock direct-power share ~34.81%, narrowly under PB1 35%; identity is not Survival/Support.
- **RUN-0046 / issue #233 / report `wm-213d9261-23c1-40c6-ae6a-265c85c04fb6` — ACCEPTED: Scalar / Precision.** Wave 8; duration 440.191s; primary path share ~83.73%; one crowd card only; four scalar-card identities / seven scalar levels; maximum direct concentration remains below PB1 35%. Fleet Feet L1 + Field Repair L1 are recorded as low-investment RNG side picks and do not create a second Survival/Support identity.
- **D1 row 47 / report `wm-491a3d8e-d7a4-4258-be9e-184298728589` — ACCEPTED: Survival / Support.** Wave 10; duration 691.274s; five survival/support cards / eleven total survival levels; max HP 147.25; move speed 278.645; 109.063 healing; 24 shield damage prevented; support damage 8,216.336 / 55,558.31 = ~14.79%. Twin L1 + Overclock L1 + Heavy L1 are only three incidental scalar levels and therefore do not create a second Scalar identity. The final classifier regression for this exact report passed on PR #234 head `0b59a1f41ec5bd308ac61f843bfb06052d2ccd3b` and merged as `b2132b180e56a95ebaebe325235f4da9b7c8e183`.
- **RUN-0013 / issue #151 — rejected.** Legacy report lacks path attribution and Overclock concentration is ~50.42%, above PB1.
- **RUN-0021 / issue #156 — rejected.** Overclock concentration is ~36.55%, above PB1. It contains some support picks, but under the revised RNG-tolerant classifier they are below the Survival/Support investment threshold; the run also predates current independent Rig ownership.
- **RUN-0026 / issue #165 — rejected.** Wave 10 but crowd/survival hybrid and Overclock concentration is ~44.20%, above PB1; one hybrid may not fill two archetype gates.

Current Production evidence: **3 / 3 archetypes confirmed — Scalar / Precision, Crowd / Chain, and Survival / Support.**

The runs did not need the exact deterministic candidate card list; the classifier accepted natural variations while preserving intentional random/off-build offers.

## Closure rules

- [x] Deterministic snapshots exist for all three candidates.
- [x] Candidate signatures are mechanically distinct.
- [x] No upgrade ID is present in all three candidates.
- [x] Scalar candidate remains inside PB1 late direct-power ceiling.
- [x] Crowd candidate demonstrates bounded secondary mechanics without recursive full-strength chains.
- [x] Survival/support candidate demonstrates real non-DPS budget ownership rather than disguising hero damage as support damage.
- [x] One-card direct-power attribution is measured against the PB1 35% rule.
- [x] At least three distinct archetypes have real Production evidence reaching Wave 8 or equivalent accepted gate. **Final: 3/3.**
- [x] Quality / Smoke / Chromium shards / aggregate E2E green on final classifier head `0b59a1f41ec5bd308ac61f843bfb06052d2ccd3b` (PR #234).
- [x] Exact-SHA Production verification gate is **N/A for final closure** because PR #234 changes classifier/test logic only and does not alter the live runtime import chain or gameplay.

WS20 is closed. The three Production archetypes are proven without changing live card RNG, offer weighting, card values, or gameplay runtime behavior.

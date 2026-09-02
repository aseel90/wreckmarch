# Workstream 14-B — Shotgun Numeric Decision Gate

Status: DECISION REQUIRED — NO NUMERIC VALUES APPROVED

This document prepares the next implementation step without choosing or implying unapproved balance numbers. WS14-A is already merged and provides the canonical intrinsic `fireProfile` architecture. WS14-B must not change gameplay until the Shotgun numeric identity is explicitly approved.

## 1. Current verified foundation

- WS13 canonical Weapon Registry / signature-weapon resolution is complete.
- WS14-A intrinsic volley architecture is complete in PR #198 / main `a5aab030f0b86ed17aed22fa62fbfa5252a3a519`.
- Runner remains the regression reference: one intrinsic projectile, zero intrinsic spread, `1.0x` intrinsic volley multiplier.
- PR #199 / main `0a5f273f5d9a7d3fad035245d11e749c6833787a` records WS14-A complete and WS14-B blocked on an explicit numeric decision.

## 2. Decisions that must be approved before implementation

All five fields below are intentionally blank. Do not infer values from examples, other games, Twin/Triple Riveter, or temporary test data.

| Decision | Approved value | Design question |
| --- | --- | --- |
| Pellet count | **UNSET** | How many intrinsic projectiles belong to one Shotgun trigger? |
| Spread angle | **UNSET** | What intrinsic cone makes positioning matter without making close-range hits unreadable? |
| Cadence | **UNSET** | What trigger interval creates deliberate burst rather than Runner-like sustained fire? |
| Effective range | **UNSET** | At what distance should the Shotgun lose practical effectiveness and force higher positioning risk? |
| Total volley multiplier | **UNSET** | How much total single-target power may one full close-range volley deliver before its per-pellet redistribution? |

## 3. Approved identity constraints that narrow the decision

The numeric choice must preserve the already-approved combat identity:

- The Shotgun character is a **short-range burst / coverage** archetype, not Runner with more projectiles.
- Extra projectiles redistribute a bounded volley budget; they do not receive unrestricted full primary damage each.
- Power may be shifted toward close-range burst and crowd coverage only by paying for it with lower range and higher positioning risk.
- Runner's existing balance and Rivet Gun Twin/Triple mechanics must not be silently changed to make the Shotgun work.
- Existing chained projectile mechanics remain governed by their canonical PB1 secondary/proc budgets and non-recursion rules.
- Mobile projectile and effect budgets remain binding.

## 4. Existing evidence that the decision must respect

These are constraints already present in the Combat & Build Balance foundation; they are evidence, not new Shotgun tuning values.

- Runner nominal direct reference: `24 damage / 390 ms = 61.54 nominal direct DPS`.
- Direct-power stage envelopes: early `1.0–1.6x`, mid `1.6–2.8x`, late `2.8–4.25x`; `>4.75x` is a red flag.
- Mobile projectile budget: sustained `≤20 spawns/s`, one-second burst `≤40`, peak active projectiles `≤48`, target `0 long frames`.
- Chained projectile mechanics have maximum secondary proc depth `1`.
- The shared Pierce + Ricochet + Shrapnel added-damage budget remains `+1.50x maximum`.
- Late-game pressure must still require movement/positioning; standing still while the screen is erased remains a balance failure signal.

## 5. Non-numeric option framing

The final numeric values should be chosen as one coherent package, not independently. The acceptable design directions are:

### Option A — Deliberate close-range burst

Prioritize a clearly separated firing rhythm, meaningful close-range commitment and a compact readable cone. The cost of burst must be obvious in cadence and range.

### Option B — Wider crowd-coverage burst

Prioritize hitting multiple nearby enemies across a broader cone. If coverage rises, single-target concentration and/or firing frequency must pay the cost so this does not dominate both crowd and boss damage.

### Option C — Tighter high-commitment burst

Prioritize accurate close-range concentration with less crowd coverage. If concentrated single-target value rises, range/safety/cadence must preserve the positioning-risk identity.

No option is selected by this document.

## 6. Deterministic implementation gate after approval

Once all five numeric fields are explicitly approved, WS14-B implementation must add deterministic coverage before merge:

1. **Volley geometry test** — exact projectile count and symmetric spread are deterministic for the approved profile.
2. **Volley budget test** — per-projectile damage redistribution resolves to the approved total volley multiplier.
3. **Cadence/DPS scenario** — measured trigger/volley output matches the approved identity and is compared against the frozen Runner reference.
4. **Range scenario** — near/mid/far target fixtures verify the intended effective-range tradeoff without ad-hoc runtime fallbacks.
5. **Projectile-volume scenario** — sustained and one-second burst counts remain inside the existing mobile projectile budget.
6. **Upgrade interaction matrix** — explicit compatibility/incompatibility behavior for Twin/Triple, Heavy, Overclock, Pierce, Ricochet, Shrapnel and Explosive Rivet uses canonical owners only.
7. **Runner regression scenario** — Runner remains one intrinsic projectile, zero intrinsic spread and `1.0x` intrinsic volley.

## 7. Merge and Production gate

A future numeric implementation is not DONE until all required gates pass on the final HEAD:

- Quality
- Smoke
- all Chromium E2E shards
- merged E2E
- GitHub Pages deployment for the exact merged SHA
- Live Chromium smoke on the deployed exact SHA
- one real Production gameplay/D1 validation run that actually uses the Shotgun character

## 8. Stop rule

Until pellet count, spread angle, cadence, effective range and total volley multiplier are explicitly approved, do not add a Shotgun weapon definition with guessed numbers, do not alter Runner/Twin/Triple values as a proxy, and do not mark WS14 complete.

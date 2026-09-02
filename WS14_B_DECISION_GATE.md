# Workstream 14-B — Shotgun Numeric Decision Gate

Status: ✅ COMPLETE — A1 WEAPON FOUNDATION MERGED + PRODUCTION DEPLOYED

WS14-A is already merged and provides the canonical intrinsic `fireProfile` architecture. The player selected **Option A — Deliberate close-range burst** and approved continuing with candidate package **A1**. WS14-B therefore owns the canonical **weapon-only foundation**. No Shotgun character, temporary Runner reskin, character-selection screen or live gameplay activation belongs in this stage.

## 1. Current verified foundation

- WS13 canonical Weapon Registry / signature-weapon resolution is complete.
- WS14-A intrinsic volley architecture is complete in PR #198 / main `a5aab030f0b86ed17aed22fa62fbfa5252a3a519`.
- Runner remains the regression reference: one intrinsic projectile, zero intrinsic spread, `1.0x` intrinsic volley multiplier.
- PR #199 / main `0a5f273f5d9a7d3fad035245d11e749c6833787a` records WS14-A complete and WS14-B blocked on an explicit numeric decision.

## 2. Approved A1 values

The five values below are the approved coherent Option-A package for the Shotgun weapon foundation.

| Decision | Approved A1 value | Rationale |
| --- | --- | --- |
| Pellet count | **5** | Five pellets gives frontal coverage while staying well below the mobile spawn ceiling. |
| Spread angle | **±0.24 rad** (**~27.5° full cone**) | Compact enough for readable close-range concentration while making positioning matter. |
| Cadence | **720 ms** | Clearly slower than Runner's 390 ms rhythm and reads as deliberate burst. |
| Effective range | **330** | ~58% of Runner's 570 range, enforcing materially higher positioning risk. |
| Total volley multiplier | **1.75x** | 42 damage per full base volley, redistributed to 8.4 damage per pellet at the 24 base reference. |

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

### Option A — Deliberate close-range burst — **SELECTED**

Prioritize a clearly separated firing rhythm, meaningful close-range commitment and a compact readable cone. The cost of burst must be obvious in cadence and range.

### Option B — Wider crowd-coverage burst

Prioritize hitting multiple nearby enemies across a broader cone. If coverage rises, single-target concentration and/or firing frequency must pay the cost so this does not dominate both crowd and boss damage.

### Option C — Tighter high-commitment burst

Prioritize accurate close-range concentration with less crowd coverage. If concentrated single-target value rises, range/safety/cadence must preserve the positioning-risk identity.

Option A is selected. Candidate A1 intentionally keeps nominal sustained direct DPS slightly below Runner while moving power into close-range burst and coverage.

## 5.1 Candidate A1 numeric evidence

- Full base volley: `24 × 1.75 = 42` damage when all five pellets connect.
- Per-pellet base damage budget: `42 / 5 = 8.4` (`0.35x` of the base projectile).
- Nominal direct DPS: `42 / 0.720 = 58.33`, versus frozen Runner `24 / 0.390 = 61.54`.
- Base pellet spawn rate: `5 / 0.720 = 6.94 spawns/s`.
- At the existing `1.60x` max Common Overclock reference: `720 / 1.60 = 450 ms`, or `11.11 pellet spawns/s`, below the sustained mobile ceiling of `20`.
- A conservative one-second max-Overclock burst is `ceil(1000 / 450) × 5 = 15` pellets, below the one-second burst ceiling of `40`.
- This candidate changes no Runner numeric value and does not make the Shotgun selectable/live yet.

## 6. Deterministic WS14-B gate before merge

A1 must carry deterministic coverage for all items below before it can be considered merge-ready:

1. **Volley geometry test** — exact projectile count and symmetric spread are deterministic for the approved profile.
2. **Volley budget test** — per-projectile damage redistribution resolves to the approved total volley multiplier.
3. **Cadence/DPS scenario** — measured trigger/volley output matches the approved identity and is compared against the frozen Runner reference.
4. **Range scenario** — near/mid/far target fixtures verify the intended effective-range tradeoff without ad-hoc runtime fallbacks.
5. **Projectile-volume scenario** — sustained and one-second burst counts remain inside the existing mobile projectile budget.
6. **Upgrade interaction matrix** — explicit compatibility/incompatibility behavior for Twin/Triple, Heavy, Overclock, Pierce, Ricochet, Shrapnel and Explosive Rivet uses canonical owners only.
7. **Runner regression scenario** — Runner remains one intrinsic projectile, zero intrinsic spread and `1.0x` intrinsic volley.

## 7. Merge and Production gate

WS14-B is a **weapon foundation**, not the character activation stage. It is DONE. PR #201 merged to `main` as `b2663805f4f4050278f531fc14b2ec92e283e3d7`; all PR gates passed and exact-SHA GitHub Pages live verification passed. The completed gate required:

- Quality
- Smoke
- all Chromium E2E shards
- merged E2E
- GitHub Pages deployment for the exact merged SHA
- direct Production source verification that `shotgun.js` and the registry entry contain the approved A1 values
- Live Chromium smoke on the deployed exact SHA proving the existing Runner game remains healthy

A real Production gameplay/D1 run that uses the Shotgun character is intentionally deferred to **WS14-E**, because WS14-B does not make that character selectable.

## 8. Stage boundary / stop rule

WS14-B has merged the canonical `shotgun` weapon definition and deterministic tests, and it remains unreachable from the current live character flow. Do not create a temporary Runner-reskin Shotgun, do not patch a character picker into the current runtime, and do not perform runtime cache-bust cascades solely for an unused weapon definition. WS14-C owns dedicated character art/animation; WS14-D owns the extensible start/selection flow; WS14-E owns live activation, cache-busting, character-specific card integration and Production/D1 gameplay validation.

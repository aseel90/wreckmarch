# WS17 — Rarity Identity + Power Scaling

Status: **VALIDATION BASELINE IMPLEMENTED / CI GATES PENDING**

## Decision

Do **not** nerf rarity merely because Legendary uses a `1.50x` modifier multiplier.

The canonical model scales the **per-level modifier delta**, not the already-resolved final stat. Rarity is rolled and stored independently for each acquired level. This keeps same-card rarity readable while avoiding a hidden `1.50x` multiplier on the whole build.

Current rarity model:

| Rarity | Weight | Modifier power |
| --- | ---: | ---: |
| Common | 65 | 1.00x |
| Rare | 24 | 1.15x |
| Epic | 9 | 1.30x |
| Legendary | 2 | 1.50x |

The weighted expected modifier multiplier is **1.073x**. In other words, normal rarity distribution adds about **7.3% to the modifier delta**, not 7.3% to the whole final build.

## Canonical identity rules

1. **Common is the balance baseline.** Existing PB1 Common card values remain the reference used for card ceilings.
2. **Rarity scales one acquired level only.** A later Legendary level does not retroactively upgrade earlier Common/Rare levels.
3. **Discrete mechanics stay fixed Common unless they have a dedicated rarity owner.** Twin, Triple, Pierce count, Ricochet count, Shrapnel count, Explosive Rivet, Impact Shield and Call Rig must not gain generic numeric rarity scaling.
4. **`OVERRIDE` modifiers may not use generic rarity scaling.** The runtime already rejects this path.
5. **Bounded healing may scale with rarity.** `RESTORE_HP` is an explicit rarity-aware mechanical owner; healing remains capped by current max HP / missing HP rules.
6. **Rarity must not become a recommendation engine.** A higher-rarity weak/off-build card may still be a weak/off-build choice.

## Direct-power audit

For the same card at the same maximum level, comparing an artificial all-Legendary stack with an all-Common stack:

- Heavy Rivets: final damage factor `1.90 / 1.60 = 1.1875x` → **+18.75%**.
- Overclock: final fire-rate factor `1.90 / 1.60 = 1.1875x` → **+18.75%**.
- Critical Rivet: 4 Legendary levels give 30% crit chance instead of 20%; with current `x1.5` crit damage, expected direct-power uplift is only **~4.55%** versus the same four Common levels.

This satisfies the WS17 rule that one direct-stat card must not receive an excessive whole-stat multiplier merely because its level rolled Legendary.

## Multiplicative utility audit

Multiplicative utility stats compound by design, so WS17 evaluates both normal expected rarity and adversarial all-Legendary stress:

- Long Barrel projectile speed, 4 levels:
  - normal weighted-rarity expectation vs all Common: **~+4.53%**,
  - all-Legendary stress vs all Common: **~+34.18%**.
- Long Barrel range, 4 levels:
  - expected: **~+2.68%**,
  - all-Legendary stress: **~+19.46%**.
- Fleet Feet, 3 levels:
  - hard cap keeps resolved all-Legendary vs all-Common difference at **~+0.49%** from the 255 Runner baseline.
- Scrap Magnet, 4 levels:
  - expected weighted-rarity stack vs all Common: **~+5.97%**,
  - all-Legendary stress vs all Common: **~+46.41%**.

The Scrap Magnet all-Legendary number is intentionally recorded rather than hidden. It is pickup utility, not direct combat power, and the four-Legendary path is extraordinarily unlikely under the current 2% Legendary weight. Do **not** nerf it without progression/mandatory-pick evidence. Reopen this specific axis if future Rare+ guarantees materially raise its real acquisition frequency.

## Survivability audit

- Armor Plate max level: 160 max HP at all Common versus 190 at all Legendary from the 100 HP Runner base → **+18.75%** resolved max HP.
- Armor Plate heal scales together with its max-HP grant and remains capped by max HP.
- Field Repair: Common restores **25% max HP**; Legendary restores **37.5% max HP**. It remains missing-HP gated and cannot create permanent damage scaling.
- Impact Shield is fixed Common and therefore cannot turn rarity into extra shield charges.

## Production stress reference — RUN-0026

RUN-0026 is unusually useful for WS17 because its rarity luck was already strong:

- Overclock L1–L5: **Legendary, Legendary, Rare, Rare, Epic**.
- Heavy Rivets L1–L2: **Epic, Common**.
- Critical Rivet L1–L3: **Common, Common, Rare**.
- Armor Plate L1: **Legendary**.

With those exact rarities, the final nominal direct-power estimate is **~3.453x Runner base**. If the same acquired card levels were all Common, the estimate is **~2.986x**. The observed rarity luck therefore contributed only **~15.65%** over the same-level Common-equivalent build.

That strong-rarity build still:

- remained inside the approved late envelope **2.8–4.25x**,
- stayed below the **>4.75x** red flag,
- accumulated meaningful Wave-10 pressure,
- and ended **RUNNER DOWN**.

This is strong evidence against a speculative rarity nerf.

## Full-stack distribution check

A synthetic max scalar build of Heavy L5 + Overclock L5 + Critical L4 + Twin L2, using the **weighted expected rarity multiplier 1.073x for each scalable level**, resolves to approximately **4.189x Runner base direct power**. That remains inside the approved late envelope.

Forcing every scalable level in that same max build to Legendary exceeds the PB1 red-flag region. That adversarial case is recorded as a future safety signal, not a current natural-distribution balance target. If Elite/Wreck Crate guarantees or another system materially increase Rare/Epic/Legendary frequency, WS17 must be reopened before that reward source ships.

## Deterministic gates

- [x] Rarity weights sum to 100 and weighted expected modifier power is 1.073x.
- [x] Rarity is applied per acquired level and stored per level; it does not retroactively rescale prior levels.
- [x] Discrete projectile/proc/count mechanics remain fixed Common unless explicitly rarity-owned.
- [x] Generic `OVERRIDE` rarity scaling remains rejected.
- [x] Heavy and Overclock all-Legendary same-card max stacks remain below +20% resolved direct-stat uplift versus all Common.
- [x] Critical all-Legendary same-card max stack remains well below +20% expected direct-power uplift versus all Common.
- [x] Expected weighted-rarity max scalar build remains within the PB1 late envelope.
- [x] RUN-0026 strong-rarity build remains within the PB1 late envelope and below the red flag.
- [x] Multiplicative utility accumulation is explicitly measured rather than assumed safe.
- [x] Survival rarity effects remain bounded by HP/cap/gating semantics.
- [ ] Quality + Smoke + all Chromium E2E shards pass on the exact WS17 head SHA.
- [ ] Merge to `main` and verify exact-SHA live validation.

## Stop / reopen rule

If the deterministic gates and Production reference remain green, **WS17 requires no gameplay numeric change**.

Reopen the smallest relevant rarity axis if any of the following becomes reproducible:

- same-level rarity contributes more than ~20% resolved direct-stat uplift for one normal direct-power card,
- normal-distribution max scalar power moves above the `4.25x` late envelope,
- real runs repeatedly show rarity luck alone pushing builds above the `4.75x` red flag,
- Scrap Magnet / another multiplicative utility card becomes mandatory through progression acceleration,
- a future mechanical/discrete upgrade is made variable-rarity without a dedicated bounded scaling owner,
- or Elite/Wreck Crate Rare+ guarantees materially change the rarity distribution seen by full runs.

The next planned balance workstream after WS17 is **WS18 — Rig/support damage ownership**.

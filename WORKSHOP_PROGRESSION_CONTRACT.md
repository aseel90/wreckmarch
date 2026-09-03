# WRECKMARCH — Workshop / Permanent Progression Contract

**Status:** Workshop Scrip earning foundation approved. Purchase economy is **not active**.

## 1. Current production state

The current Workshop/Progression surface may show canonical persistent records, derived milestones and the permanent Workshop Scrip balance:

- Total recorded runs.
- Best survival time.
- Highest reached level.
- Lifetime Scrap collected as a statistic.
- Workshop Scrip balance.
- Workshop Rank / Field Stamps derived from run records.
- Character production availability from `CharacterRegistry`.

Workshop records, Scrip, ranks and stamps do not grant combat power and do not authorize character activation.

## 2. Scrap and Workshop Scrip are separate systems

`Scrap` remains the canonical **in-run XP/progression resource** and may also be recorded as a lifetime statistic after a run.

`WORKSHOP SCRIP` is the canonical permanent Workshop currency.

Non-negotiable rules:

- Lifetime Scrap is never spendable and is never converted into Scrip.
- Spending Scrip must never reduce, rewrite or reinterpret historical run Scrap.
- Scrip earning does not read Scrap, level, kills, DPS, rarity choices or selected upgrades.
- No purchase system may change the approved random upgrade-card behavior by directly buying a desired card or guaranteeing a build path.

## 3. Workshop Scrip v1 earning contract

The first earning rule is intentionally simple, bounded and survival-only so it does not distort build/card decisions.

Eligibility:

- Normal player runs only.
- Debug runs earn `0`.
- Autotest runs earn `0`.
- Restart/Exit paths do not create a canonical run-end reward and therefore earn `0`.
- Runs shorter than `60s` earn `0` to discourage rapid failure farming.

Formula (`workshop-scrip-v1`):

- `60–179s` → `1` Scrip.
- `180–299s` → `2` Scrip.
- `300–419s` → `3` Scrip.
- `420–539s` → `4` Scrip.
- `540s+` → `5` Scrip maximum.

Equivalent formula:

`min(5, 1 + floor((survivedSeconds - 60) / 120))` for eligible runs of at least `60s`.

The cap prevents extreme endless runs from dominating permanent progression and keeps future economy tuning independent from combat balance.

## 4. Reward ownership and idempotency

- Every canonical run result owns a stable `runId`.
- The Workshop reward is produced once at the canonical run-end boundary before Results presentation.
- Results may display the produced reward; Results must not calculate or award it.
- `ProgressionStore` v2 records both run statistics and the produced Scrip reward against that `runId`.
- Reprocessing the same `runId` cannot duplicate run statistics or Scrip.
- The v2 persistence model migrates existing v1 run records with `workshopScrip = 0`; lifetime Scrap is never converted during migration.
- Persistence failure must never block Main, Character Select, Gameplay or local Results.

## 5. Character ownership and production availability are separate gates

Future player unlock state must not replace `CharacterRegistry` production availability.

A character may only launch gameplay when **both** conditions are true:

1. The character has passed its production/runtime activation gate and is canonically `selectable`.
2. If a future player-unlock requirement exists, the player has satisfied that separate unlock requirement.

For the current Shotgun Character:

- It remains production locked.
- Workshop Scrip, Rank, Field Stamps, lifetime Scrap, purchases or debug state cannot make it selectable.
- No Shop UI branch may use `if shotgun` to bypass `CharacterRegistry`.

## 6. Permanent economy activation prerequisites

Do not enable purchases until all remaining prerequisites exist:

- [x] One explicitly named permanent currency separate from in-run Scrap: **Workshop Scrip**.
- [x] One documented earn formula and canonical post-run award boundary.
- [x] One persistent progression owner with versioned migration rules (`ProgressionStore` v2).
- [ ] One canonical Shop/Catalog registry containing item identity, type, cost and availability requirements.
- [ ] Idempotent purchase semantics so refreshing/retrying cannot double-spend or double-unlock.
- [ ] A clear rule for duplicate/already-owned purchases.
- [ ] A character-unlock owner that composes with, but cannot override, production availability.
- [ ] Unit tests for purchase persistence, insufficient funds, duplicate purchase and locked production content.
- [ ] E2E proving Shop navigation cannot bypass Character Select or the Shotgun activation gate.
- [ ] Full Quality, Smoke, E2E and Live validation for purchasing activation.

## 7. Shop content policy

The first Workshop catalog should favor content that expands replayability without invalidating run randomness.

Preferred future categories:

- Character unlock eligibility after the character's production gate is complete.
- Cosmetic character/weapon presentation when assets exist.
- Non-power presentation unlocks such as badges or profile cosmetics.
- Carefully reviewed long-term unlocks that expand the random pool rather than guaranteeing a specific card during a run.

Avoid by default:

- Direct permanent damage/HP purchases that make baseline balance meaningless.
- Buying individual in-run upgrade cards before a run.
- Paying to force rarity, guaranteed card offers or deterministic build paths.
- Any Shop action that turns the locked Shotgun preview into playable content before its production gate passes.

## 8. UI identity

The Workshop remains part of the WRECKMARCH frontend shell:

- Dark steel / wasteland surface.
- Rust/sand accent for fabrication, Scrip and locked machinery.
- Cyan for live/validated systems.
- Large readable mobile-landscape targets.
- No generic storefront styling and no separate navigation router.

## 9. Implementation order from the current state

1. [x] Persistent run-record `ProgressionStore`.
2. [x] Results records one canonical run into Progression.
3. [x] Main routes to Progression through `GameShell`.
4. [x] Workshop Rank and Field Stamps are derived from canonical records with no gameplay effect.
5. [x] Approve Workshop Scrip identity and bounded survival-only earning rules.
6. [x] Version/migrate the progression persistence model for real economy state.
7. [ ] Add canonical Shop/Catalog registry and purchase service.
8. [ ] Add real purchasable content only when its ownership/runtime contract exists.
9. [ ] Connect player unlock state to Character Select without weakening production gates.
10. [ ] Validate purchasing on CI/E2E/Live before declaring Shop purchases active.

**Current decision:** Workshop Scrip may be earned and displayed. Shop purchasing remains intentionally disabled until steps 7–10 are complete. Leaderboard scoring remains a separate contract and must not reuse Scrip as score.

# WRECKMARCH — Workshop / Permanent Progression Contract

**Status:** Architecture and product gate only. Purchase economy is **not active**.

## 1. Current production state

The current Workshop/Progression screen is allowed to show only canonical persistent records and derived milestones:

- Total recorded runs.
- Best survival time.
- Highest reached level.
- Lifetime Scrap collected as a statistic.
- Workshop Rank / Field Stamps derived from those records.
- Character production availability from `CharacterRegistry`.

These records have no combat effect and do not authorize character activation.

## 2. Scrap is not a shop currency

`Scrap` remains the canonical **in-run XP/progression resource** and may also be recorded as a lifetime statistic after a run.

Non-negotiable rules:

- Lifetime Scrap must not become spendable by silently reusing the in-run value.
- Spending in the Workshop must never reduce, rewrite or reinterpret historical run Scrap.
- If a permanent currency is introduced later, it must have its own canonical identity, balance rules and persistent field.
- No purchase system may change the approved random upgrade-card behavior by directly buying a desired card or guaranteeing a build path.

## 3. Character ownership and production availability are separate gates

Future player unlock state must not replace `CharacterRegistry` production availability.

A character may only launch gameplay when **both** conditions are true:

1. The character has passed its production/runtime activation gate and is canonically `selectable`.
2. If a future player-unlock requirement exists, the player has satisfied that separate unlock requirement.

For the current Shotgun Character:

- It remains production locked.
- Workshop Rank, Field Stamps, lifetime Scrap, future currency, purchases or debug state cannot make it selectable.
- No Shop UI branch may use `if shotgun` to bypass `CharacterRegistry`.

## 4. Permanent economy activation prerequisites

Do not enable purchases until all of the following exist:

- [ ] One explicitly named permanent currency that is separate from in-run Scrap.
- [ ] One documented earn formula and post-run award boundary.
- [ ] One persistent progression owner with versioned migration rules.
- [ ] One canonical Shop/Catalog registry containing item identity, type, cost and availability requirements.
- [ ] Idempotent purchase semantics so refreshing/retrying cannot double-spend or double-unlock.
- [ ] A clear rule for duplicate/already-owned purchases.
- [ ] A character-unlock owner that composes with, but cannot override, production availability.
- [ ] Unit tests for persistence, migration, insufficient funds, duplicate purchase and locked production content.
- [ ] E2E proving Shop navigation cannot bypass Character Select or the Shotgun activation gate.
- [ ] Full Quality, Smoke, E2E and Live validation.

## 5. Reward ownership

If permanent currency is later awarded after a run:

- The award must be produced once from the canonical end-of-run boundary.
- Results may **display** the produced reward; Results must not independently calculate or award it again.
- Reloading Results or returning from Main must not duplicate the reward.
- Abandoned/restarted runs need an explicit reward rule before activation; do not infer one inside the UI.

## 6. Shop content policy

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

## 7. UI identity

The Workshop remains part of the WRECKMARCH frontend shell:

- Dark steel / wasteland surface.
- Rust/sand accent for fabrication and locked machinery.
- Cyan for live/validated systems.
- Large readable mobile-landscape targets.
- No generic storefront styling and no separate navigation router.

## 8. Implementation order from the current state

1. [x] Persistent run-record `ProgressionStore`.
2. [x] Results records one canonical run into Progression.
3. [x] Main routes to Progression through `GameShell`.
4. [x] Workshop Rank and Field Stamps are derived from canonical records with no gameplay effect.
5. [ ] Approve permanent-currency identity and earning rules.
6. [ ] Version/migrate the progression persistence model for real economy state.
7. [ ] Add canonical Shop/Catalog registry and purchase service.
8. [ ] Add real purchasable content only when its ownership/runtime contract exists.
9. [ ] Connect player unlock state to Character Select without weakening production gates.
10. [ ] Validate on CI/E2E/Live before declaring Shop purchases active.

**Current decision:** Progression is active. Shop purchasing remains intentionally disabled until steps 5–10 are complete.

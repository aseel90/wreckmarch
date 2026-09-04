# Upgrade System 2.0 — U4 progress

This is a narrow verification record for U4 implementation work. The canonical roadmap remains `UPGRADE_SYSTEM_2_ROADMAP.md`.

## Piercing Rivets

- [x] Canonical registry definition exists.
- [x] Weapon-scoped `pierceCount` modifier is capped at 3.
- [x] ProjectileSystem supports ordered multi-enemy swept hits.
- [x] A projectile cannot damage the same enemy twice.
- [x] Hero WeaponSystem consumes canonical resolved pierce state.
- [x] Rig/support volleys remain at zero pierce unless separately designed later.
- [x] Snapshot/debug state remains compatible through canonical upgrade levels + stat modifiers.
- [x] Dedicated Wreckmarch-style card icon exists: hot rivet penetrating scrap armor plates with cyan/orange impact sparks.
- [x] Custom U4 card art routes through the final D1 card owner and shared `upgrade-card-art.js` registry; no post-owner card wrapper is used.
- [x] Browser module graph is cache-busted for changed live owners.
- [x] Unit coverage added.
- [x] Deterministic Chromium E2E added.
- [x] PR Quality passes — PR #105 final head `6c1cf96d29a738a83fdb969c92ad23d56e6814c4`.
- [x] PR Smoke passes.
- [x] PR E2E shards 1/3, 2/3, 3/3 pass.
- [x] Aggregate E2E passes.
- [x] Merge to `main` — squash merge `0b33898e66d0f9932330cd0cb53c7651596076e8`.
- [x] Production Live verification passes on the merged SHA — iOS Live verification and Pages recovery both passed on `0b33898e66d0f9932330cd0cb53c7651596076e8`.
- [x] After the production gate, Piercing Rivets is marked DONE in the canonical roadmap.

## Ricochet — DONE (PR #109 / `6b499451bb5ff7fc29f184180d420db96fef88c6`)

Merged implementation: PR #109 from `u4-ricochet-v2` → `main` as `6b499451bb5ff7fc29f184180d420db96fef88c6`.

- [x] Canonical registry definition exists.
- [x] Weapon-scoped `ricochetCount` modifier is capped at 2.
- [x] Discrete ricochet count is fixed to COMMON for the current implementation so rarity power scaling cannot create fractional ricochet counts; final rarity remains a later balance decision.
- [x] Hero WeaponSystem consumes canonical resolved ricochet state.
- [x] ProjectileSystem owns nearby-target selection and redirection.
- [x] Pierce resolves first; Ricochet becomes eligible only on the final non-piercing impact.
- [x] A projectile cannot ricochet to an enemy it already hit.
- [x] Physics-overlap-first collisions queue a pending ricochet for ProjectileSystem instead of creating a second movement owner.
- [x] No-valid-target ricochet safely destroys the projectile.
- [x] Rig/support volleys remain at zero ricochet unless separately designed later.
- [x] Snapshot/debug state remains compatible through canonical upgrade levels + stat modifiers.
- [x] Dedicated Wreckmarch-style Ricochet card icon routes through the final D1 card owner and shared `upgrade-card-art.js` registry.
- [x] Browser module graph is cache-busted for changed live owners.
- [x] Unit coverage added, including Pierce→Ricochet ordering and overlap-first handling.
- [x] Deterministic Chromium E2E added.
- [x] PR Quality passes.
- [x] PR Smoke passes.
- [x] PR E2E shards 1/3, 2/3, 3/3 pass.
- [x] Aggregate E2E passes.
- [x] Merge to `main` — squash merge `6b499451bb5ff7fc29f184180d420db96fef88c6`.
- [x] Production Live verification passes on the merged exact SHA — iOS Live verification and Pages recovery passed on `6b499451bb5ff7fc29f184180d420db96fef88c6`; no open Live Chromium or main CI failure remained for that SHA.
- [x] After the production gate, Ricochet is marked DONE in the canonical roadmap.

## Shrapnel Impact — DONE (PR #111 / `440611c87fdfae9ad36374700e6a5831afd49b7e`)

Merged implementation: PR #111 from `u4-shrapnel-impact` → `main` as `440611c87fdfae9ad36374700e6a5831afd49b7e`.

- [x] Canonical registry definition exists.
- [x] Weapon-scoped `shrapnelCount` modifier adds 2 fragments per level and is capped at 4.
- [x] Current discrete implementation is fixed to COMMON so rarity scaling cannot create fractional fragment counts; final rarity/balance remains a later U7 decision.
- [x] Hero WeaponSystem consumes canonical resolved Shrapnel state; Rig/support volleys remain unchanged.
- [x] ProjectileSystem exclusively owns secondary-fragment creation, movement, lifetime and safety cap.
- [x] CombatSystem emits fragments only after a real successful primary impact, including impacts inside Pierce/Ricochet chains.
- [x] Secondary fragments inherit the source projectile's already-hit enemy set, preventing damage to the impact target or prior chain targets.
- [x] Secondary fragments have zero Pierce, zero Ricochet and zero Shrapnel, preventing recursive projectile chains.
- [x] Snapshot/debug state remains compatible through canonical upgrade levels + stat modifiers.
- [x] Dedicated Wreckmarch-style Shrapnel Impact card icon routes through the final D1 card owner and shared `upgrade-card-art.js` registry.
- [x] Browser module graph is cache-busted for all changed live owners.
- [x] Unit/integration coverage added for stat caps, projectile ownership, impact routing, recursion prevention and live-owner cache versions.
- [x] Deterministic Chromium E2E verifies the real UpgradeSceneV4 offer, custom art, Hero projectile impact, bounded fragment creation and damage to a nearby new enemy.
- [x] Existing forced-card E2Es explicitly max Shrapnel Impact so adding the card does not invalidate single-offer test assumptions.
- [x] PR Quality passes.
- [x] PR Smoke passes.
- [x] PR E2E shards 1/3, 2/3, 3/3 pass.
- [x] Aggregate E2E passes.
- [x] Merge to `main` — squash merge `440611c87fdfae9ad36374700e6a5831afd49b7e`.
- [x] Production exact-SHA verification passes — iOS Live verification and Pages recovery both passed on `440611c87fdfae9ad36374700e6a5831afd49b7e`.
- [x] No open `[CI] main is failing` or `[LIVE] deployed main smoke failed` issue remains after the production gate.
- [x] After the production gate, Shrapnel Impact is marked DONE in the canonical roadmap.


## Critical Rivet — DONE (PR #115 / `3af77d101ba1288ee5b349adecf271594fdea2bc`)

Current implementation values are provisional U4 test values, not locked U7 balance: +5% Crit Chance per level, max level 4, Runner critical-damage multiplier x1.5, and a declarative 35% hard chance cap.

- [x] Canonical registry definition exists.
- [x] `critChance` remains in the character/combat-stat domain; no duplicate weapon crit stat is introduced.
- [x] Runner's existing `critDamageMultiplier = 1.5` remains the canonical damage multiplier baseline.
- [x] WeaponSystem resolves one deterministic crit roll per Hero projectile and writes the final damage onto that projectile.
- [x] The projectile retains its critical outcome for its lifetime, so Pierce/Ricochet do not reroll the same projectile.
- [x] Shrapnel does not roll Crit recursively; it only receives normal secondary-projectile behavior from its source impact.
- [x] Rig/support volleys do not consume Hero crit chance.
- [x] Critical Rivet state is snapshot-compatible through canonical character stat modifiers and upgrade level/rarity history.
- [x] Dedicated Wreckmarch-style Critical Rivet card icon is routed through the shared D1 `upgrade-card-art.js` owner.
- [x] Browser module graph is cache-busted for WeaponSystem, upgrade catalog/runtime, C1 pool and D1 card art.
- [x] Unit coverage added for definition/stat state and deterministic crit resolution/Support isolation.
- [x] Deterministic Chromium E2E added for forced UpgradeSceneV4 offer, custom art, critical Hero damage, normal Hero damage and Support isolation.
- [x] Existing forced-card E2Es explicitly max Critical Rivet so single-offer assumptions remain deterministic.
- [x] PR Quality passes.
- [x] PR Smoke passes.
- [x] PR E2E shards 1/3, 2/3, 3/3 pass.
- [x] Aggregate E2E passes.
- [x] Merge to `main` — squash merge `3af77d101ba1288ee5b349adecf271594fdea2bc`.
- [x] Production exact-SHA Live verification passes — iOS Live verification and Pages recovery both passed on `3af77d101ba1288ee5b349adecf271594fdea2bc`; no open `[CI] main is failing` or `[LIVE] deployed main smoke failed` issue remained after the production gate.
- [x] After the production gate, Critical Rivet is marked DONE in the canonical roadmap.

## Future fixes / polish

- [x] Reconcile per-card rarity identity with the canonical WS17 model. — **Status:** ✅ RESOLVED / SUPERSEDED — WS17 intentionally stores rarity independently for each acquired numeric level, while discrete mechanics use fixed rarity unless they have a dedicated rarity-scaling owner. The earlier U4 concern is therefore not an open U7 task.

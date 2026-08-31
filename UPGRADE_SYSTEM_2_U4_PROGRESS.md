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

## Future fixes / polish

- [ ] Stabilize per-card rarity identity: the same upgrade card (observed example: Fleet Feet / speed card) should not randomly reappear as COMMON, EPIC, or LEGENDARY unless that card explicitly opts into a designed multi-rarity progression model. Keep this deferred until the U7 rarity/balance cleanup pass; do not block current U4 projectile-card implementation.

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

## Ricochet — IN PROGRESS (PR #109)

Current implementation branch: `u4-ricochet-v2`.

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
- [ ] PR Quality passes.
- [ ] PR Smoke passes.
- [ ] PR E2E shards 1/3, 2/3, 3/3 pass.
- [ ] Aggregate E2E passes.
- [ ] Merge to `main`.
- [ ] Production Live verification passes on the merged exact SHA.
- [ ] Only after the production gate: mark Ricochet DONE in the canonical roadmap.

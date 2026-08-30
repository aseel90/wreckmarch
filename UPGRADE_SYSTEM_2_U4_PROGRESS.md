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
- [x] Browser module graph is cache-busted for changed live owners.
- [x] Unit coverage added.
- [x] Deterministic Chromium E2E added.
- [ ] PR Quality passes.
- [ ] PR Smoke passes.
- [ ] PR E2E shards 1/3, 2/3, 3/3 pass.
- [ ] Aggregate E2E passes.
- [ ] Merge to `main`.
- [ ] Production Live verification passes on the merged SHA.
- [ ] Only after the production gate: mark Piercing Rivets DONE in the canonical roadmap.

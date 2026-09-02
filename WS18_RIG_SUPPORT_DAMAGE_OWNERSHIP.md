# WS18 — Rig / Support Damage Ownership

Status: ✅ COMPLETE — MERGED + EXACT-SHA LIVE VALIDATED

## Problem

The production Fortress Rig previously resolved each support projectile as `scene.primaryWeapon.damage × 0.58`. That made support damage inherit only one ambiguous primary-weapon field:

- Heavy Rivets increased Rig damage automatically because it changes primary weapon damage.
- Overclock, Critical Rivet and Twin/Triple did not scale the Rig in equivalent ways.
- A multi-projectile weapon such as Shotgun makes `primaryWeapon.damage` an especially poor support-budget owner because pellet damage / volley damage are separate concepts.

This violates the one-owner rule for stable combat domains.

## Approved WS18 baseline

The Rig receives one canonical support-combat profile under `src/rig/fortress-rig-profile.js`:

- Fire delay: **920 ms**
- Projectile count: **1**
- Projectile damage: **13.92**
- Projectile speed: **680**
- Target range: **560**
- Muzzle distance: **61**
- Projectile lifetime: **1100 ms**
- Projectile scale: **0.66**

`13.92` preserves the previous unupgraded Runner baseline exactly: `24 × 0.58 = 13.92`. At 920 ms cadence the nominal support DPS is **15.1304**, about **24.6%** of Runner base direct DPS.

## Ownership rules

1. Rig support damage MUST NOT read `primaryWeapon.damage`.
2. Hero Heavy/Overclock/Crit/Twin/Triple/Shotgun fire profiles MUST NOT silently multiply Rig support damage.
3. Future Rig-specific cards may modify support power only through an explicit Rig-owned stat/effect path.
4. Telemetry remains the production validation owner through `supportSpawned`, `damageByProjectilePath.support`, and `hitsByProjectilePath.support`.
5. No new phase runtime layer is allowed.

## Live delivery contract

WS18 changes a currently loaded runtime module, so source correctness alone is not enough. The production boot chain MUST invalidate the old Rig module:

- `src/phase-c4-runtime.js` imports `./rig/rig-system.js?v=2`.
- `index.html` imports `./src/phase-c4-runtime.js?v=5`.
- `tests/unit/rig-production-cache.test.ts` locks both version edges.

This is the minimum required cache-bust cascade; no unrelated runtime version is changed.

## Production evidence note

RUN-0026 is not a Rig balance sample: it recorded `supportSpawned = 0`, `damageByProjectilePath.support = 0`, and did not acquire `call-rig`. Therefore WS18 deliberately preserves the old unupgraded support baseline instead of inventing a buff/nerf without support-path telemetry.

## Acceptance

- [x] Canonical immutable Rig combat profile exists.
- [x] Base Runner support projectile remains 13.92 damage.
- [x] Heavy/Shotgun/Twin-like primary weapon semantics do not change support projectile damage.
- [x] Live C4 → Rig cache edge bumped to `rig-system.js?v=2`.
- [x] Index → C4 cache edge bumped to `phase-c4-runtime.js?v=5`.
- [x] Cache-bust contract has unit coverage.
- [x] Quality / unit checks green on final live-delivery head `042bee672b3520f2fac48f9eeb582e2f32dbad50`.
- [x] Smoke green on final live-delivery head.
- [x] Chromium shards 1–3 green on final live-delivery head.
- [x] Aggregate E2E green on final live-delivery head.
- [x] Exact merge SHA `89596fba6a6d6a1deba45deae1ee5af0a93d4dee` passed Live verification and iOS Pages recovery.

Production/D1 balancing should only reopen the numeric value if support telemetry shows a real over/under-performance signal.

## Closure

- PR #214 merged to `main` as `89596fba6a6d6a1deba45deae1ee5af0a93d4dee`.
- Final PR head `042bee672b3520f2fac48f9eeb582e2f32dbad50` passed Quality, Smoke, Chromium shards 1–3 and aggregate E2E.
- Exact merge SHA passed GitHub Pages Live verification and iOS Pages recovery.
- WS18 changes support **ownership**, not support balance strength. Reopen numeric tuning only with real support-path Production telemetry.
- Handoff: **WS19 — Armor/stat combat semantics + survivability utility**.

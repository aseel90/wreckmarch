# WS18 — Rig / Support Damage Ownership

Status: 🟡 IMPLEMENTATION GATE

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

## Acceptance

- [x] Canonical immutable Rig combat profile exists.
- [x] Base Runner support projectile remains 13.92 damage.
- [x] Heavy/Shotgun/Twin-like primary weapon semantics do not change support projectile damage.
- [ ] Quality / unit checks green.
- [ ] Smoke green.
- [ ] Chromium shards 1–3 green.
- [ ] Aggregate E2E green.
- [ ] Exact merge SHA Live verification green.

Production/D1 balancing should only reopen the numeric value if support telemetry shows a real over/under-performance signal.

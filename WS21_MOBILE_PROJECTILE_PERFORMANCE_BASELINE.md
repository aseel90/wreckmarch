# WS21 — Mobile Projectile / Effect Performance Baseline

Status: **FOUNDATION IN PROGRESS / MEASUREMENT ONLY**

## Goal

Set a measured mobile performance budget for late-run projectile/effect pressure without weakening build variety or steering the random upgrade pool. WS21 must identify whether pressure comes from primary hero projectiles, Shrapnel fragments, support projectiles, or frame-costly effect work before any gameplay tuning is considered.

## Existing telemetry retained

- frame count, average frame time and maximum frame time
- long frames at `>= 33.34 ms`
- frame-spike samples with active enemy/projectile context
- peak active enemies
- peak active projectiles
- total hero/support/Shrapnel projectile spawn counts

## WS21 measurement additions

- `performance.averageProjectileSpawnsPerSecond`
- `performance.peakProjectileSpawns1s`
- `performance.peakActiveHeroProjectiles`
- `performance.peakActiveShrapnel`
- `performance.peakActiveSupportProjectiles`

These fields are observational only. They do not cap, delete, delay, redirect or rebalance projectiles.

## Provisional budget targets

These remain soft evidence gates until Production validates them:

| Metric | Provisional target | Meaning |
| --- | ---: | --- |
| Average projectile spawns | `<= 20/s` | sustained projectile creation pressure |
| Peak 1-second projectile spawns | `<= 40` | short burst pressure |
| Peak active projectiles | `<= 48` | simultaneous live projectile pressure |
| Long frames | target `0` | frames at or above 33.34 ms |

The frozen WS16 Production reference already observed approximately `19.13 projectile spawns/s`, so WS21 treats the 20/s target as something to validate rather than a reason to nerf the current build.

## Required validation sequence

1. Deterministic telemetry regression proves each new field is counted once and does not own combat behavior.
2. Quality/Smoke/Chromium gates pass.
3. Run a projectile-heavy Production build, preferably late enough to combine high primary fire pressure with secondary projectile/effect mechanics.
4. Record average/peak projectile spawn rate, peak active hero/Shrapnel/support counts, long frames and frame-spike context.
5. If a ceiling is exceeded without long-frame pressure, reconsider the provisional ceiling before touching gameplay.
6. If long frames correlate with one pressure class, optimize that owner first; do not apply unrelated global nerfs.

## Protected behavior

WS21 must not change these without separate measured evidence:

- upgrade RNG or card-offer steering
- primary fire rate or projectile count
- Twin/Triple projectile identity
- Shrapnel count/damage semantics
- Explosive Rivet cadence/damage semantics
- Pierce/Ricochet behavior
- enemy wave pressure or spawn pacing

## Exit gate

WS21 can be marked complete only after at least one representative high-pressure Production run produces the new telemetry and the team can state a measured ceiling or optimization decision with no speculative gameplay changes.

# WS21 — Mobile Projectile / Effect Performance Baseline

Status: **✅ COMPLETE / PRODUCTION D1 VALIDATED**

WS21 establishes a measured mobile projectile/effect performance budget without weakening build variety or steering card RNG.

## Automated foundation

Merged foundations:
- PR #237 / main `7d1ce0c4ae8887823c54f0f71d4ad1ab98e477a8` — projectile spawn-rate and active projectile-class telemetry.
- PR #240 / main `c7f9ac768f07319684fa33553bc563779c51d178` — deterministic WS21 performance evidence evaluator.

Tracked metrics:
- average projectile spawns per second
- peak projectile spawns in one second
- peak active projectiles
- peak active hero projectiles
- peak active Shrapnel
- peak active support projectiles
- average / max frame time
- long frames (`>=33.34 ms`)
- frame spikes and enemy pressure context

## Provisional PB1 evidence ceilings

- sustained projectile spawns: `≤20/s`
- one-second burst: `≤40`
- peak active projectiles: `≤48`
- target long frames: `0`

These are warning/evidence budgets, not automatic gameplay clamps.

## Production closeout — 2026-09-02

Authoritative Production evidence:
- D1 row: `48`
- report: `wm-1e3b7683-8eae-4517-9de6-cb8f27ebb979`
- duration: `708.269 s`
- final Wave: `10`
- Level: `21`
- finish: `RUNNER DOWN`
- kills: `1,015`
- damage: `99,610.949`

This run naturally combined a high-pressure projectile build: Triple Riveter, Piercing Rivets L3, Shrapnel Impact, Ricochet, Explosive Rivet, Overclock and Call the Rig.

Measured pressure:
- average projectile spawns: **19.28/s** — PASS vs `≤20/s`
- peak projectile spawns in 1 second: **38** — PASS vs `≤40`
- peak active projectiles: **26** — PASS vs `≤48`
- peak active hero projectiles: **15**
- peak active Shrapnel: **14**
- peak active support projectiles: **2**
- total projectile spawns: **13,657**
- Shrapnel spawns: **8,166**

Frame health:
- average frame: **16.68 ms**
- max frame: **18.5 ms**
- long frames: **0**
- recorded frame spikes: **0**

Late-run pressure remained alive:
- peak active enemies: **36**
- average DPS: **140.64**
- peak 1-second DPS: **397.811**
- run ended with the Runner down

## Decision

WS21 is **closed**. The representative Production stress run stayed inside all four provisional limits while exercising one of the heaviest naturally obtainable projectile combinations currently available.

No gameplay nerf is justified. Do not reduce fire rate, Triple projectile count, Shrapnel count, Explosive Rivet cadence, enemy pressure, RNG/card offer behavior, or VFX from this evidence.

If a future build exceeds a provisional projectile ceiling while long frames remain zero, reconsider the provisional ceiling before changing gameplay. If long frames appear, first attribute pressure to the actual hero/Shrapnel/support/effect owner and optimize that owner rather than applying a global nerf.

Cross-workstream note: the same Production report also naturally completed the missing Twin L2 → Triple Riveter validation required to close WS10. See `WS10_WS21_PRODUCTION_CLOSEOUT.md`.

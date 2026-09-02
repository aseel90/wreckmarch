# WS10 + WS21 Production Closeout

Status: **COMPLETE / PRODUCTION D1 VALIDATED**

Production evidence source:
- D1 row: `48`
- Report ID: `wm-1e3b7683-8eae-4517-9de6-cb8f27ebb979`
- Received: `2026-09-02 17:21:55 UTC`
- Finish: `RUNNER DOWN`
- Duration: `708.269 s`
- Final Wave: `10`
- Level: `21`
- Kills: `1,015`
- Damage dealt: `99,610.949`
- Average DPS: `140.64`
- Peak 1s DPS: `397.811`

## WS10 — Triple Riveter

**Decision: ✅ CLOSED / PROD D1 VALIDATED**

The missing natural Production prerequisite path occurred without any forced card, weighting, guarantee, or test-only bias:
- Twin Riveter L1 at `12.231 s`
- Twin Riveter L2 at `168.367 s`
- Triple Riveter Rare at `198.023 s`

After Triple was acquired, the run continued for more than 510 seconds and reached Wave 10. The final build also included Piercing Rivets L3, Shrapnel Impact L1, Ricochet L1, Explosive Rivet L2, Heavy Rivets L2, Overclock L1, Critical Rivet L4, Field Repair L2, and Call the Rig L1.

The natural Triple path therefore satisfies the remaining WS10 gameplay/D1 gate. Failure to roll Triple naturally is no longer an open validation item.

## WS21 — Mobile projectile/effect performance budget

**Decision: ✅ CLOSED / PROD D1 VALIDATED / NO GAMEPLAY NERF REQUIRED**

Representative high-pressure measurements:
- Average projectile spawns: `19.28/s` vs provisional ceiling `≤20/s`
- Peak projectile spawns in 1 second: `38` vs provisional ceiling `≤40`
- Peak active projectiles: `26` vs provisional ceiling `≤48`
- Peak active hero projectiles: `15`
- Peak active Shrapnel: `14`
- Peak active support projectiles: `2`
- Total projectile spawns: `13,657`
- Hero projectile spawns: `5,181`
- Shrapnel spawns: `8,166`
- Support projectile spawns: `310`
- Average frame time: `16.68 ms`
- Maximum frame time: `18.5 ms`
- Long frames (`>=33.34 ms`): `0`
- Recorded frame spikes: `0`
- Peak active enemies: `36`

The run exercised a naturally heavy projectile build containing Triple Riveter, Pierce, Shrapnel, Ricochet, Explosive Rivet, Overclock and Call the Rig while remaining inside all four provisional WS21 performance limits.

Damage attribution remained distributed rather than collapsing into one secondary mechanic:
- Primary: `66,016.846`
- Pierce: `15,512.061`
- Shrapnel: `9,204.092`
- Ricochet: `4,464.384`
- Support: `3,922.165`
- Explosion: `542.749`

The build did not erase late-game pressure: peak active enemies reached `36`, Wave 10 remained dangerous, and the run ended with the Runner down. Therefore there is no evidence-based reason to reduce fire rate, Triple projectile count, Shrapnel count, Explosive Rivet cadence, enemy pressure, or VFX from this run.

## Locked interpretation rule

The current WS21 ceilings remain warning/evidence budgets, not runtime clamps. If a future build exceeds `20/s`, `40 burst`, or `48 active` while long frames remain zero, reconsider the provisional ceiling before changing gameplay. If long frames appear, attribute the pressure to the actual hero/Shrapnel/support/effect owner first and optimize that owner instead of applying a global nerf.

## Handoff

WS10 and WS21 are closed. The next active balance workstream is **WS22 — deterministic interaction matrix / regression scenarios**.

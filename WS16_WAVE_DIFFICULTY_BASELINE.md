# WS16 — Wave / Difficulty Scaling vs Player Power

Status: **✅ COMPLETE / CURRENT WAVE CURVE VALIDATED / NO REBALANCE REQUIRED**

## Decision

Do **not** rebalance wave numbers merely because WS16 opened. The gate was to prove whether the current 10-wave curve still creates pressure after the corrected player-power workstreams.

The current curve passed that gate without a gameplay-number change:

- Wave 1 → Wave 10 HP grows only **1.00× → 1.90×**.
- Damage grows **1.00× → 1.36×**.
- Speed grows **1.00× → 1.09×**.
- Base threat budget grows **15 → 46 (~3.07×)**.
- Base active cap grows **26 → 44 (~1.69×)**.
- Base spawn interval falls **720 ms → 425 ms**, about **1.69× more spawn opportunities per second**.
- Threat-budget × spawn-rate pressure therefore grows by roughly **5.20×** before enemy-mix changes are considered.

The intended design is preserved: late difficulty comes mainly from **density, cadence, mixed enemy roles and SURGE rhythm**, not by turning enemies into HP sponges.

## Production reference — RUN-0026

Issue #165 / RUN-0026 remains the strongest current full-run reference:

- Duration: **572.977 s**.
- Finish: **RUNNER DOWN** in Wave 10, near the final SURGE window.
- Kills: **906**.
- Spawned: **929** total (644 Rat / 148 Hound / 137 Sawbug).
- Kill/spawn ratio: **~0.9752**, below PB1 crowd red flag `0.985`.
- Peak active enemies: **31** against Wave-10 SURGE cap **46** = **~0.674 utilization**, inside the preferred `0.45–0.70` range.
- Average DPS: **147.426**; peak 1 s DPS: **499.897**.
- Final resolved weapon: damage **30.624**, fire delay **217.634 ms**, Twin L2, crit chance **0.1575**.
- Estimated final nominal direct power is **~3.45× Runner base**, inside the approved late envelope **2.8–4.25×**.
- Projectile spawns: **10,959 / 572.977 s = ~19.13/s**, under but close to the mobile soft maximum **20/s**.
- Peak active projectiles: **24**, below soft maximum **48**.
- Long frames: **0**.

This is strong evidence against a blind Wave-10 HP increase: a strong build still accumulated enemies, did not erase every spawn, and ultimately died in Wave 10.

## Cross-workstream observations — do not solve in WS16

- Peak/average DPS ratio is about **3.39**: above the preferred `3.25` but below the `4.0` red flag. Carry this to WS17/WS20; do not distort wave scaling to hide a burst/build issue.
- Whole-run seconds per player hit is about **44.1 s**, above the survivability red flag if interpreted naively, but the run still ended RUNNER DOWN. Temporal hit distribution and armor/survival semantics belong to WS19.
- Sustained projectile spawn rate is **~19.13/s**, close to the `20/s` mobile soft cap. This is a WS21 performance-budget observation, not a reason to reduce wave pressure here.

## Deterministic gates

- [x] Wave base pressure is monotonic from Wave 1 through Wave 10: threat budget and active cap rise while spawn interval falls.
- [x] Enemy durability scaling stays restrained relative to total pressure scaling; Wave-10 HP remains below 2× base.
- [x] Enemy speed scaling remains restrained at or below 1.10× by Wave 10.
- [x] Density/cadence pressure grows materially faster than HP alone.
- [x] RUN-0026 final nominal direct power sits inside the approved late-game power envelope.
- [x] RUN-0026 SURGE cap utilization sits inside the preferred crowd-pressure range.
- [x] RUN-0026 kill/spawn ratio remains below the screen-delete red flag.
- [x] WS16 does not modify enemy HP/damage/speed, wave budgets, spawn intervals, active caps or enemy weights without contrary repeatable evidence.
- [x] Quality + Smoke + all Chromium E2E shards passed on exact PR head `3a134e37a34a2e38437264682054feca2b0ce8df`.
- [x] PR #207 merged to `main` as `7d35a3239a26be30267d1979057182e39a6e4828` and exact-SHA Live verification passed.

## Completion record — 2026-09-02

- PR: **#207 — WS16: validate current wave difficulty curve without HP inflation**.
- Final PR head: `3a134e37a34a2e38437264682054feca2b0ce8df`.
- Merge SHA: `7d35a3239a26be30267d1979057182e39a6e4828`.
- Exact-head gates: **Quality ✅ / Smoke ✅ / Chromium E2E shards 1–3 ✅ / aggregate E2E ✅**.
- Exact merge SHA: **Live verification PASSED ✅** on GitHub Pages.
- `ios-standalone-recovery.yml` did not run for this merge by design: that workflow is path-filtered to `index.html`, `manifest.webmanifest`, and its own workflow file; WS16 changed only validation documentation/tests and no runtime shell or manifest.
- **No enemy HP, damage, speed, wave budget, spawn interval, active cap or enemy-weight numbers were changed.**
- Conclusion: the current wave curve remains the canonical baseline; no WS16 rebalance is required.
- **Next active balance workstream: WS17 — Rarity identity + power scaling.**

## Stop rule

Keep the current curve unless later Production runs repeatedly show one of these failures:

- late SURGE utilization consistently below 0.40,
- kill/spawn ratio at or above 0.985 under unrelated strong builds,
- Wave 8–10 pressure fails to produce meaningful movement/hit risk,
- weak builds fail far earlier than the intended progression despite legal card choices,
- or mobile performance limits force a density tradeoff.

The next planned workstream after WS16 is **WS17 — Rarity identity + power scaling**.

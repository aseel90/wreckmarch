# WRECKMARCH — Combat & Build Balance Foundation Roadmap

**Status:** Active implementation reference

**Purpose:** define the canonical order, measurement gates and ownership rules for balancing Wreckmarch combat, build growth, enemy pressure and future characters without patch-on-patch drift.

This document is additive to the existing project references. It does not delete or silently replace protected U4/U7 scope in `UPGRADE_SYSTEM_2_ROADMAP.md`.

---

# 0. Non-negotiable balance principles

1. **Measure before changing.** Numeric balance changes must be traceable to repeatable telemetry or deterministic scenarios.
2. **One canonical owner per mechanic.** Damage, fire rate, projectile count, pierce, ricochet, shrapnel, armor and enemy pressure must not be independently reimplemented in visual/runtime hotfix layers.
3. **No hidden multiplication.** A card description, mechanical state and resolved runtime effect must agree.
4. **No patch stacking.** Fix the authoritative system when possible instead of adding a new final-runtime override over an old override.
5. **Mobile performance is part of balance.** A build is not valid if its projectile/effect cost causes late-run mobile instability.
6. **Future-character-safe.** Runner balance must not hard-code assumptions that make a future Shotgun or other signature weapon impossible.
7. **Build diversity matters.** A healthy system supports multiple viable identities instead of one mandatory scalar stack.
8. **Enemy HP inflation is not the first response.** Correct player power growth before blindly increasing enemy durability.

---

# 1. Baseline Metrics & Automated Run Telemetry

## 1.1 Goal

Capture what the current game actually does before applying the new balance pass. The baseline must make real runs and deterministic scenarios comparable without giving telemetry ownership of gameplay.

## 1.2 Canonical ownership

- `RunTelemetry` owns aggregation of run/wave/combat/projectile/upgrade/performance metrics.
- `RunReportProvider` owns delivery/retry boundaries.
- Gameplay systems emit/are observed by telemetry; telemetry does not calculate authoritative damage, spawn enemies or select upgrades.
- Remote reporting stays separable from the local/CI telemetry owner.

## 1.3 Required run-level metrics

A canonical run report should include at minimum:

- duration / completion reason
- final wave / level / scrap / HP
- kills and kills per minute
- damage dealt / damage taken
- average DPS and one-second peak DPS
- player hit count
- kills/spawns by enemy type
- TTK samples by enemy type
- current/final resolved character + weapon stats
- upgrade history in selection order, including level, rarity and selection time

## 1.4 Required projectile/mechanical metrics

Track enough information to distinguish raw scalar power from crowd-mechanic multiplication:

- weapon triggers
- total projectiles spawned
- primary/hero projectiles
- support/Rig projectiles
- shrapnel fragments
- primary projectiles with hits vs misses
- pierce events
- ricochets
- critical hits

## 1.5 Wave/pressure metrics

At each relevant wave/pressure transition record:

- wave number
- pressure phase (`lull`, `build`, `surge`, `breather`)
- threat budget
- active cap
- spawn interval
- HP multiplier
- damage multiplier
- speed multiplier

The purpose is to compare player growth with enemy pressure rather than judging difficulty from survival time alone.

## 1.6 Browser/mobile performance metrics

Record:

- average frame time
- max frame time
- long-frame count
- peak active enemies
- peak active projectiles
- frame-spike samples where useful

Do not add heavyweight analytics that materially alter the run being measured.

## 1.7 Reporting / CI rule

The report must be machine-readable for CI/Playwright and retain a browser-safe manual path during testing. Failed remote submission must not destroy the local report.

Cloudflare/D1 may bridge real reports into GitHub Issues, but GitHub delivery is downstream of the canonical telemetry report; it is not the gameplay source of truth.

## 1.8 Baseline implementation checklist

- [x] Identify canonical telemetry event/reporting touchpoints without duplicate gameplay ownership. — **Status:** ✅ IMPLEMENTED — PR #118 / `e046971258628e9a7db8892e7fd21daadace958f`
- [x] Implement the telemetry provider/no-op boundary. — **Status:** ✅ IMPLEMENTED — `RunReportProvider` + `NoopRunReportProvider`
- [x] Implement local/CI run telemetry aggregation. — **Status:** ✅ IMPLEMENTED — canonical `RunTelemetry` owner
- [x] Add structured run/wave metrics. — **Status:** ✅ IMPLEMENTED
- [x] Add combat/kills/survivability metrics. — **Status:** ✅ IMPLEMENTED
- [x] Add upgrade/build-history metrics. — **Status:** ✅ IMPLEMENTED
- [x] Add projectile/mechanical counters. — **Status:** ✅ IMPLEMENTED
- [x] Add browser-appropriate performance metrics. — **Status:** ✅ IMPLEMENTED
- [x] Expose a machine-readable run report to Playwright/CI. — **Status:** ✅ IMPLEMENTED — `__WM_TELEMETRY__`, `__WM_TELEMETRY_RUNTIME__`, `__WM_LAST_RUN_REPORT__`
- [x] Implement automatic end-of-run/death submission with server-assigned sequential `RUN-####` labels and local failure recovery. — **Status:** ✅ IMPLEMENTED THROUGH CLOUDFLARE/D1
- [x] Verify secure OIDC Worker → GitHub Issue bridge on `main` and one real `RUN-####` Issue. — **Status:** ✅ VERIFIED — real D1 report `wm-baddb2f5-fd07-49fb-9ed2-77cd992dd632` submitted as GitHub Issue #138 / `RUN-0006`; full telemetry JSON preserved in issue comments; no PAT required
- [x] Implement the initial deterministic balance-scenario suite. — **Status:** ✅ IMPLEMENTED — eight fixed-seed scenarios use canonical `RunStatState`, `applyRegisteredUpgrade` and `WeaponSystem` paths with machine-readable deterministic snapshots; PR #146 CI verified
- [x] Verify the telemetry change does not alter current gameplay/balance values. — **Status:** ✅ VERIFIED — PR #118 Quality/Smoke/E2E all passed; no card/enemy/wave/damage values changed
- [x] Verify no Firebase/external analytics dependency is required. — **Status:** ✅ VERIFIED
- [x] Capture the first real baseline reports before applying balance changes. — **Status:** ✅ CAPTURED — multiple real reports stored in D1 and bridged to GitHub Issues; representative `RUN-0006` reached Wave 3 with complete run/wave/combat/projectile/upgrade/performance telemetry
- [x] Complete the manual gameplay-pressure review. — **Status:** ✅ COMPLETE — real 173.153s, 459.506s and 242.157s telemetry runs reviewed; early standing still was possible, Sawbug reliably forced movement/dodging, and Rust Hound was usually killed before its attack could develop

## 1.9 gate rule

**Baseline Metrics is now the frozen pre-change evidence set for this balance pass.**

The baseline dataset and manual gameplay-pressure review are complete. The 459.506s scalar-heavy run exposed excessive player-power growth (Wave 8, 769 kills, 100.412 KPM, peak active enemies 14 against a SURGE cap of 42), while the 242.157s crowd/utility-focused run showed materially lower direct pressure (Wave 5, 309 kills, 76.562 KPM) and substantially harder survival. These measurements are now the reference used to derive Power Budget v1.

Do not rewrite or reinterpret these baseline values after balance changes. New runs are post-change validation data. Explosive Rivet and Triple/advanced multishot remain paused until workstreams 3–8 revalidate the new budget in production gameplay.

---

# 2. Power Budget — ✅ APPROVED DESIGN

## 2.1 Core rule

Power is not defined by one DPS ceiling. Balance must consider single-target power, crowd clear, burst, range/safety, control, survivability and mobile performance together. Different characters may distribute that budget differently while remaining comparably viable.

## 2.2 Character identity rule

- Runner may spend more of its budget on range, sustained fire and safety.
- A future Shotgun character may spend more on short-range burst/crowd control while paying for that power with lower range and higher positioning risk.
- Future characters must not be forced into identical DPS/range profiles.

## 2.3 Card-growth rule

- A normal card should primarily strengthen a clear axis rather than silently multiplying several systems at once.
- Repeated levels must not create unintended exponential growth. Stacking should be readable and budgeted from a known base/resolved stat model.
- No card should become an automatic mandatory pick across unrelated builds.

## 2.4 Multishot / volley rule

Additional projectiles redistribute a trigger/volley damage budget; they do not automatically grant 2x/3x full damage. Twin/Triple should increase coverage and mechanical opportunities while keeping single-target growth controlled. Exact coefficients remain open until Baseline Metrics are captured.

## 2.5 Crowd-mechanic rule

Pierce, Ricochet, Shrapnel and future Explosion should primarily increase crowd-clear/coverage value. Cross-mechanic synergies may be strong, but each mechanic must not freely multiply every downstream mechanic at full strength. Caps, proc budgets, secondary-damage coefficients or non-recursion rules may be used after measurement.

## 2.6 Late-run power fantasy rule

Late-game builds should feel substantially stronger than early-game builds, but even a top build should still need movement/positioning and respect SURGE pressure, Rust Hound and Sawbug threats. Standing still while the screen is erased is a balance failure signal.

## 2.7 Numeric Power Budget v1 — ✅ DERIVED FROM BASELINE

The numeric gate is now defined in `src/balance/power-budget.js` (`U4-B-PB1`) from the frozen real-run baseline. It is the canonical design reference for workstreams 3–8.

- Runner base direct reference: **24 damage / 390 ms = 61.54 nominal direct DPS**.
- Normal Common direct-stat pick: target **+12% of base**, acceptable band **+8% to +15%**.
- Repeated scalar levels: **base-relative additive**, never repeated multiplication of the already-resolved value.
- Common single-axis scalar ceiling: **1.60x**.
- Common damage × fire-rate combined scalar ceiling: approximately **2.50x** before separate mechanical value.
- Direct-power stage envelopes: early **1.0–1.6x**, mid **1.6–2.8x**, late **2.8–4.25x**; **>4.75x** is a red flag.
- Twin volley: exactly **2 projectiles**, **1.20x** total single-target power at level 1 and **1.40x** at level 2; no hidden Triple.
- Chained projectile mechanics: maximum secondary proc depth **1**; no recursive full-strength proc chains.
- Standalone added-damage soft caps: Pierce **+0.90x**, Ricochet **+0.75x**, Shrapnel **+0.70x** per primary-damage reference.
- Combined Pierce + Ricochet + Shrapnel added-damage budget: **+1.50x maximum**, shared proportionally when requested secondary value exceeds the cap.
- Late SURGE pressure: peak active-enemy utilization should be at least **40%** of the active cap, preferably **45–70%**, rather than the pre-change 14/42 screen-clear failure signal.
- Mobile projectile budget: sustained **≤20 spawns/s**, one-second burst **≤40**, peak active projectiles **≤48**, target **0 long frames**.
- Build-diversity gate: no one card should provide more than **35%** of final direct-power budget across unrelated builds; at least **3 distinct Wave-8-capable archetypes** are required before closing U4.

## 2.8 Power-budget implementation checklist

- [x] Capture Baseline Metrics before changing numeric balance. — **Status:** ✅ COMPLETE
- [x] Define target single-target / crowd / burst / safety / survivability envelopes from baseline data. — **Status:** ✅ DEFINED IN PB1
- [x] Define a canonical trigger/volley damage-budget model for multishot weapons. — **Status:** ✅ DEFINED IN PB1
- [x] Define anti-exponential stacking rules for repeated card levels. — **Status:** ✅ BASE-RELATIVE ADDITIVE
- [x] Define interaction ceilings/proc budgets for chained projectile mechanics. — **Status:** ✅ PB1 SECONDARY BUDGET
- [x] Define anti-mandatory-card acceptance criteria for build balance. — **Status:** ✅ 35% CARD-SHARE / 3-BUILD GATE
- [x] Define mobile projectile/effect ceilings from performance data. — **Status:** ✅ PB1 MOBILE HEADROOM

## 2.9 Gate rule

Explosive Rivet and Triple/advanced multishot remain paused while workstreams 3–8 revalidate Power Budget v1. They may resume only after the post-change gameplay/telemetry run confirms that the corrected scalar and chained-mechanic rules still leave usable crowd-clear, enemy pressure and mobile-performance headroom.

## 2.10 PB1 implementation decisions — 🟡 REVALIDATION PENDING

- **Heavy Rivets:** +12% base-relative additive damage per Common level; five Common levels resolve to **1.60x**, not exponential compounding.
- **Overclock:** +12% base-relative fire-rate budget per Common level; five Common levels resolve to **1.60x fire rate** (`390 ms → 243.75 ms`) instead of repeatedly shrinking the already-resolved delay.
- **Twin Riveter:** true two-shot mechanic at both levels; total volley single-target multipliers are **1.20x → 1.40x**, redistributed across two projectiles.
- **Piercing Rivets:** secondary damage is budgeted by additional targets: **+0.30x / +0.60x / +0.90x** for 1/2/3 additional targets when standalone.
- **Ricochet:** PB1 locks **random eligible target selection** rather than nearest-target homing; standalone bounce added-damage budgets are **+0.50x / +0.75x** for 1/2 bounces.
- **Shrapnel Impact:** 2/4 fragments, triggers **once on the first primary impact**, standalone added-damage budgets **+0.50x / +0.70x**; secondary fragments cannot recursively create more shrapnel.
- **Combined crowd mechanics:** maximum standalone request is `0.90 + 0.75 + 0.70 = 2.35x`; when combined, the secondary owner proportionally scales the three mechanics to the shared **+1.50x** ceiling.
- **Ownership:** numeric envelopes live in `src/balance/power-budget.js`; allocation/targeting lives in canonical `ProjectileSystem`; first-impact/non-recursion enforcement lives at the canonical `CombatSystem` boundary.
- Regression contracts have been added for PB1 secondary allocation, reduced ricochet damage/random targeting, pierce secondary damage and first-impact shrapnel ownership. Full suite + production gameplay revalidation remain required before workstreams 3–8 can be marked DONE.

---

# 3. Twenty-three-workstream implementation register

This register is the canonical execution order for the Combat & Build Balance Foundation. Items stay separate so a broad heading cannot hide unfinished work. Section 1 and Section 2 above contain the approved detail for workstreams 1–2; later workstreams receive their detailed decision sections as they are discussed and approved.

| # | Workstream | Current status | Gate / intent |
|---:|---|---|---|
| 1 | Baseline Metrics & automated run telemetry | ✅ COMPLETE | Real D1 telemetry + deterministic scenarios + manual pressure review are frozen as pre-change evidence |
| 2 | Multi-axis Power Budget | ✅ POWER BUDGET V1 DEFINED | `U4-B-PB1` numeric envelopes derived from real baseline data and implemented as the canonical balance reference |
| 3 | Heavy Rivets rebalance | 🟡 IMPLEMENTED / REVALIDATION PENDING | +12% base-relative additive Common scaling; production telemetry revalidation required |
| 4 | Overclock rebalance | 🟡 IMPLEMENTED / REVALIDATION PENDING | Base-relative fire-rate budget replaces exponential delay shrink; production telemetry revalidation required |
| 5 | Twin Riveter rebalance | 🟡 IMPLEMENTED / REVALIDATION PENDING | True two-shot progression with 1.20x → 1.40x total volley budget; no hidden Triple |
| 6 | Piercing Rivets interaction limits | 🟡 IMPLEMENTED / REVALIDATION PENDING | Standalone +0.30/+0.60/+0.90 secondary budget and shared chained-mechanic ceiling |
| 7 | Ricochet interaction limits | 🟡 IMPLEMENTED / REVALIDATION PENDING | Random eligible targeting + reduced bounce damage under shared PB1 secondary budget |
| 8 | Shrapnel Impact interaction limits | 🟡 IMPLEMENTED / REVALIDATION PENDING | 2/4 fragments, first-impact-only trigger, no recursive shrapnel, shared PB1 budget |
| 9 | Explosive Rivet design + integration | ⏸️ PAUSED | Add only after interaction/proc budgets exist; explosion must not freely multiply every impact chain |
| 10 | Triple Riveter / advanced multishot | ⏸️ PAUSED | Separate advanced card after Twin; use volley damage budget and hard projectile ceilings |
| 11 | Canonical requirements / prerequisite resolver | ⚪ PENDING | Runtime must actually enforce prerequisites such as Twin → Triple rather than relying on metadata/hardcode |
| 12 | Weapon/character card compatibility filtering | ⚪ PENDING | Rivet-only cards must not appear for incompatible future weapons/characters |
| 13 | Canonical Weapon Registry / signature-weapon resolution | ⚪ PENDING | Clean deterministic weapon ownership for Runner, Shotgun and future characters |
| 14 | Shotgun Character combat identity | ⚪ PENDING | Define short-range burst/coverage, spread, risk and volley budget without making it Runner-with-more-projectiles |
| 15 | Enemy role/range matchup safety | ⚪ PENDING BASELINE | Verify Rat/Hound/Sawbug remain meaningful against both long-range and future short-range characters |
| 16 | Wave/difficulty scaling vs player power | ⚪ PENDING BASELINE | Rebalance pressure after player multipliers are corrected; do not hide power creep by blindly inflating HP |
| 17 | Rarity identity + power scaling | ⚪ PENDING BASELINE / U7 | Resolve same-card rarity identity and prevent rarity from magnifying already-multiplicative stats excessively |
| 18 | Rig/support damage ownership | ⚪ PENDING | Decouple support balance from ambiguous `primaryWeapon.damage` semantics and future shotgun pellet damage |
| 19 | Armor/stat combat semantics | ⚪ PENDING | Define one canonical mitigation/armor contract before armor becomes a character identity axis |
| 20 | Build identities + anti-mandatory-card validation | ⚪ PENDING BASELINE | Validate multiple viable builds; no Twin/Heavy/Overclock-style automatic pick should dominate unrelated builds |
| 21 | Mobile projectile/effect performance budget | ⚪ PENDING BASELINE | Set hard ceilings from measured active projectiles, fragments, long frames and late-wave pressure |
| 22 | Deterministic interaction matrix / regression scenarios | ⚪ PENDING | Lock reproducible no-upgrade, single-card, pair-synergy and max-power scenarios for before/after comparisons |
| 23 | U4 balance gate + master-roadmap reintegration | ⚪ PENDING | After workstreams 1–22: validate three viable builds, final interaction/performance gate, then merge approved decisions back into `UPGRADE_SYSTEM_2_ROADMAP.md` without deleting protected scope |

### PB1 decision — Ricochet target selection / bounce damage

- PB1 now uses **random selection among eligible in-range enemies** so Ricochet reads as a bounce rather than assisted nearest-target homing.
- Every bounce uses a **reduced secondary-damage coefficient** from the shared chained-mechanic budget; full-damage bounce chains are not allowed.
- The nearest-target mode remains only as an explicit internal mode for controlled tests/future experiments; it is not the current PB1 live default.
- This rule lives in the canonical projectile/combat balance owners and has regression coverage. Production gameplay revalidation is still required before Workstream 7 is DONE.

## Execution rule

- Workstreams **1–2 are complete/defined**; workstreams **3–8 are the active PB1 revalidation gate**.
- The original baseline is frozen as pre-change evidence. New reports are compared against it; they do not replace it.
- Heavy/Overclock/Twin/Pierce/Ricochet/Shrapnel are implemented under PB1 but are **not DONE** until regression verification plus a real production telemetry run confirm pressure, build value and mobile performance.
- Critical Rivet is flagged for post-PB1 revalidation because the crowd/utility baseline showed its level-1 direct contribution was weak; do not change it simultaneously with the first PB1 validation run or attribution will be lost.
- Explosive Rivet and Triple Riveter remain paused behind the PB1 revalidation gate.
- The 23 workstreams are resolved one by one; a workstream becomes `[x]`/DONE only after implementation, automated tests and the required gameplay/production verification pass.

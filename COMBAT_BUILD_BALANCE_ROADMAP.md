# Combat & Build Balance Roadmap

> Canonical execution plan for the Combat & Build Balance Foundation.
>
> This document records approved decisions, implementation gates, validation evidence and future workstreams. Do not erase historical baseline evidence when later workstreams change the game.

---

# 1. Baseline Metrics — ✅ COMPLETE

## 1.1 Purpose

Capture a frozen pre-change reference before changing combat values. Later telemetry is compared against this baseline; it does not replace it.

## 1.2 Required run metrics

- Run duration
- Final wave
- Finish reason
- Level / Scrap
- Kill count / kills per minute
- Damage dealt / damage taken
- Enemy spawn/kill counts
- Time-to-kill samples by enemy
- Projectile counts / path attribution
- Upgrade history / resolved stats
- Performance: frames, frame time, long frames, peak active enemies/projectiles

## 1.3 Telemetry ownership

- Runtime telemetry is first-party and local to Wreckmarch.
- Browser gameplay exposes machine-readable telemetry for Playwright/CI.
- Production reports are stored in Cloudflare D1 and securely bridged to GitHub Issues by OIDC.
- No Firebase/external analytics dependency is required.

## 1.4 Frozen baseline observations

- Early stationary play could survive too long before movement pressure developed.
- Sawbug reliably created movement/dodge pressure once active.
- Rust Hound often died before its attack pattern developed.
- Scalar-heavy builds created excessive late-run screen clear and reduced enemy-pressure visibility.
- Crowd/utility-heavy builds were materially weaker in direct pressure and harder to survive with.

## 1.5 Baseline reference runs

Representative pre-change production telemetry includes:

- 173.153 s run used for early manual pressure review.
- 459.506 s scalar-heavy run: Wave 8, 769 kills, 100.412 KPM, peak active enemies 14 while SURGE cap reached 42.
- 242.157 s crowd/utility-focused run: Wave 5, 309 kills, 76.562 KPM.
- D1/GitHub bridge reference: `RUN-0006` / Issue #138.

## 1.6 Interpretation rule

Do not use one run to justify a large numeric rebalance unless the signal is structurally obvious or reproducible. Use deterministic interaction coverage plus production telemetry together.

## 1.7 Baseline implementation checklist

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

Do not rewrite or reinterpret these baseline values after balance changes. New runs are post-change validation data. The former Explosive Rivet / Triple hold condition was satisfied by production RUN-0026; the frozen pre-change baseline remains the comparison reference.

---

# 2. Power Budget — ✅ APPROVED & PRODUCTION-VALIDATED

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

Additional projectiles redistribute a trigger/volley damage budget; they do not automatically grant 2x/3x full damage. Twin/Triple should increase coverage and mechanical opportunities while keeping single-target growth controlled. The current live Twin/PB1 coefficients are defined in Sections 2.7–2.10; future Triple coefficients must be derived from the same volley-budget rule.

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

The PB1 revalidation hold is **cleared** by RUN-0026 plus the green Quality/Chromium E2E/Smoke gate. Explosive Rivet and Triple/advanced multishot may now enter their own design workstreams, but neither may ship without its own deterministic interaction, production-pressure and mobile-performance acceptance gate.

## 2.10 PB1 implementation decisions — ✅ PRODUCTION REVALIDATED

- **Heavy Rivets:** +12% base-relative additive damage per Common level; five Common levels resolve to **1.60x**, not exponential compounding.
- **Overclock:** +12% base-relative fire-rate budget per Common level; five Common levels resolve to **1.60x fire rate** (`390 ms → 243.75 ms`) instead of repeatedly shrinking the already-resolved delay.
- **Twin Riveter:** true two-shot mechanic at both levels; total volley single-target multipliers are **1.20x → 1.40x**, redistributed across two projectiles.
- **Piercing Rivets:** secondary damage is budgeted by additional targets: **+0.30x / +0.60x / +0.90x** for 1/2/3 additional targets when standalone.
- **Ricochet:** PB1 locks **random eligible target selection** rather than nearest-target homing; standalone bounce added-damage budgets are **+0.50x / +0.75x** for 1/2 bounces.
- **Shrapnel Impact:** 2/4 fragments, triggers **once on the first primary impact**, standalone added-damage budgets **+0.50x / +0.70x**; secondary fragments cannot recursively create more shrapnel.
- **Combined crowd mechanics:** maximum standalone request is `0.90 + 0.75 + 0.70 = 2.35x`; when combined, the secondary owner proportionally scales the three mechanics to the shared **+1.50x** ceiling.
- **Ownership:** numeric envelopes live in `src/balance/power-budget.js`; allocation/targeting lives in canonical `ProjectileSystem`; first-impact/non-recursion enforcement lives at the canonical `CombatSystem` boundary.
- Regression coverage exists for Heavy/Overclock/Twin/Pierce/Ricochet/Shrapnel interactions, deterministic scenarios and browser gameplay paths.

## 2.11 Production revalidation checkpoint — RUN-0026

RUN-0026 is the first post-PB1 high-power production reference accepted for workstreams 3–8.

- Duration **573.0 s**, Wave **10**, Level **20**, **906 kills**, **84,471.8 damage**.
- Average DPS **147.4**; peak 1 s DPS remained bounded relative to the old screen-clear baseline while the run reached additional waves.
- Enemy pressure remains visible instead of being erased: RUN-0026 reached **31 peak active enemies**, versus **14** in the old scalar-heavy baseline.
- Sample median TTK remained readable at approximately **6.48 s Scrap Rat / 5.27 s Rust Hound / 8.81 s Sawbug**, so late-run enemies still have time to express their combat roles.
- Path-attributed damage remained distributed across the build rather than collapsing into one mechanic: Primary **61.1k**, Pierce **10.2k**, Ricochet **4.87k**, Shrapnel **8.54k**.
- **Shrapnel watch item:** Level 1 produced **6,664 fragments** and about **8.54k path-attributed damage (~10% of path-attributed output)**. Performance stayed healthy (`18.6 ms` max frame, zero long frames), so no nerf is justified from this run alone; continue monitoring fragment count/damage in later high-level runs before changing its coefficients.
- **Survivability foundation worked in production:** Field Repair delivered **47.5 healing**; Impact Shield absorbed **1 hit** and prevented **11 damage**. These cards extended mistake tolerance without preventing eventual death.
- No immediate numeric change is approved for **Heavy Rivets, Overclock, Twin Riveter, Piercing Rivets, Ricochet or Shrapnel Impact** from this checkpoint. PB1 values are frozen for the next workstream unless later telemetry produces a repeatable regression.

**Decision:** workstreams **3–8 pass production revalidation**. Future runs may continue to monitor Shrapnel and survivability, but monitoring alone does not keep the PB1 rebalance gate open. Explosive Rivet / advanced multishot may now move forward under the existing PB1 constraints rather than waiting on another scalar rebalance pass.

---

# 3. Twenty-three-workstream implementation register

This register is the canonical execution order for the Combat & Build Balance Foundation. Items stay separate so a broad heading cannot hide unfinished work. Section 1 and Section 2 above contain the approved detail for workstreams 1–2; later workstreams receive their detailed decision sections as they are discussed and approved.

| # | Workstream | Current status | Gate / intent |
|---:|---|---|---|
| 1 | Baseline Metrics & automated run telemetry | ✅ COMPLETE | Real D1 telemetry + deterministic scenarios + manual pressure review are frozen as pre-change evidence |
| 2 | Multi-axis Power Budget | ✅ POWER BUDGET V1 VALIDATED | `U4-B-PB1` passed full CI plus production D1 RUN-0026; values frozen for the next workstream |
| 3 | Heavy Rivets rebalance | ✅ COMPLETE / PROD VALIDATED | +12% base-relative additive scaling passed RUN-0026 high-power stress validation |
| 4 | Overclock rebalance | ✅ COMPLETE / PROD VALIDATED | Base-relative fire-rate budget passed RUN-0026 even with two Legendary + two Rare + one Epic roll |
| 5 | Twin Riveter rebalance | ✅ COMPLETE / PROD VALIDATED | True two-shot 1.20x → 1.40x volley budget passed production validation; no hidden Triple |
| 6 | Piercing Rivets interaction limits | ✅ COMPLETE / PROD VALIDATED | Secondary budget + shared chained-mechanic ceiling passed RUN-0026 |
| 7 | Ricochet interaction limits | ✅ COMPLETE / PROD VALIDATED | Random eligible targeting + reduced bounce damage passed RUN-0026 |
| 8 | Shrapnel Impact interaction limits | ✅ COMPLETE / PROD VALIDATED — MONITOR | PB1 rules passed RUN-0026; monitor high fragment volume before any future coefficient change |
| 9 | Explosive Rivet design + integration | ✅ COMPLETE / PROD D1 VALIDATED | Canonical implementation + live card-pool fix are production-validated; real D1 report `wm-d70dd11a-888a-495c-a1f6-fd9052317a24` acquired Explosive Rivet and recorded bounded non-zero Explosion telemetry with healthy PB1/mobile-pressure signals |
| 10 | Triple Riveter / advanced multishot | 🟡 IMPLEMENTED / GAMEPLAY VALIDATION PENDING | Implemented in PR #188 / main `501f5f3387f90667636bd096e3a884fee17385be`: Twin L2 prerequisite, 3-projectile 1.60x total volley budget, center-only Explosive Rivet arming and full CI/Production deploy passed. Manual Production play did not naturally roll Triple yet, so this workstream stays open only for a future natural Twin L2 → Triple gameplay/D1 validation run. |
| 11 | Canonical requirements / prerequisite resolver | ✅ COMPLETE / CI + PROD DEPLOYED | PR #188 added shared `upgrade-requirements.js`; availability and direct application both enforce canonical requirements, including Twin L2 → Triple, with deterministic regression coverage and Production deployment. |
| 12 | Weapon/character card compatibility filtering | ✅ COMPLETE / CI + PROD DEPLOYED | PR #190 / main `25e28a9931f86ce2373b70793e617608483e2af0` added canonical character/weapon compatibility metadata + resolver. It filters only explicit technical mismatches; valid weak/off-build choices remain allowed. Quality/Smoke/all Chromium shards/E2E and exact-SHA Production verification passed. |
| 13 | Canonical Weapon Registry / signature-weapon resolution | ✅ COMPLETE / CI + PROD DEPLOYED | PR #194 / main `b14c8181f14867c5e6cf0733c1d04fa9effb64fc` centralized canonical weapon ownership and signature-weapon resolution, removed ad-hoc runtime identity fallbacks, and passed Quality/Smoke/Chromium plus Production deployment. |
| 14 | Shotgun Character combat identity | 🟡 WS14-A COMPLETE / WS14-B NUMERIC DECISION PENDING | PR #198 / main `a5aab030f0b86ed17aed22fa62fbfa5252a3a519` added canonical intrinsic `fireProfile` volley architecture with Runner preserved at 1 projectile / 0 spread / 1.0x. Final Shotgun pellet count, spread, cadence, range and volley multiplier remain intentionally unfrozen. |
| 15 | Enemy role/range matchup safety | ⚪ PENDING BASELINE | Verify Rat/Hound/Sawbug remain meaningful against both long-range and future short-range characters |
| 16 | Wave/difficulty scaling vs player power | ⚪ PENDING BASELINE | Rebalance pressure after player multipliers are corrected; do not hide power creep by blindly inflating HP |
| 17 | Rarity identity + power scaling | ⚪ PENDING BASELINE / U7 | Resolve same-card rarity identity and prevent rarity from magnifying already-multiplicative stats excessively |
| 18 | Rig/support damage ownership | ⚪ PENDING | Decouple support balance from ambiguous `primaryWeapon.damage` semantics and future shotgun pellet damage |
| 19 | Armor/stat combat semantics + survivability utility | 🟡 FOUNDATION PROD-VALIDATED / BROADER SEMANTICS PENDING | RUN-0026 verified Field Repair + Impact Shield telemetry; canonical armor-mitigation semantics remain future work |
| 20 | Build identities + anti-mandatory-card validation | ⚪ PENDING BASELINE | Validate multiple viable builds; no Twin/Heavy/Overclock-style automatic pick should dominate unrelated builds |
| 21 | Mobile projectile/effect performance budget | ⚪ PENDING BASELINE | Set hard ceilings from measured active projectiles, fragments, long frames and late-wave pressure |
| 22 | Deterministic interaction matrix / regression scenarios | ⚪ PENDING | Lock reproducible no-upgrade, single-card, pair-synergy and max-power scenarios for before/after comparisons |
| 23 | U4 balance gate + master-roadmap reintegration | ⚪ PENDING | After workstreams 1–22: validate three viable builds, final interaction/performance gate, then merge approved decisions back into `UPGRADE_SYSTEM_2_ROADMAP.md` without deleting protected scope |

### Workstream 9 approved design — Explosive Rivet

**Implementation status:** ✅ COMPLETE / PRODUCTION D1 VALIDATED. The canonical mechanic was merged to `main` as `56d6fa7` after PR #160 (`4a5005f`) passed Quality, Smoke, all three Chromium E2E shards, and merged E2E; later live card-pool / smoke-contract fixes made the card reachable in the final production upgrade flow. Real production D1 report `wm-d70dd11a-888a-495c-a1f6-fd9052317a24` then acquired Explosive Rivet and produced bounded non-zero Explosion telemetry with healthy performance. The card is **not** passive splash on every projectile. It creates a periodic special shot so the player gets a readable crowd-damage event without multiplying the fire-rate budget.

**Core identity**

- **Explosive Rivet = one armed special Rivet every few seconds.**
- The cooldown arms **one** future hero Rivet. If the player does not fire immediately, the armed shot waits; charges do **not** stack.
- After the armed shot is fired, the cooldown restarts. Increasing normal fire rate therefore does not linearly multiply explosion frequency.
- Initial tuning target for implementation/testing:
  - Level 1: arm approximately every **5.0 s**
  - Level 2: approximately **4.5 s**
  - Level 3: approximately **4.0 s**
- Initial explosion damage target: approximately **30–35% of resolved primary projectile damage** before the workstream-specific balance pass.
- Radius/target coverage should grow modestly with level; power should come primarily from **crowd coverage**, not from making it the best single-target DPS card.

**Impact / proc ownership**

- The armed Rivet explodes on its **first valid enemy impact** for immediate readable feedback.
- A single armed projectile may create **exactly one explosion** for its entire lifetime.
- If that projectile later Pierces or Ricochets, it cannot explode again.
- Explosion damage cannot Crit, Pierce, Ricochet, trigger Shrapnel, or recursively create another explosion.
- Explosion hits are secondary damage and must stay inside the PB1 chained/secondary damage model rather than adding an unrestricted new multiplier.
- Shrapnel/Pierce/Ricochet continue to obey their existing canonical owners; Explosive Rivet must not duplicate those systems or add parallel hit ownership.

**Rarity / scaling direction**

- Do not make rarity a pure damage multiplier by default.
- Prefer radius, target-cap, cadence, or other bounded crowd-coverage improvements before large raw-damage scaling.
- Any future control/stagger effect is a separate decision and is **not approved in the first implementation**.

**Visual/performance direction**

- The visual should read as a modified Rivet, not an RPG/grenade: short metallic flash/pressure ring/scrap burst.
- VFX debris is visual only; do not create unnecessary physics projectiles for decoration.
- Mobile projectile/effect ceilings remain binding; this workstream requires a late-wave performance check before DONE.

**Acceptance intent**

- Explosive Rivet should be strongest when enemies are clustered and materially weaker when fighting one isolated target.
- Overclock must not multiply explosion frequency beyond the cooldown cadence.
- Heavy may raise the resolved base used by the explosion, but the secondary coefficient remains bounded.
- The card is not DONE until deterministic interaction tests, Chromium gameplay coverage, CI/Smoke, and a real production telemetry run confirm that explosion count, DPS burst, crowd value, and performance remain inside PB1.

**Implementation / validation record — 2026-09-01**

- [x] Canonical card/mechanical state added as `explosive-rivet`; cadence resolves to **5000 / 4500 / 4000 ms**.
- [x] `WeaponSystem` owns arming/consumption and fires **one armed projectile per trigger/volley**; an armed charge waits without stacking, and Overclock/fire-delay changes do not alter its cadence.
- [x] Twin interaction preserves the existing volley redistribution and arms only one Twin projectile; Heavy raises the pre-Crit resolved primary reference used by Explosion.
- [x] `ProjectileSystem` includes Explosion in the existing **PB1 shared +1.50x chained/secondary budget**, with a bounded **0.33** standalone coefficient and level-bounded radius/target caps.
- [x] `CombatSystem` enforces first-valid-impact and one explosion for the projectile lifetime; Explosion damage is proc-isolated and cannot Crit, Pierce, Ricochet, Shrapnel, or recurse into Explosion.
- [x] Telemetry records `projectiles.explosions`, `projectiles.explosionHits`, `combat.explosionDamageDealt`, and the `explosion` projectile damage/hit path.
- [x] Deterministic/unit coverage added for cadence, no charge stacking, one explosion only, Pierce/Ricochet follow-ups, proc isolation, Overclock, Heavy, Twin, PB1 budget, and telemetry.
- [x] PR #160 SHA `4a5005f`: **Quality ✅**, **Smoke ✅**, Chromium **E2E shards 1/3, 2/3, 3/3 ✅**, merged **E2E ✅**.
- [x] Merged to `main` as `56d6fa7`.
- [x] `56d6fa7` main deployment / **Live Chromium smoke verified green** — the recovery workflow closed Issue #158 at `2026-09-01T17:39:52Z` with “Live Chromium smoke recovered on `56d6fa7`”.
- [x] Complete a real production gameplay run that actually acquires/uses Explosive Rivet. — **Status:** ✅ D1 VALIDATED — report `wm-d70dd11a-888a-495c-a1f6-fd9052317a24` / D1 row 36, received `2026-09-01 20:18:57 UTC`; Explosive Rivet L1 acquired at **114.539 s** and the run ended at **177.284 s**.
- [x] Validate non-zero Explosion telemetry and PB1 crowd/burst/mobile-pressure signals. — **Status:** ✅ PASS — **12 explosions / 11 explosion hits / 65.392 explosion damage**; Explosion path damage **65.392**; average DPS **64.173**, peak 1 s DPS **137.952**; peak active enemies **20** (62.5% of the Wave-3 SURGE cap 32); peak active projectiles **10**; max frame **18.4 ms**; **0 long frames**.
- [x] Validate cadence remains bounded with fire-rate/multishot interactions. — **Status:** ✅ PASS — Overclock L2 was already active before Explosive Rivet, Twin Riveter was acquired later, yet 12 explosions across the **62.745 s** post-acquisition window is approximately **one explosion every 5.23 s**, consistent with the L1 5 s arm cadence plus waiting for the next valid shot rather than fire-rate multiplication.
- [x] Mark Workstream 9 **DONE** after deterministic interaction coverage + CI/Smoke/Live Chromium + real production D1 telemetry all pass. — **Status:** ✅ DONE


### Workstream 10–12 status checkpoint — 2026-09-02

- **WS10 Triple Riveter:** implementation is live; keep OPEN only for natural Production gameplay/D1 validation after Twin Riveter L2. Do not force, guarantee or bias the card into a roll just to close the gate.
- **WS11 Prerequisites:** DONE. Shared requirement resolution owns offer eligibility and direct-application rejection; Twin L2 → Triple is the first production consumer.
- **WS12 Compatibility:** DONE. Shared compatibility resolution filters explicit character/weapon impossibilities only. It is intentionally **not** a recommendation/synergy engine.
- **Next:** WS13 Canonical Weapon Registry / signature-weapon resolution.

### Card-pool philosophy approved for Workstream 12

The upgrade system must **not** behave like a recommendation engine for the player's current build.

- Filter a card only when it is technically invalid, impossible to apply, or incompatible with the active character/weapon/system.
- A card that is valid but currently weak, redundant, off-build, or non-synergistic is still allowed to appear.
- Do not guarantee that every roll contains a useful choice.
- Do not hide Heavy because the player is pursuing fire rate, do not hide defensive cards because the player is pursuing damage, and do not remove crowd cards merely because another crowd path is already stronger.
- Mechanical prerequisites remain real prerequisites: for example, a future Triple upgrade may require Twin if its implementation genuinely depends on Twin.
- Bad/awkward rolls are an intentional part of run variance; only impossible cards are filtered.

### PB1 decision — Ricochet target selection / bounce damage

- PB1 now uses **random selection among eligible in-range enemies** so Ricochet reads as a bounce rather than assisted nearest-target homing.
- Every bounce uses a **reduced secondary-damage coefficient** from the shared chained-mechanic budget; full-damage bounce chains are not allowed.
- The nearest-target mode remains only as an explicit internal mode for controlled tests/future experiments; it is not the current PB1 live default.
- This rule lives in the canonical projectile/combat balance owners and has regression coverage. Production RUN-0026 completed the remaining gameplay gate; Workstream 7 is DONE under PB1.

### Survivability cards roadmap — 🟡 FOUNDATION PROD-VALIDATED / FUTURE EXPANSION PLANNED

Survivability is now a formal build axis alongside single-target damage, crowd clear, mobility and support. The goal is to let a player recover from a limited number of mistakes **without** making stationary/infinite-sustain builds optimal.

**Implemented foundation**

- **Armor Plate:** increases max HP and provides its existing small recovery; it remains separate from the future canonical armor-mitigation stat.
- **Field Repair:** instant bounded recovery — restores **25% max HP at Common**, scales with rarity, and is only offerable while meaningfully damaged.
- **Impact Shield:** Common-only charge card — **1 absorbed hit per charge, maximum 2 stored charges**. Shield absorption is owned by `PlayerDamageSystem`, including Sawbug acid/contact damage.
- **Critical feedback:** critical projectile hits display readable `CRIT! + damage` feedback above the damaged enemy.
- Telemetry now records **healing received**, **shield hits absorbed**, and **shield damage prevented** so survival value can be balanced from real runs instead of guessed.

**Future survivability card candidates — design only, not implemented yet**

- **Emergency Patch:** small one-time heal with stronger value at low HP; must have an offer/trigger gate so it cannot become infinite sustain.
- **Reactive Plating:** short, bounded protection after a shield breaks or after taking a hit; duration/cooldown must be explicit and must not duplicate the future Armor stat.
- **Last Stand:** once-per-run emergency protection/death-prevention candidate; high rarity and strict activation limits required.
- **Wave Resupply:** small heal or shield recharge at a controlled wave milestone; no per-kill healing loop.
- **Mobility survival utility:** temporary escape/movement tools may be explored later as survival value that does not directly add DPS.

**Guardrails for future survival cards**

- No unconditional lifesteal, endless passive regeneration or uncapped permanent percentage mitigation in this phase.
- Healing, shields and mitigation must have a measurable charge, cooldown, rarity, wave, or missing-HP budget.
- Survival cards must not erase Sawbug movement pressure or let Rust Hound/SURGE hits be ignored indefinitely.
- RUN-0026 is the first production reference showing survival utility inside a high-power damage build (47.5 healing + one shield absorption). Continue comparing future survival-heavy and damage-heavy builds before expanding this family substantially.

## Execution rule

- Workstreams **1–9 and 11–13 are complete** under their required gates. Workstream **10 — Triple Riveter / advanced multishot** is implemented and deployed but remains intentionally open for one natural Twin L2 → Triple Production/D1 gameplay validation run; failure to roll it naturally is not treated as a defect and does not block later work. **Workstream 14 is active:** WS14-A architecture is complete in PR #198 / main `a5aab030f0b86ed17aed22fa62fbfa5252a3a519`, while WS14-B is intentionally blocked on approving final Shotgun numeric identity (pellet count, spread, cadence, range and total volley multiplier). Do not invent those values.
- The original baseline is frozen as pre-change evidence. New reports are compared against it; they do not replace it.
- Heavy/Overclock/Twin/Pierce/Ricochet/Shrapnel values are frozen after green regression coverage plus RUN-0026 production validation; do not rebalance them again from a single noisy run.
- Critical Rivet remains an observation item for later rarity/build-diversity work. RUN-0026 reached Critical Rivet 3 without producing a clear standalone reason to change it immediately.
- Explosive Rivet is complete. Triple Riveter is implemented/deployed and no longer blocked by PB1, but Workstream 10 remains open only for its missing natural gameplay/D1 validation evidence.
- The 23 workstreams are resolved one by one; a workstream becomes `[x]`/DONE only after implementation, automated tests and the required gameplay/production verification pass.

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
| 14 | Shotgun Character combat identity | ✅ WS14-B WEAPON FOUNDATION COMPLETE / WS14-C–F CHARACTER WORK DEFERRED | WS14-A established canonical intrinsic `fireProfile`. WS14-B A1 merged in PR #201 / main `b2663805f4f4050278f531fc14b2ec92e283e3d7`: 5 pellets, ±0.24 rad half-spread, 720 ms cadence, 330 range and 1.75x total volley budget. Exact-SHA Pages/live verification passed. The Shotgun is deliberately **not selectable/live yet**. By project decision on 2026-09-02, all remaining character work is parked for later: identity/art (WS14-C), character definition + selection (WS14-D), full activation/validation (WS14-E), and post-activation character-specific expansion (WS14-F). |
| 15 | Enemy role/range matchup safety | ✅ WS15-A RUNNER BASELINE COMPLETE / WS15-B SHORT-RANGE CHECK DEFERRED | PR #205 / main `7de3941f0b56c85cc8c210fca837d932097fc7ad` canonicalized enemy-role ownership without changing validated live behavior. Final head `69ec80db3fe0234070344ed69454c748cb296b07` passed Quality, Smoke, all 3 Chromium shards and aggregate E2E; exact merge SHA passed Pages/live verification. Future short-range-character matchup remains deferred until WS14-E and does not block WS16. |
| 16 | Wave/difficulty scaling vs player power | ✅ COMPLETE / CURRENT CURVE VALIDATED / NO REBALANCE REQUIRED | PR #207 / main `7d35a3239a26be30267d1979057182e39a6e4828` froze the current curve behind deterministic gates without changing gameplay numbers. Final head `3a134e37a34a2e38437264682054feca2b0ce8df` passed Quality, Smoke, all 3 Chromium shards and aggregate E2E; exact merge SHA passed Live verification. Recovery workflow was not applicable because WS16 changed no `index.html`/manifest/runtime shell paths. |
| 17 | Rarity identity + power scaling | ⚪ PENDING BASELINE / U7 | Resolve same-card rarity identity and prevent rarity from magnifying already-multiplicative stats excessively |
| 18 | Rig/support damage ownership | ⚪ PENDING | Decouple support balance from ambiguous `primaryWeapon.damage` semantics and future shotgun pellet damage |
| 19 | Armor/stat combat semantics + survivability utility | 🟡 FOUNDATION PROD-VALIDATED / BROADER SEMANTICS PENDING | RUN-0026 verified Field Repair + Impact Shield telemetry; canonical armor-mitigation semantics remain future work |
| 20 | Build identities + anti-mandatory-card validation | ⚪ PENDING BASELINE | Validate multiple viable builds; no Twin/Heavy/Overclock-style automatic pick should dominate unrelated builds |
| 21 | Mobile projectile/effect performance budget | ⚪ PENDING BASELINE | Set hard ceilings from measured active projectiles, fragments, long frames and late-wave pressure |
| 22 | Deterministic interaction matrix / regression scenarios | ⚪ PENDING | Lock reproducible no-upgrade, single-card, pair-synergy and max-power scenarios for before/after comparisons |
| 23 | U4 balance gate + master-roadmap reintegration | ⚪ PENDING | After workstreams 1–22: validate three viable builds, final interaction/performance gate, then merge approved decisions back into `UPGRADE_SYSTEM_2_ROADMAP.md` without deleting protected scope |

### Workstream 16 validation — Wave / difficulty scaling vs player power

- **✅ COMPLETE / NO NUMERIC REBALANCE REQUIRED:** PR #207 merged as `7d35a3239a26be30267d1979057182e39a6e4828`; final PR head `3a134e37a34a2e38437264682054feca2b0ce8df` passed Quality, Smoke, Chromium E2E shards 1–3 and aggregate E2E.
- RUN-0026 remains the Production reference: Wave 10 Runner Down, 906/929 kills/spawns (~97.5%, below the 98.5% screen-delete red flag), peak active 31/46 (~67.4%, inside preferred 45–70%), final nominal direct power ~3.45x Runner base inside the 2.8–4.25x late envelope.
- The canonical curve remains deliberately non-HP-spongy: Wave 1→10 HP 1.0x→1.9x, damage 1.0x→1.36x, speed 1.0x→1.09x, while threat budget grows 15→46 and spawn interval falls 720→425 ms. Density/cadence/mixed roles/SURGE remain the primary late-game pressure axes.
- Exact merge SHA passed GitHub Pages Live verification. `ios-standalone-recovery.yml` did not run by design because it is path-filtered to `index.html`, `manifest.webmanifest`, and its own workflow file; WS16 changed validation docs/tests only.
- Cross-workstream observations remain parked with their correct owners: peak/average DPS ~3.39 → WS17/WS20; survivability timing → WS19; ~19.13 projectile spawns/s near the 20/s soft cap → WS21.
- **Next active balance workstream: WS17 — Rarity identity + power scaling.**

### Workstream 15 staged delivery — Enemy role / range safety

- **WS15-A — Runner baseline — ✅ COMPLETE / MERGED + PROD DEPLOYED:** PR #205 merged as `7de3941f0b56c85cc8c210fca837d932097fc7ad`. Enemy definitions/behaviors now own enemy movement/combat behavior numbers; Run Balance owns wave timing, spawn weights and threat budgeting; Run Director assigns run role/threat without carrying a second Hound movement identity.
- Deterministic Runner gates preserve the intended roster roles without an unsupported rebalance: Scrap Rat = swarm pressure, Rust Hound = readable hunter with slower chase + faster committed slide, Sawbug = ranged anti-camp pressure.
- Final PR head `69ec80db3fe0234070344ed69454c748cb296b07` passed Quality, Smoke, E2E shards 1/3–3/3 and aggregate E2E. The merged SHA passed GitHub Pages deployment/recovery and live verification.
- **WS15-B — future short-range matchup — ⚪ DEFERRED / NOT NOW:** repeat the matchup review only after the Shotgun character is activated in WS14-E. This deferred gate does **not** block WS16.
- Stop rule remains: do not alter enemy HP, damage, spawn weights, wave pressure or attack coefficients under WS15 without repeatable deterministic or production evidence. WS16 owns wave/difficulty scaling.
- **WS15 handoff:** WS16 is now complete; the current active balance workstream is **WS17 — Rarity identity + power scaling**.

### Workstream 14 staged delivery — Shotgun character

To avoid temporary Runner reskins, patch-over-patch runtime ownership, or a premature selection flow, Workstream 14 is split into explicit delivery gates. **Decision 2026-09-02: all remaining character work below is intentionally deferred; it is recorded here in full so we can return to it later without starting it now.**

- **WS14-A — Intrinsic volley architecture — ✅ COMPLETE:** canonical `fireProfile` support, Runner regression preserved.
- **WS14-B — Shotgun Weapon Foundation — ✅ COMPLETE / MERGED + PROD DEPLOYED:** the approved A1 numeric weapon identity is registered on `main` as `b2663805f4f4050278f531fc14b2ec92e283e3d7`. No selectable character, no temporary Runner sprite, and no start-screen changes were added.
- **WS14-C — Character identity + production art — ⚪ DEFERRED / NOT NOW:** complete the character itself before any live integration.
  - [ ] Final character **name / callsign**.
  - [ ] Short gameplay identity and visual brief: close-range Shotgun specialist, distinct from Runner without changing collision fairness.
  - [ ] Final silhouette, outfit, armor/equipment language, head/face treatment and readable mobile-scale color/value separation.
  - [ ] Approve **one master reference** before animation production; no frame generation from an unapproved design.
  - [ ] Preserve the production frame contract: transparent background, unified canvas/foot line/body scale, no weapon baked into the body sprite. Current target contract is `128×148`, body target about `104×132`, foot line near `Y=140`, unless a later measured art test justifies changing the shared contract.
  - [ ] Produce the minimal base animation set one frame at a time: **Idle/Breathing 0–1 (2 frames)** and **Run 0–2 (3 frames)**.
  - [ ] Validate frame-to-frame body size, feet, head position, arm/grip pose and silhouette consistency before accepting the set.
  - [ ] Define stable **weapon-hand/grip socket**, weapon pivot, muzzle origin and layer ordering so the Shotgun remains a separate weapon layer and does not drift between frames.
  - [ ] Validate left/right facing/mirroring behavior and ensure the hand/grip pose remains believable when the weapon layer rotates/aims.
  - [ ] Add only the additional body animations proven necessary by gameplay after the five-frame base set is tested (for example recoil/hit/death polish); do not inflate the sprite set pre-emptively.
  - [ ] Create character-facing UI art only after the gameplay sprite identity is approved: selection portrait/card image, small icon/avatar and any required HUD portrait.
- **WS14-D — Character definition + selection/start flow — ⚪ DEFERRED / NOT NOW:** add the character as a real selectable entity without rewriting the flow again when more characters arrive.
  - [ ] Create the canonical character definition/ID and signature-weapon ownership entry; no ad-hoc `if shotgunCharacter` runtime branches.
  - [ ] Freeze the character's **unique intrinsic/passive identity** separately from the Shotgun's numeric weapon profile; avoid hiding weapon power inside character stats.
  - [ ] Decide and document base character stats only if they intentionally differ from Runner (HP, movement, pickup/utility, etc.); unchanged stats should inherit canonical defaults rather than copy constants.
  - [ ] Build an extensible pre-run character-selection screen that supports future characters, locked/unlocked states and more than two choices without another UI rewrite.
  - [ ] Show each character's readable identity/signature weapon/trait in the selection UI without turning the upgrade pool into a recommendation engine.
  - [ ] Preserve Runner as the current/default safe path until the new character passes the full activation gate.
  - [ ] Add selection persistence/default/fallback behavior and keyboard/touch/mobile-landscape navigation coverage.
- **WS14-E — Full gameplay integration + activation — ⚪ DEFERRED / NOT NOW:** make the approved character playable only after WS14-C/D are complete.
  - [ ] Connect selected-character resolution to dedicated body art/animations, the canonical Shotgun A1 definition and signature-weapon resolver.
  - [ ] Connect grip/muzzle sockets, aim/facing, projectile spawn, recoil/feedback and weapon/body depth ordering without duplicating Runner combat code.
  - [ ] Apply canonical weapon/character card compatibility filtering: filter impossible cards only; valid weak/off-build choices remain allowed.
  - [ ] Add any **character-specific cards** only through canonical compatibility/prerequisite/power-budget ownership; no one-off runtime patches.
  - [ ] Confirm rig/support damage ownership does not accidentally inherit Shotgun pellet semantics.
  - [ ] Validate enemy matchup safety for Rat/Hound/Sawbug and future ranged pressure so close-range play is viable but not stationary/automatic.
  - [ ] Validate mobile projectile/effect pressure for multi-pellet fire, including active-projectile ceilings, frame time and interaction effects.
  - [ ] Add deterministic tests for Runner vs Shotgun-character selection, weapon resolution, compatibility, animation/sprite fallback and restart/new-run state reset.
  - [ ] Perform the required runtime import/cache-bust **only here**, when live code genuinely depends on the new assets/weapon path.
  - [ ] Pass Quality + Smoke + all Chromium/E2E gates, exact-SHA Pages verification and live mobile-landscape smoke.
  - [ ] Run real Production/D1 gameplay telemetry with the Shotgun character and compare DPS, survivability, range pressure, projectile volume and build diversity against the frozen Runner baseline before marking Workstream 14 DONE.
- **WS14-F — Post-activation character polish / expansion — ⚪ FUTURE AFTER MEASUREMENT:** not required to make the base character playable.
  - [ ] Add extra animation polish only where playtests expose a readability need (fire/recoil, damage reaction, death, selection idle, etc.).
  - [ ] Add Shotgun-specific upgrade cards after the base character is measurable; candidate spaces include bounded spread changes, pellet behavior, close-range reward and periodic/special-shot mechanics.
  - [ ] Evaluate rarity/build identity so Shotgun-specific cards do not become mandatory picks or overpower generic builds.
  - [ ] Add future characters through the same character registry/selection/asset contracts rather than cloning this implementation.

**Activation rule:** WS14-B publishes the canonical Shotgun definition while leaving it unreachable in live gameplay. Runtime import/cache-bust changes are deferred until WS14-E, when a real selectable character depends on the new weapon definition.

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
- **Historical checkpoint:** WS13 Canonical Weapon Registry / signature-weapon resolution is complete; WS15-A and WS16 are also complete. The current active balance workstream is **WS17 — Rarity identity + power scaling**.

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

- Workstreams **1–9, 11–13, WS15-A and WS16 are complete** under their required gates. Workstream **10 — Triple Riveter / advanced multishot** is implemented and deployed but remains intentionally open for one natural Twin L2 → Triple Production/D1 gameplay validation run; failure to roll it naturally is not treated as a defect and does not block later work. **Workstream 14 foundation is parked after WS14-B:** WS14-A architecture and WS14-B A1 weapon foundation are complete on `main` (`b2663805f4f4050278f531fc14b2ec92e283e3d7`), with exact-SHA Pages/live verification passed. WS14-C/D/E/F and WS15-B are explicitly **deferred future character scope**; do not start art generation, make the Shotgun character selectable, reuse Runner art as a shipping placeholder, patch a start screen, or run the short-range matchup gate until we intentionally return to that track. **Current active balance work continues with WS17 — Rarity identity + power scaling.**
- The original baseline is frozen as pre-change evidence. New reports are compared against it; they do not replace it.
- Heavy/Overclock/Twin/Pierce/Ricochet/Shrapnel values are frozen after green regression coverage plus RUN-0026 production validation; do not rebalance them again from a single noisy run.
- Critical Rivet remains an observation item for later rarity/build-diversity work. RUN-0026 reached Critical Rivet 3 without producing a clear standalone reason to change it immediately.
- Explosive Rivet is complete. Triple Riveter is implemented/deployed and no longer blocked by PB1, but Workstream 10 remains open only for its missing natural gameplay/D1 validation evidence.
- The 23 workstreams are resolved one by one; a workstream becomes `[x]`/DONE only after implementation, automated tests and the required gameplay/production verification pass.

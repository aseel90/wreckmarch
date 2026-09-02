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

Do not rewrite or reinterpret these baseline values after balance changes. Use them only as historical comparison points.

---

# 2. Power Budget v1 — ✅ DERIVED FROM BASELINE

## 2.1 Philosophy

Player power should rise enough to feel transformational, but not so quickly that enemy pressure stops mattering. Damage growth and projectile mechanics should create distinct builds without allowing recursive or runaway multiplication.

## 2.2 Runner direct-power reference

Runner base direct reference:

- 24 damage
- 390 ms fire interval
- 61.54 nominal direct DPS

This is the normalization anchor for direct-damage upgrade math unless a future character explicitly defines a different baseline.

## 2.3 Common direct-stat pick budget

A Common direct-stat pick should usually add roughly +12% of Runner base direct power.

Acceptable Common range:

- +8% to +15% of base direct power

Repeated scalar levels are **base-relative additive**, not repeated multiplicative stacking.

## 2.4 Scalar ceilings

- Common single-axis scalar ceiling: `1.60x`
- Common damage × fire-rate combined scalar ceiling: approximately `2.50x`

These are balancing envelopes, not automatic hard clamps in runtime code unless a later workstream explicitly implements a clamp.

## 2.5 Direct-power envelopes

Normalized to Runner base direct DPS:

- Early: `1.0x–1.6x`
- Mid: `1.6x–2.8x`
- Late: `2.8x–4.25x`
- `>4.75x`: red flag requiring explicit evidence

## 2.6 Multishot / added-damage ceilings

Twin volley:

- exactly 2 projectiles
- total single-target power: `1.20x → 1.40x`

Standalone added-damage ceilings:

- Pierce: `+0.90x`
- Ricochet: `+0.75x`
- Shrapnel: `+0.70x`

Combined Pierce + Ricochet + Shrapnel added-damage maximum:

- `+1.50x`

## 2.7 Numeric Power Budget v1 — DERIVED FROM BASELINE

The following values are the accepted first numeric budget for the current Runner build and current enemy curve. They are derived from the frozen telemetry baseline and are not generic constants for all future characters/weapons.

### Direct scalar axis

| Item | Budget |
| --- | --- |
| Runner base direct reference | `24 damage / 390 ms = 61.54 nominal direct DPS` |
| Common direct-stat target | `+12%` of base direct power |
| Common direct-stat acceptable range | `+8%–15%` |
| Repeated scalar levels | base-relative additive, not repeated multiplication |
| Common single-axis scalar ceiling | `1.60x` |
| Common damage × fire-rate combined scalar ceiling | `~2.50x` |
| Early direct-power envelope | `1.0x–1.6x` |
| Mid direct-power envelope | `1.6x–2.8x` |
| Late direct-power envelope | `2.8x–4.25x` |
| Direct-power red flag | `>4.75x` |

### Projectile / secondary path axis

| Mechanic | Budget |
| --- | --- |
| Twin volley | exactly 2 projectiles; total single-target power `1.20x → 1.40x` |
| Secondary proc depth | max 1 |
| Full-strength recursive proc chains | forbidden |
| Pierce standalone added damage | `+0.90x` max |
| Ricochet standalone added damage | `+0.75x` max |
| Shrapnel standalone added damage | `+0.70x` max |
| Pierce + Ricochet + Shrapnel combined added damage | `+1.50x` max |

### Enemy-pressure / mobile-performance axis

| Item | Budget |
| --- | --- |
| Late SURGE active-enemy utilization | at least `40%`; preferably `45–70%` |
| Sustained projectile spawns | `≤20/s` provisional |
| One-second projectile burst | `≤40` provisional |
| Peak active projectiles | `≤48` provisional |
| Long frames | target `0` |

The mobile projectile/effect values above are intentionally provisional until WS21 completes Production validation. Exceeding one of them is not an automatic balance failure if frame timing remains healthy.

## 2.8 Power-budget interpretation rules

- Do not mechanically maximize all axes at once.
- A build may intentionally be strong on one axis if it gives up another.
- Secondary mechanics must not recursively multiply themselves at full strength.
- A single upgrade should not become mandatory across unrelated builds.
- Mobile performance constraints are part of the balance budget, not an afterthought.

## 2.9 Build-diversity gate

Before closing the wider U4 balance pass:

- no one card should account for more than 35% of final direct-power budget across unrelated builds
- at least three distinct Wave-8-capable archetypes must be demonstrated

WS20 now satisfies the three-archetype Production evidence requirement. The 35% direct-power attribution ceiling remains part of the final U4 gate.

---

# 3. Workstream Register

| # | Workstream | Status | Scope |
| ---: | --- | --- | --- |
| 1 | Baseline Metrics | ✅ COMPLETE | Frozen pre-change telemetry and gameplay-pressure reference |
| 2 | Multi-axis Power Budget | ✅ COMPLETE | Numeric direct/secondary/performance envelopes derived from baseline |
| 3 | Heavy Rivets | ✅ COMPLETE | Damage scalar card and budget validation |
| 4 | Overclock | ✅ COMPLETE | Fire-rate scalar card and budget validation |
| 5 | Twin Riveter | ✅ COMPLETE | Two-projectile identity and budget validation |
| 6 | Piercing | ✅ COMPLETE | One-depth pierce path and attribution |
| 7 | Ricochet | ✅ COMPLETE | One-depth ricochet path and attribution |
| 8 | Shrapnel | ✅ COMPLETE | Secondary fragment path and bounded added-damage identity |
| 9 | Explosive Rivet | ✅ COMPLETE / PROD-VALIDATED | Timed explosive shot identity, VFX and Production D1 evidence |
| 10 | Triple Riveter / advanced multishot | 🟡 IMPLEMENTED / NATURAL PROD VALIDATION OPEN | Implemented and deployed; intentionally waiting for a natural Twin L2 → Triple Production roll. Lack of a natural roll is not a defect and does not block later work. |
| 11 | Requirements / prerequisite resolver | ✅ COMPLETE | Canonical upgrade prerequisites and level requirements |
| 12 | Compatibility filtering | ✅ COMPLETE | Filters only technically invalid/impossible cards; does not steer random offers toward the current build |
| 13 | Weapon registry | ✅ COMPLETE | Canonical weapon ownership and stat resolution |
| 14 | Shotgun character | ⏸️ DEFERRED | Character activation/art explicitly deferred; do not start WS14-C/D/E/F without returning to that track |
| 15 | Enemy role/range matchup | ✅ COMPLETE | Role/range pressure baseline and validation |
| 16 | Wave/difficulty scaling | ✅ COMPLETE | Current non-HP-spongy curve frozen behind deterministic and Production evidence |
| 17 | Rarity identity + power scaling | ✅ COMPLETE | Rarity budget/identity locked with deterministic coverage |
| 18 | Rig/support damage ownership | ✅ COMPLETE | Support damage ownership decoupled from ambiguous primary-weapon semantics |
| 19 | Armor/stat combat semantics + survivability utility | ✅ COMPLETE | Armor/stat semantics and survivability utility locked with Production evidence |
| 20 | Build identities + anti-mandatory-card validation | ✅ COMPLETE / PROD-VALIDATED | Three Production-valid archetypes accepted with RNG-tolerant classification; incidental off-build picks remain allowed and card offers remain random |
| 21 | Mobile projectile/effect performance budget | 🟠 AUTOMATED FOUNDATION COMPLETE / PROD RUN PENDING | Main now measures spawn-rate plus active hero/shrapnel/support pressure and has a deterministic evaluator; one representative high-pressure Production report is still required before closing WS21 |
| 22 | Deterministic interaction matrix / regression scenarios | ⚪ PENDING | Lock reproducible no-upgrade, single-card, pair-synergy and max-power scenarios for before/after comparisons |
| 23 | U4 balance gate + master-roadmap reintegration | ⚪ PENDING | After workstreams 1–22: validate three viable builds, final interaction/performance gate, then merge approved decisions back into `UPGRADE_SYSTEM_2_ROADMAP.md` without deleting protected scope |

### Workstream 21 foundation — Mobile projectile / effect performance budget

- **🟠 AUTOMATED FOUNDATION COMPLETE / PRODUCTION VALIDATION PENDING:** PR #237 merged the measurement-only telemetry foundation to `main` (`7d1ce0c4ae8887823c54f0f71d4ad1ab98e477a8`), and PR #240 merged the deterministic budget evaluator (`c7f9ac768f07319684fa33553bc563779c51d178`). The telemetry owns frame time, long-frame count, peak active enemies/projectiles, average projectile spawns/s, peak projectile spawns in any observed 1-second bucket, and peak active hero/shrapnel/support projectile counts.
- **Provisional PB1 ceilings remain evidence targets, not automatic nerf triggers:** sustained projectile spawns ≤20/s, 1-second burst ≤40, peak active projectiles ≤48, and target 0 long frames (>=33.34 ms). A Production run may challenge these numbers; WS21 must identify the real bottleneck before changing gameplay.
- **Known pressure evidence:** the frozen WS16 Production reference reached ~19.13 projectile spawns/s, close to the current sustained soft cap, which is why WS21 must separate hero fire, Shrapnel fragments and support projectiles instead of treating all pressure as one total.
- **Stop rule:** do not change fire rate, projectile count, Shrapnel count, Explosive Rivet cadence, enemy pressure, RNG/card offers, or visual quality under WS21 until repeatable telemetry shows which budget is actually exceeded and correlates it with long-frame pressure.
- **Validation order:** deterministic telemetry regression ✅ → CI/Smoke/E2E ✅ → Production run with a projectile-heavy late build ⏳ → compare average/peak spawn rate, peak active counts, long frames and frame-spike context → only then decide whether a gameplay/VFX optimization is required.
- **Evaluator rule locked on `main`:** crossing provisional `20/s`, `40 burst`, or `48 active` limits with `0` long frames means review the provisional ceiling first, not nerf gameplay. Long-frame pressure must be attributed to its owner (hero/Shrapnel/support/effect context) before optimization.
- **Transport verified structurally:** D1 stores the complete report as `report_json`, so WS21 performance fields require no D1 migration and are preserved end-to-end. The RUN issue summary is being extended to surface these metrics directly while the full JSON remains authoritative.

### Workstream 16 validation — Wave / difficulty scaling vs player power

- **✅ COMPLETE / NO NUMERIC REBALANCE REQUIRED:** PR #207 merged as `7d35a3239a26be30267d1979057182e39a6e4828`; final PR head `3a134e37a34a2e38437264682054feca2b0ce8df` passed Quality, Smoke, Chromium E2E shards 1–3 and aggregate E2E.
- RUN-0026 remains the Production reference: Wave 10 Runner Down, 906/929 kills/spawns (~97.5%, below the 98.5% screen-delete red flag), peak active 31/46 (~67.4%, inside preferred 45–70%), final nominal direct power ~3.45x Runner base inside the 2.8–4.25x late envelope.
- The canonical curve remains deliberately non-HP-spongy: Wave 1→10 HP 1.0x→1.9x, damage 1.0x→1.36x, speed 1.0x→1.09x, while threat budget grows 15→46 and spawn interval falls 720→425 ms. Density/cadence/mixed roles/SURGE remain the primary late-game pressure axes.
- Exact merge SHA passed GitHub Pages Live verification. `ios-standalone-recovery.yml` did not run by design because it is path-filtered to `index.html`, `manifest.webmanifest`, and its own workflow file; WS16 changed validation docs/tests only.
- Cross-workstream observations remain parked with their correct owners: peak/average DPS ~3.39 → WS17/WS20; survivability timing → WS19; ~19.13 projectile spawns/s near the 20/s soft cap → WS21.
- **Next active balance workstream: WS17 — Rarity identity + power scaling.**

### Workstream 15 staged delivery — Enemy role / range safety

- **WS15-A — Runner baseline — ✅ COMPLETE / MERGED**
- **WS15-B — ranged enemy baseline — ✅ COMPLETE / MERGED**
- **WS15-C — mixed-role deterministic validation — ✅ COMPLETE / MERGED**

### Workstream 17 validation — Rarity identity + power scaling

- **✅ COMPLETE:** deterministic rarity budget tests lock the intended rarity identity without altering random offer behavior.

### Workstream 18 validation — Rig/support damage ownership

- **✅ COMPLETE:** support damage attribution is owned independently of ambiguous primary-weapon damage semantics.

### Workstream 19 validation — Armor/stat combat semantics + survivability utility

- **✅ COMPLETE / PROD-VALIDATED:** survivability semantics are frozen behind deterministic coverage and Production telemetry.

### Workstream 20 validation — Build identities + anti-mandatory-card gate

- **✅ COMPLETE / 3-of-3 Production archetypes validated.**
- Production classification is RNG-tolerant: incidental off-build side picks do not invalidate an otherwise coherent build identity.
- Card offers remain fully random among technically valid cards. No weighting or steering toward the player's current build was introduced.
- One-card direct-power attribution is still capped at 35% for the final U4 gate.

---

# 4. Protected Design Rules

These rules survive all balance workstreams unless explicitly reopened:

- Card offers remain random among technically valid cards.
- A card may be weak, redundant, off-build or useless to the current run and still be a valid offer.
- Only technically invalid, impossible or incompatible cards are filtered.
- Do not force cards to appear for validation convenience.
- Do not treat failure to naturally roll a specific card as a gameplay defect.
- Do not apply patch-on-patch runtime ownership hacks when canonical ownership can be fixed directly.
- Do not use one noisy Production run to justify a large global rebalance.
- Do not reduce visual/gameplay chaos simply to satisfy a guessed mobile ceiling; measure the real bottleneck first.

---

# 5. Next execution order

1. Close WS21 with one representative high-pressure Production report using the new telemetry.
2. Execute WS22 deterministic interaction matrix / regression scenarios.
3. Execute WS23 final U4 gate and reintegrate approved decisions into the master Upgrade System 2 roadmap.
4. Keep Triple Riveter natural Production validation open opportunistically; it does not block WS21–23.
5. Keep Shotgun character activation/art deferred unless explicitly reopened.

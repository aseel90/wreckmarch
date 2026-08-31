# Wreckmarch — Combat & Build Balance Decision Roadmap

> **Status:** Active implementation roadmap — U4-B balance foundation in progress
> **Purpose:** Capture the Combat/Balance decisions approved with the project owner before implementation resumes.
> **Relationship to master roadmap:** `UPGRADE_SYSTEM_2_ROADMAP.md` remains the protected Upgrade System 2.0 master roadmap. This document is a cumulative decision/amendment roadmap and must not replace or delete any approved master-roadmap scope. After the design review is complete, the approved decisions will be merged back into the appropriate U4/U7/master-roadmap sections in a controlled update.
> **Implementation rule:** Approval of a design decision does **not** mean implementation is complete. Implementation checkboxes remain `[ ]` until code, automated tests and the required game verification pass.

---

## Decision status legend

- **✅ APPROVED DESIGN** — discussed and accepted; safe to use as an implementation requirement.
- **🟨 UNDER DISCUSSION** — currently being reviewed; not yet an implementation requirement.
- **⚪ NOT DISCUSSED** — analysis topic not yet reviewed with the project owner.
- **✅ IMPLEMENTED** — code/tests/verification completed; only then may an implementation checkbox become `[x]`.

---

# 1. Baseline Metrics — ✅ APPROVED DESIGN

## 1.1 Goal

Before nerfing/buffing cards, changing enemies/waves, or adding Explosive Rivet / advanced multishot, measure what the current game actually does.

This phase is **measurement-only**. It establishes the current baseline; it does not decide the desired power level. Desired numeric limits belong to the later Power Budget decision.

## 1.2 Canonical telemetry architecture

- Use one canonical `RunTelemetry` / `CombatTelemetry` responsibility rather than scattering permanent counters through gameplay systems.
- Gameplay systems report facts/events; telemetry observes and aggregates them.
- Telemetry must never become a second combat owner and must never mutate gameplay state.
- Candidate canonical event sources include:
  - RunDirector → wave/run-state transitions.
  - WeaponSystem → triggers/projectile-fire facts.
  - Projectile/Combat layer → hits, damage and mechanical-effect facts.
  - EnemySystem → spawn/death/active-pressure facts.
  - UpgradeRuntime → offered/acquired upgrade facts.
  - Browser/performance owner → frame timing / long-frame facts where practical.

## 1.3 Local/CI first — no Firebase dependency now

**Approved rule:** U4 balance telemetry must work locally and in Playwright/CI without Firebase, a backend, or any external analytics service.

A provider boundary such as `TelemetryProvider` should exist so a lightweight production provider can be added later without importing Firebase/vendor code into WeaponSystem, EnemySystem, RunDirector, UpgradeRuntime or other gameplay owners.

Firebase is therefore a **future optional production analytics provider**, not a current dependency and not a blocker for balance work.

## 1.4 Development/CI vs production telemetry

### Development / CI

Detailed diagnostics are allowed, including projectile/mechanical counters and performance context needed to diagnose build multiplication.

### Future production analytics

Keep remote analytics compact and privacy-conscious. Suitable run-summary events may include:

- run started/completed/died;
- wave reached;
- coarse run duration;
- upgrades/levels/rarities chosen;
- coarse build/result summary;
- death reason/category where canonically available.

Do **not** send one remote analytics event for every projectile, hit, ricochet, shrapnel fragment, crit or frame.

## 1.5 Minimum baseline report

### Run / wave progression

- run duration;
- wave start/end timestamps;
- highest/completed wave;
- player-level timeline;
- upgrade-pick timestamps.

### Player combat throughput

- total damage dealt;
- actual DPS over useful windows;
- trigger/fire count;
- projectile count;
- successful hits and misses where reliably measurable;
- critical-hit count.

### Kills / enemy pressure

- total kills and kills/minute;
- kills by enemy type;
- time-to-kill samples/summary for Scrap Rat, Rust Hound and Sawbug;
- spawned enemies by type;
- active-enemy count over time;
- peak active enemies;
- effective spawn pressure/rate.

### Survivability

- damage taken;
- player hit count;
- remaining HP;
- death time/source/category where canonical data exists.

### Upgrade/build record

- acquired card IDs;
- level after each acquisition;
- rarity history;
- acquisition order/timestamp;
- resolved build snapshot at useful checkpoints/end of run.

### Mechanical/projectile activity

- peak active projectiles;
- projectile spawn rate / peak spawn window;
- pierce activity;
- ricochets;
- shrapnel fragments;
- critical outcomes;
- future explosion counters only after Explosive Rivet exists.

### Performance

- browser-appropriate frame-time summary where practical;
- long-frame/frame-spike count;
- active enemy/projectile context around significant spikes where practical.

The report must be machine-readable (for example JSON) and accessible to Playwright/CI without scraping visible UI text.

## 1.5A Automatic run submission

- Balance-test runs submit their finalized report automatically when the run ends normally or the player dies; no manual submit button is required.
- Each accepted remote report receives a stable sequential display label such as `RUN-0001`, `RUN-0002`, `RUN-0003`, generated server-side to avoid client-side collisions.
- The game records locally during play and sends one finalized run summary at the end, rather than streaming per-shot/per-hit events remotely.
- Submission failure must not affect gameplay or destroy the local report; failed reports remain locally recoverable for retry/debugging.
- Remote submission uses an isolated Wreckmarch telemetry endpoint/provider. No GitHub credential may ship in the game client.
- Remote submission is opt-in for balance-test sessions (`?wmTelemetry=1` or an explicit runtime override); ordinary public visits remain local/CI-only and do not generate GitHub run-report traffic.
- The remote transport is the isolated `wreckmarch-run-reports` Cloudflare Worker + D1. GitHub Issue forwarding uses a GitHub Actions OIDC bridge with built-in `GITHUB_TOKEN`, so no user PAT is required in the game or Worker.

## 1.6 Deterministic balance scenarios

Balance comparisons must not depend on a lucky random run. Use controlled RNG/seed and controlled upgrade acquisition so the same scenario can be replayed before and after a balance change.

The initial diagnostic suite should include equivalents of:

- `BASELINE_RUNNER_NO_UPGRADES`
- `TWIN_ONLY`
- `HEAVY_ONLY`
- `OVERCLOCK_ONLY`
- `HEAVY_OVERCLOCK`
- `TWIN_SHRAPNEL`
- `TWIN_PIERCE_RICOCHET`
- `CURRENT_MAX_POWER_BUILD`

Exact scenario names may change during implementation. The requirement is repeatability and useful coverage, not these literal strings.

## 1.7 Manual gameplay-pressure review

Automated DPS alone is insufficient. A representative manual gameplay review should also answer:

- Does the player still need to move regularly?
- Can a strong build stand still for long periods without meaningful risk?
- Does SURGE feel materially more dangerous than BUILD?
- Does Rust Hound still force dodge/reposition decisions?
- Does Sawbug still discourage stationary play?
- Do late waves become more engaging, or are enemies erased before pressure develops?
- Is the late-game build readable and performant on the mobile target?

These observations complement telemetry; they do not replace it.

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
- [ ] Verify secure OIDC Worker → GitHub Issue bridge on `main` and one real `RUN-####` Issue. — **Status:** 🔵 IN PROGRESS — no PAT required
- [ ] Implement the initial deterministic balance-scenario suite. — **Status:** ⚪ NOT IMPLEMENTED
- [x] Verify the telemetry change does not alter current gameplay/balance values. — **Status:** ✅ VERIFIED — PR #118 Quality/Smoke/E2E all passed; no card/enemy/wave/damage values changed
- [x] Verify no Firebase/external analytics dependency is required. — **Status:** ✅ VERIFIED
- [ ] Capture the first real baseline reports before applying balance changes. — **Status:** ⚪ NEXT GATE
- [ ] Complete the manual gameplay-pressure review. — **Status:** ⚪ NOT IMPLEMENTED

## 1.9 gate rule

**Baseline Metrics records what Wreckmarch does now. It does not yet decide what Wreckmarch should do.**

No balance nerf/buff should be justified from this new balance pass until the baseline has been captured and reviewed. Explosive Rivet and Triple/advanced multishot remain paused while the Combat & Build Balance Foundation is being defined.

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

## 2.7 Numeric-gate rule

Exact DPS, TTK, Twin/Triple coefficients, card values and wave targets are **not approved yet**. They must be derived after Baseline Metrics produce repeatable data.

## 2.8 Power-budget implementation checklist

- [ ] Capture Baseline Metrics before changing numeric balance. — **Status:** ⚪ BLOCKED ON SECTION 1 IMPLEMENTATION
- [ ] Define target single-target / crowd / burst / safety / survivability envelopes from baseline data. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Define a canonical trigger/volley damage-budget model for multishot weapons. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Define anti-exponential stacking rules for repeated card levels. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Define interaction ceilings/proc budgets for chained projectile mechanics. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Define anti-mandatory-card acceptance criteria for build balance. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Define mobile projectile/effect ceilings from performance data. — **Status:** ⚪ NOT IMPLEMENTED

## 2.9 Gate rule

Explosive Rivet and Triple/advanced multishot remain paused until Baseline Metrics exist and the numeric Power Budget is derived from those measurements.

---

# 3. Twenty-three-workstream implementation register

This register is the canonical execution order for the Combat & Build Balance Foundation. Items stay separate so a broad heading cannot hide unfinished work. Section 1 and Section 2 above contain the approved detail for workstreams 1–2; later workstreams receive their detailed decision sections as they are discussed and approved.

| # | Workstream | Current status | Gate / intent |
|---:|---|---|---|
| 1 | Baseline Metrics & automated run telemetry | 🔵 IN PROGRESS | Core telemetry is live; secure OIDC bridge verification, first real baseline runs + deterministic scenario suite remain before balance changes |
| 2 | Multi-axis Power Budget | ✅ APPROVED DESIGN / ⚪ NUMBERS PENDING | Derive numeric envelopes only after baseline data |
| 3 | Heavy Rivets rebalance | ⚪ PENDING BASELINE | Remove unintended exponential/hidden multiplication while preserving heavy-hit identity |
| 4 | Overclock rebalance | ⚪ PENDING BASELINE | Rework fire-delay stacking into a readable fire-rate budget |
| 5 | Twin Riveter rebalance | ⚪ PENDING BASELINE | Twin becomes true two-shot progression with controlled volley damage; no hidden Triple at level 2 |
| 6 | Piercing Rivets interaction limits | ⚪ PENDING BASELINE | Measure and cap downstream impact multiplication without deleting penetration identity |
| 7 | Ricochet interaction limits | ⚪ PENDING BASELINE | Control bounce/proc multiplication and keep target-selection behavior readable |
| 8 | Shrapnel Impact interaction limits | ⚪ PENDING BASELINE | Bound fragment count, secondary damage and recursion/performance cost |
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

### Open design note — Ricochet target selection / bounce damage

User gameplay note captured during live balance testing:

- Current ricochet behavior should **not be treated as final**.
- Preferred option to test first: a bounced rivet chooses its next valid target **randomly among eligible enemies** rather than always homing to the nearest enemy, so the mechanic reads as a true ricochet instead of assisted auto-targeting.
- Alternative if nearest-target guidance is retained: each bounce must use a **reduced secondary-damage coefficient** so guided ricochets do not become free full-damage chain DPS.
- Final choice is deferred to **Workstream 7 — Ricochet interaction limits** after Baseline Metrics are available. Compare both options for readability, crowd-clear value, single-target leakage, proc-chain multiplication and mobile projectile cost before locking numbers.
- Do not implement this as an ad-hoc patch inside projectile code; the final rule must live in the canonical projectile/combat balance owner with automated regression coverage.

## Execution rule

- Workstream 1 is the active implementation gate.
- No numeric nerf/buff to workstreams 3–8 or 15–21 should be finalized before the first baseline dataset is captured and reviewed.
- Explosive Rivet and Triple Riveter remain paused behind this foundation.
- The 23 workstreams are resolved one by one; a workstream becomes `[x]`/DONE only after implementation, automated tests and the required gameplay/production verification pass.

# Wreckmarch — Combat & Build Balance Decision Roadmap

> **Status:** Active design-decision roadmap
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
- The intended first remote transport is an isolated Cloudflare Worker that forwards validated finalized reports to GitHub, without modifying unrelated Cloudflare Workers/Pages/DNS projects.

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

- [ ] Identify canonical telemetry event/reporting touchpoints without duplicate gameplay ownership. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Implement the telemetry provider/no-op boundary. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Implement local/CI run telemetry aggregation. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Add structured run/wave metrics. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Add combat/kills/survivability metrics. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Add upgrade/build-history metrics. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Add projectile/mechanical counters. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Add browser-appropriate performance metrics. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Expose a machine-readable run report to deterministic Playwright scenarios. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Implement automatic end-of-run/death submission with server-assigned sequential `RUN-####` labels and local failure recovery. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Implement the initial deterministic balance-scenario suite. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Verify normal gameplay remains unchanged when telemetry is disabled/no-op. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Verify no Firebase/external analytics dependency is required. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Capture the first baseline reports before applying balance changes. — **Status:** ⚪ NOT IMPLEMENTED
- [ ] Complete the manual gameplay-pressure review. — **Status:** ⚪ NOT IMPLEMENTED

## 1.9 Gate rule

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

# Remaining analysis topics — ⚪ NOT DISCUSSED

These headings intentionally reserve the analysis sequence; their contents will be written only after discussion and approval so the roadmap records decisions rather than assumptions.

- Existing-card rebalance (Heavy / Overclock / Twin and interaction scaling).
- Projectile/mechanical interaction limits (Pierce / Ricochet / Shrapnel / future Explosion).
- Requirements/prerequisites and Triple Riveter progression.
- Weapon/character compatibility filtering.
- Weapon Registry / signature-weapon architecture for future characters.
- Shotgun Character combat identity and damage-budget model.
- Enemy roles, ranges and future-character matchup safety.
- Wave/difficulty scaling relative to player power.
- Rarity identity/scaling.
- Rig/support damage ownership and compatibility.
- Armor/stat semantics and future character survivability.
- Build identities and anti-mandatory-card rules.
- Mobile projectile/performance ceilings.
- Final U4/U7 integration and verification gates.

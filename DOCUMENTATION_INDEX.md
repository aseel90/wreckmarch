# WRECKMARCH — Documentation Index & Authority Map

**Status:** ACTIVE DOCUMENTATION ROUTER  
**Last reconciled:** 2026-09-04  
**Purpose:** Prevent an old phase/status file from being mistaken for the current development priority.

## 1. Read these first

1. `README.md` — product overview and current top-level production priority.
2. `IMPLEMENTATION_STATUS.md` — current implemented/superseded/planned state.
3. This file — tells whether a document is **active**, **contract/baseline**, **closed historical evidence**, or **future gated roadmap**.

If documents appear to conflict, prefer the newer explicit closeout/current-status statement and the canonical ownership contract for the system being changed. Do not reopen a closed roadmap from an older unchecked/handoff sentence without a reproducible regression or an explicitly approved scope change.

## 2. Active next production track

### WS14 Shotgun Character

- `COMBAT_BUILD_BALANCE_ROADMAP.md` — completed scalar WS1–WS23 baselines remain frozen; the staged Shotgun character track is the current return path.
- `WS14_SHOTGUN_IDENTITY.md` — approved Shotgun weapon/character identity direction.
- `WS14_B_DECISION_GATE.md` — closed numeric weapon-foundation decision.
- `WS14_C_CHARACTER_ART_GATE.md` — **art foundation complete**; records the accepted 2-idle/3-run body set, separate weapon art and locked-preview constraints.
- `WS14_C_SHOTGUN_ART_CONTRACT.md` — art/socket/layering contract for the Shotgun character.
- `CHARACTER_OWNERSHIP_AUDIT.md` — canonical CharacterRegistry / selection / availability / entitlement ownership guardrails.
- `UPGRADE_SYSTEM_2_CHARACTER_WEAPON_POLICY.md` — compatibility boundary for character/weapon-specific upgrade behavior.

Current remaining order: **approve canonical Shotgun character gameplay definition → register/integrate while locked → real Production full-run approval → selectable activation → WS15-B**. `shotgun-production-gate.js` is the executable readiness boundary; the Shotgun must not become selectable while any blocker remains.

## 3. Active cross-cutting contracts

- `docs/ARCHITECTURE.md` — high-level current architecture.
- `TESTING_AND_DEPLOYMENT_POLICY.md` — Quality / Smoke / sharded Chromium E2E / aggregate / Pages / Live policy.
- `WORKSHOP_PROGRESSION_CONTRACT.md` — persistent entitlement/progression ownership; purchase entitlement must not bypass production availability.
- `LEADERBOARD_SCORE_CONTRACT.md` — future leaderboard score/source contract; implementation remains deferred.
- `WRECKMARCH_BALANCE_SPEC.md` — run/director balance contract.
- `WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md` + `WRECKMARCH_ENEMY_ROSTER.md` — enemy production and accepted roster contracts.

## 4. Closed production baselines — do not reopen casually

### Upgrade System 2.0 — ✅ CLOSED

- `UPGRADE_SYSTEM_2_ROADMAP.md` — final closeout roadmap; PR #326 / `298ea21f1c89ea553fe05feb1b733c01f8a7efbf`.
- `UPGRADE_SYSTEM_2_CORE_REFERENCE.md` — canonical reference for the closed architecture.
- `UPGRADE_SYSTEM_2_U0_AUDIT.md` — historical ownership audit.
- `UPGRADE_SYSTEM_2_U4_PROGRESS.md` — historical U4 implementation ledger.

Final Production evidence: `wm-51c5cbaa-211d-489b-b0c1-a3ad54a178cc`, 794.244s, Wave 10.

### Combat & Build Balance scalar work — ✅ CLOSED BASELINE

- `COMBAT_BUILD_BALANCE_ROADMAP_CLOSEOUT_NOTE.md`
- `WS10_WS21_PRODUCTION_CLOSEOUT.md`
- `WS15_ENEMY_ROLE_BASELINE.md`
- `WS16_WAVE_DIFFICULTY_BASELINE.md`
- `WS17_RARITY_POWER_BASELINE.md`
- `WS18_RIG_SUPPORT_DAMAGE_OWNERSHIP.md`
- `WS19_ARMOR_SURVIVABILITY_SEMANTICS.md`
- `WS20_BUILD_DIVERSITY_BASELINE.md`
- `WS21_MOBILE_PROJECTILE_PERFORMANCE_BASELINE.md`
- `WS22_DETERMINISTIC_INTERACTION_MATRIX.md`
- `WS23_U4_BALANCE_REINTEGRATION_GATE.md`

These remain regression boundaries while the Shotgun character production gate proceeds.

### Responsive frontend remediation — ✅ CLOSED

- `RESPONSIVE_FRONTEND_AUDIT.md` — historical diagnosis.
- `RESPONSIVE_FRONTEND_CLOSEOUT.md` — authoritative remediation closeout.
- `UI_POLISH_STATUS.md` — historical UI status snapshot.

## 5. Historical phase snapshots

These explain how the current architecture was reached; they are not the current priority selector:

- `PHASE_B_ARCHITECTURE.md`
- `PHASE_C5_STATUS.md`
- `PHASE_D1_STATUS.md`
- `PHASE_E1_STATUS.md`
- `PHASE_E1B_STATUS.md`
- `PHASE_F0_STATUS.md`
- `GAMEPLAY_REDESIGN_PLAN.md` — contains important design/screen history and contracts, but use `README.md` + `IMPLEMENTATION_STATUS.md` for current priority.

## 6. Future gated roadmap

- `FUTURE_RUN_WORLD_ENCOUNTER_ROADMAP.md` — **R0 PARTIALLY SATISFIED**.

Current R0 state:

- Repair/stability: ✅ closed.
- Upgrade System 2.0: ✅ closed.
- Quality/E2E/Smoke/Live: ✅ green standing gate.
- Shotgun character production/activation: ⬜ remaining R0 blocker; WS14-C art is complete, but gameplay definition and full-run approval still gate activation.

Do not begin the large 25-minute world/encounter expansion merely because later content is attractive; activate R1 only after R0 is fully closed.

## 7. Documentation maintenance rule

Every meaningful development batch must update `IMPLEMENTATION_STATUS.md`. When a roadmap closes or the active priority changes, update this index and the relevant roadmap handoff in the same documentation batch. Preserve historical evidence, but label it as historical instead of deleting it or allowing it to remain an ambiguous current instruction.

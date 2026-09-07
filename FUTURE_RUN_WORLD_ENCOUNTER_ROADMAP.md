# WRECKMARCH — Future Run / World / Encounter Roadmap

> Canonical roadmap for the long-run world and encounter expansion. Existing production systems remain authoritative unless a milestone below explicitly replaces ownership.

## Core direction

WRECKMARCH grows from the current short-run survivor arena into a wasteland journey with a target encounter-progression timeline of roughly 25 minutes. Upgrade choices, Boss intros/fights and recovery windows may extend real wall-clock duration beyond the timeline target.

The expansion must preserve deterministic ownership, mobile readability, bounded active objects, and the current character/combat foundations. Do not stack patch owners over canonical systems.

---

## 1. Future run timeline contract

The encounter timeline owns milestones and events. It must not scatter `if minute === ...` logic through runtime files.

A milestone may temporarily suspend or defer random events while a Boss arena or recovery window is active. Therefore `~25:00` means the Final Boss target on the encounter-progression timeline; real wall-clock play may be somewhat longer.

This prevents cases such as E08 or a random Event spawning inside the Roadbreaker arena merely because the wall clock crossed another timestamp.

---

## 2. World-size contract — R2 closed

### Selected Production world

Production is locked to one world:

`9600 × 9600 world units` (`production-9600-v1`)

The comparison candidates are not Production configuration:

- `7200 × 7200` — debug/comparison only.
- `9600 × 9600` comparison candidate — debug/comparison only; Production uses its own `production-9600-v1` identity.
- `12000 × 12000` — debug/comparison only.

### Technical streaming contract

R2 technical sectors own streaming/activation:

- canonical terrain owner: `r2-world-sector-terrain`
- sector size: `1200`
- Production grid: `8 × 8 = 64`
- max active sectors around the player: `9`
- no full-map terrain allocation

The `1200` sector size is a technical streaming partition only. It does **not** define R3 district semantics.

### R3 semantic boundary

R3 districts are semantic world-layout/art-direction metadata. They may span arbitrary technical sectors, but they must not become a competing streaming or terrain owner.

The current `r2-world-sector-terrain` renderer reads district metadata for the active technical sector. District props and landmarks are created only while their sector is active. No full-map district renderer or full-map prop allocation is allowed.

### Proposed districts / location identity

The world should remain open enough for survivor movement, but have memorable regions and landmarks:

1. **Central Wreckroads** — starting region / broken road junctions.
2. **Scrap Fields** — wreck piles, stripped vehicles, open sight lines.
3. **Collapsed Highway** — split asphalt, ramps, concrete wreckage.
4. **Rust Depot** — industrial storage / loading yard shapes.
5. **Chemical Yard** — pipes, tanks, acid-contaminated visual language.
6. **Burned Convoy Zone** — destroyed trucks, barricades, long road lanes.
7. **Marshal Territory** — late-run controlled wasteland / final-boss identity.

Do not turn these into a maze. Roads, clearings and traversable open ground remain dominant.

### Landmarks

Each district needs large readable landmarks so the player can remember location without a minimap being mandatory: major wrecks / convoy remains, industrial towers, collapsed overpasses, pipe/tank clusters, road checkpoints and unique scrap structures.

### Boss-capable clearings

The large world must deliberately include broad spaces suitable for temporary Boss Arena locks: highway interchange, scrapyard/depot clearing, convoy intersection, industrial loading yard, Marshal checkpoint, or equivalent.

Boss encounters happen inside the same world and run, not by loading an unrelated separate scene.

---

## 3. Enemy-role roster and visual read

Enemy expansion must be role-driven rather than raw HP inflation. Preserve existing production enemies first, then add roles through the Encounter Director milestone. Normal compositions should remain readable on mobile and respect bounded ranged/artillery pressure.

---

## 4. Boss and encounter ownership

Boss infrastructure is built before major Boss content. Arena locking is temporary and happens inside the same streamed world. Encounter Director owns pressure changes around milestones, special encounters and recovery windows.

---

# Implementation milestones

## Prerequisites

- [x] close the current Character Ownership / character-production work,
- [x] close the active Upgrade System 2.0 work scheduled ahead of this roadmap,
- [x] keep Quality / E2E / Smoke / Live green.

Reason: do not stack a major world/enemy expansion over unresolved ownership or frontend/runtime migrations.

---

## R1 — Future-run data contract + telemetry baseline

- [x] define canonical `RunAct / EncounterMilestone / EncounterEvent` data structures,
- [x] retain current 10-wave curve as regression/reference scenario,
- [x] add timeline diagnostics for current act, next milestone, event and encounter state,
- [x] extend telemetry fields needed for 25-minute runs before balancing content,
- [x] add deterministic tests for milestone ordering and no duplicate ownership.

**Exit gate:** the future run can be described by data without hard-coded `if minute === ...` logic scattered through runtime files.

---

## R2 — Large-world streaming / activation foundation — CLOSED

- [x] test `7200 / 9600 / 12000` world candidates,
- [x] select `9600 × 9600` as the one Production world (`production-9600-v1`),
- [x] implement `1200` technical sector activation (`8 × 8 = 64`, max active `9`) around the player,
- [x] keep enemy/projectile/world-coordinate ownership canonical,
- [x] keep `r2-world-sector-terrain` as the canonical terrain owner,
- [x] prove no full-map object simulation/allocation is required,
- [x] mobile Landscape live test during real Physics cross-sector travel,
- [x] verify seam render continuity separately from the real movement proof,
- [x] keep `7200` and `12000` debug/comparison-only.

**Exit gate: PASSED.** Live Production held `81` active terrain objects at peak (below the required `100` bound), kept `9` active sectors, crossed a real Physics seam without activation artifacts, and rendered continuous terrain/roads after the seam with `fullMapTerrainAllocated = false`.

Live evidence is recorded in Issue #378.

---

## R3 — Districts, landmarks and Boss clearings

- [ ] Central Wreckroads,
- [ ] Scrap Fields,
- [ ] Collapsed Highway,
- [ ] Rust Depot,
- [ ] Chemical Yard,
- [ ] Burned Convoy Zone,
- [ ] Marshal Territory,
- [ ] add memorable landmark language,
- [ ] create multiple Boss-capable open clearings,
- [ ] ensure road/open-ground navigation remains readable,
- [ ] preserve `r2-world-sector-terrain` as the only terrain owner,
- [ ] prove district metadata/props allocate only for active sectors,
- [ ] pass Landscape `844×390`, DPR 2, mobile/touch Live visual QA.

**Architecture:** `src/world/world-district-contract.js` is the canonical semantic owner. R2 sectors remain streaming/activation; R3 districts remain semantic layout/art direction. The contract maps all 64 Production sectors to exactly one district, owns landmarks and Boss-clearing metadata, and is consumed by the existing active-sector terrain renderer.

**Exit gate:** the large map feels like a journey between visually distinct regions rather than a larger empty brown rectangle. This gate is visual and cannot be closed by unit tests alone.

---

## R4 — Encounter Director v2 + five-Act pacing

- [ ] canonical threat-budget owner,
- [ ] role-budget rules (`4–5` normal roles, `<=2` ranged, `<=1` artillery target),
- [ ] fixed milestone scheduling + weighted-random event scheduling,
- [ ] no consecutive duplicate event rule,
- [ ] recovery-window support,
- [ ] Director can lower/suspend pressure for special encounters,
- [ ] preserve compatibility with existing E01/E02/E03 production enemies first.

**Exit gate:** a long simulation changes encounter composition without relying on raw HP inflation or uncontrolled density.

---

## R5 — Boss Encounter Controller + temporary Arena Lock

Build infrastructure **before** building the major Bosses.

- [ ] same-world temporary arena boundary,
- [ ] Encounter Director pause/reduction hooks,
- [ ] Boss intro / active / defeat / recovery states,
- [ ] arena cleanup and normal-world resume,
- [ ] deterministic telemetry for Boss state transitions.

**Exit gate:** a placeholder Boss can lock a valid R3 clearing, run its lifecycle and return the player to the same world/run without ownership leaks.

---

## R6+ — Content expansion and long-run balance

Add enemy roles, milestone encounters, Boss content, reward pacing and final-run balance only after R1–R5 ownership foundations are stable. Every milestone continues to require Quality, E2E, Smoke and Live validation before merge.

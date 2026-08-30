# Wreckmarch — Upgrade System 2.0 Roadmap

Status: **Approved implementation roadmap**

Rule: a checkbox becomes `[x]` only after the task is implemented **and tested in the actual game**.

Last status review: **2026-08-30**

## Status legend
- **✅ DONE** — implemented and verified.
- **🟡 IMPLEMENTED / LIVE VERIFY** — code is on `main` and automated checks passed, but the deployed build still needs a confirmed Live Chromium pass before the milestone is closed.
- **🔵 IN PROGRESS** — active implementation/migration work is underway.
- **⚪ NOT STARTED** — no implementation work has begun.
- **⏸️ DEFERRED** — intentionally outside the current phase.
- **🧭 ACTIVE POLICY** — governing rule/policy, not a one-time implementation task.
- **🧹 POST-MIGRATION** — cleanup that must happen after callers are migrated and parity is verified.

---

# 1. Core architecture rule — NO PATCH-ON-PATCH

Upgrade System 2.0 must not become another chronological runtime layer.

Mandatory rules:

- one canonical owner per gameplay responsibility
- no `*-fix`, `*-hotfix`, `*-v2`, `*-v3` when a canonical repair/refactor is the proper solution
- new Upgrade System 2.0 logic goes into focused canonical modules
- character identity/stats → `src/characters/`
- weapons/combat → canonical combat/weapon layer
- upgrades → `src/upgrades/`
- run-time resolved stats → one resolver/state owner
- UI displays values; UI does not own gameplay values
- art/animation code does not redefine gameplay identity
- migrate all callers before retiring old logic
- remove old duplicate logic after migration
- split by responsibility, not by phase number
- keep a playable build stable during migrations
- add regression tests for character identity/assets, weapon ownership, upgrade application, stat resolution

Target layout:

```text
src/characters/
  character-registry.js
  character-system.js
  definitions/runner.js

src/combat/
  weapon-system.js
  projectile-system.js

src/upgrades/
  upgrade-registry.js
  upgrade-rarities.js
  upgrade-offer-system.js
  definitions/

src/stats/
  stat-resolver.js
```

---

# 2. Current gameplay baseline to preserve

- Runner/Hunter: 100 HP
- base movement speed: 255
- hard movement speed cap: 280
- run target: ~10 minutes / ~10 waves
- auto-target / auto-fire preserved
- primary weapon owns damage, fire delay/rate, projectile speed, range, muzzle behavior
- upgrade cards currently track levels/availability
- elite reward design refers to minimum RARE
- Rig/Fortress upgrade entries are disabled/reserved
- Robot Dog future progression stays outside this phase

Existing card set includes:

- Heavy Rivets
- Overclock
- Long Barrel
- Twin Riveter
- Fleet Feet
- Scrap Magnet
- Armor Plate
- disabled Rig cards

---

# 3. U0 — Audit and ownership

- [x] Map current character/weapon/upgrade/run stat ownership. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE
- [x] Identify duplicate/patch ownership relevant to this work. — **Status:** ✅ DONE
- [x] Establish regression baseline/tests. `tests/unit/upgrade-system-u0-baseline.test.ts`. — **Status:** ✅ DONE

---

# 4. U1 — Character + weapon + stat architecture

Goal: create deterministic canonical ownership before moving cards.

Character work:

- [ ] Extend character definition contract. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Preserve Runner 100 HP / 255 base speed. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Add starting weapon reference. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Add combat-stat profile. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Add passive slot/config. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Ensure visuals cannot override selected identity. — **Status:** 🔵 IN PROGRESS
- [ ] Regression: Runner resolves Runner assets/stats. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Regression: second character cannot mutate Runner. — **Status:** ⚪ NOT STARTED

Stats work:

- [x] Audit variables and current mutation paths. — **Status:** ✅ DONE
- [ ] Document canonical owner for Character / Weapon / Run values. — **Status:** 🔵 IN PROGRESS
- [ ] Implement deterministic stat resolver. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Remove duplicate ownership after all callers migrate. — **Status:** 🧹 POST-MIGRATION

Testing:

- [ ] Unit/integration checks for character + stat resolver. — **Status:** 🔵 IN PROGRESS
- [ ] Real playable build after migration group. — **Status:** ⚪ NOT STARTED
- [ ] Full suite before phase completion. — **Status:** ⚪ NOT STARTED

---

# 5. Stat resolution contract

Target resolution order:

1. base value
2. flat modifiers
3. additive percentages
4. multiplicative percentages
5. override/special transforms
6. min/max caps

Requirements:

- deterministic regardless of caller order
- immutable base definitions
- upgrade effects stored as modifiers, not direct permanent mutation where avoidable
- explicit domain ownership (`character`, `weapon`, later run-wide)
- compatibility mirrors allowed only temporarily while old callers migrate

---

# 6. Upgrade Registry — data-driven cards

Goal: replace runtime-owned card gameplay data with canonical definitions.

Schema fields should support:

- `id`
- `name`
- `description`
- `rarity`
- `maxLevel`
- `scope`
- `tags`
- `requirements`
- `weight`
- `offerRules`
- stat `modifiers[]`
- optional `mechanicalEffect`
- `artId`

Rules:

- Registry owns card definitions.
- Runtime applies card definitions.
- Offer system reads Registry data.
- Presentation consumes definition data but does not redefine effects.
- Definitions must be validated before registration.

**Do not migrate all cards in one destructive rewrite.**

- Build registry.
- Migrate a small number of existing cards.
- Test real gameplay.
- Continue card-by-card/group-by-group.
- Remove old duplicate implementation only when migrated behavior is verified.

- [x] Create canonical Upgrade Registry. — **Status:** ✅ DONE
- [x] Define upgrade schema. — **Status:** ✅ DONE
- [x] Add validation for invalid definitions. — **Status:** ✅ DONE
- [ ] Migrate Heavy Rivets as first numeric reference card. — **Status:** 🔵 IN PROGRESS
- [ ] Verify Heavy Rivets gameplay parity. — **Status:** 🔵 IN PROGRESS
  - Heavy Rivets migration note: canonical definition/registry/runtime adapter implemented; Phase C and Phase C1 now share one apply path. Local parity check passed; final checkbox waits for CI + deployed Chromium verification.
- [ ] Migrate Overclock. — **Status:** ⚪ NOT STARTED
- [ ] Migrate Long Barrel. — **Status:** ⚪ NOT STARTED
- [ ] Migrate Twin Riveter. — **Status:** ⚪ NOT STARTED
- [ ] Migrate Fleet Feet. — **Status:** ⚪ NOT STARTED
- [ ] Migrate Scrap Magnet. — **Status:** ⚪ NOT STARTED
- [ ] Migrate Armor Plate. — **Status:** ⚪ NOT STARTED
- [ ] Decide temporary handling of Call the Rig without expanding old Rig system. — **Status:** ⚪ NOT STARTED
- [ ] Remove/deactivate obsolete duplicate card definitions after migration. — **Status:** 🧹 POST-MIGRATION

---

# 7. Rarity system

Target rarities:

- `COMMON`
- `RARE`
- `EPIC`
- `LEGENDARY`

Rarity must affect more than border color. It can control:

- offer weight
- numerical strength
- max level or cap shape
- special mechanics
- prerequisite availability

Implementation deferred until Registry migration establishes one definition path.

---

# 8. Level / duplicate / prerequisite rules

Requirements:

- no offering a maxed upgrade
- predictable duplicate behavior
- explicit prerequisites
- tags usable by later synergy system
- elite guarantees still work after migration

Do not hide these rules in the UI layer.

---

# 9. Offer system

Target owner: `src/upgrades/upgrade-offer-system.js`.

Responsibilities:

- filter eligible Registry entries
- enforce max levels
- apply prerequisites
- weighted selection
- rarity weighting
- elite minimum-rarity guarantee
- no duplicate cards in one offer unless intentionally configured

---

# 10. New Hunter build pool

Only after the old pool is migrated and stable.

Target: roughly 10–12 cards, enough for recognizable build identities without bloating early runs.

Potential build groups:

- Heavy / penetration
- Fire-rate / volume
- Range / projectile speed
- mobility / pickup
- armor / survivability
- crit only when combat layer supports it cleanly
- mechanical projectile changes only incrementally

No massive card dump in one commit.

---

# 11. Mechanical upgrades

Examples may include:

- penetration
- ricochet
- explosive rivets
- additional projectile behavior

Rules:

- do not encode mechanics in card UI files
- mechanic belongs to combat/projectile systems
- Registry references a stable mechanic/effect ID/config
- add dedicated tests for each mechanic

---

# 12. Crit support

Crit is deferred until combat architecture can support:

- canonical crit chance
- canonical crit multiplier
- deterministic damage resolution
- UI reporting from resolved run stats
- tests proving ordinary shots and crit shots share the same damage owner

Do not fake crit via random mutation in an upgrade card callback.

---

# 13. Upgrade card visual overhaul

This happens after gameplay ownership is migrated.

Goals:

- keep the approved compact icon direction
- rarity treatment must be clear but not overpower gameplay
- title / description / level / rarity are data-driven
- art references Registry IDs
- later UI layer does not re-implement gameplay data

Existing C3/C5/D1 presentation layers should be retired or collapsed only after the canonical presentation path is ready.

---

# 14. Run stats / build panel

Goal: show the real effective build, not stale mirrors.

Expose resolved values such as:

- HP
- movement speed
- weapon damage
- fire delay / rate
- projectile speed
- range
- pickup radius
- armor
- crit chance / multiplier when implemented

Current progress:

- resolved run stat object exists — **Status:** 🔵 IN PROGRESS
- final build panel — **Status:** ⚪ NOT STARTED

---

# 15. Balance target

Target run remains approximately 10 minutes / 10 waves.

Balance only after architecture is stable enough to avoid tuning duplicated values.

Key checks:

- Heavy build
- fire-rate build
- movement/utility build
- survivability build
- no single card mandatory every run
- no runaway fire-rate / projectile count performance collapse

---

# 16. Mobile / performance

Verify:

- Chromium desktop
- landscape mobile viewport
- no runaway projectile count
- no upgrade UI overflow
- no repeated expensive Registry reconstruction per frame
- no visual layers owning gameplay state

---

# 17. Deferred systems

The following stay outside Upgrade System 2.0 initial migration:

- synergies
- evolutions
- extra playable characters
- Robot Dog implementation/cards
- permanent progression
- large status-effect framework

Prepare clean extension points; do not implement these early.

---

# 18. Definition of Done

Upgrade System 2.0 initial milestone is complete when:

- Runner starts with correct identity/stats/assets
- character, weapon, run-stat and upgrade ownership each have one canonical path
- existing cards are migrated
- multiple real builds are possible
- rarity/levels/prerequisites behave predictably
- displayed stats match actual combat behavior
- mobile/desktop performance remains acceptable
- a full ~10-minute run is playable
- obsolete patch ownership is removed
- tests pass
- checklist reflects the real repository state

---

# 19. Working discipline

1. Read this roadmap before each migration group.
2. Work the next unchecked subphase only.
3. Prefer canonical-owner changes over patches.
4. Test the change.
5. Only then mark `[x]`.
6. Commit code + checklist update together when practical.

---

# 20. Testing policy

Mandatory layers:

- unit tests for Registry/schema/resolver
- integration tests for runtime application
- Chromium smoke before deploy
- deployed Chromium smoke after Pages deploy
- targeted gameplay E2E where the migration changes real card behavior

Existing unrelated flaky tests must be tracked separately and not used as an excuse to bypass the specific migration gate.

---

# 21. CI / deployment gate

Current deployment workflow requirements:

- `quality` runs `pnpm check`
- `smoke` runs Chromium browser smoke locally
- `deploy` requires `quality` + `smoke`
- `live-smoke` runs after Pages deployment
- failure diagnostics collect browser events

The full E2E job remains valuable, but deployment itself is gated by `quality` + `smoke`. Existing Sawbug/older enemy E2E instability is tracked separately.

---

# 21.1. Chromium live deployment gate

This is the official production verification gate described in `TESTING_AND_DEPLOYMENT_POLICY.md`.

- [x] Adopt Playwright Chromium as the canonical automated browser. — **Status:** ✅ DONE
- [x] Run Chromium smoke in CI before deployment. — **Status:** ✅ DONE
- [x] Run Live Chromium smoke after GitHub Pages deployment. — **Status:** ✅ DONE
- [x] Collect `console.error`, `pageerror`, and `requestfailed`. — **Status:** ✅ DONE
- [x] Save live-smoke diagnostics as workflow artifacts on failure. — **Status:** ✅ DONE
- [x] Open/update one deduplicated GitHub Issue when deployed `main` fails. — **Status:** ✅ DONE
- [x] Auto-close the live-smoke Issue after a later successful deployed `main`. — **Status:** ✅ DONE
- [ ] Confirm a successful post-deploy Live Chromium run on the current `main`. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY

---

# 22. Cleanup / architecture debt pass

Do this only after migration groups prove parity.

For each touched responsibility:

1. establish canonical owner
2. redirect callers
3. verify behavior
4. remove duplicate ownership
5. remove obsolete import/runtime layer if safe

Do not attempt repo-wide chronological-layer deletion in one pass.

---

# 23. Implementation order — DO NOT SKIP AHEAD

## Phase U0 — Audit and ownership
- [x] Map current character/weapon/upgrade/run stat ownership. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE
- [x] Identify duplicate/patch ownership relevant to this work. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE
- [x] Establish regression baseline/tests. See `tests/unit/upgrade-system-u0-baseline.test.ts`. — **Status:** ✅ DONE

## Phase U1 — Character + weapon + stat architecture
- [ ] Extend Runner character contract safely. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Add starting weapon/passive/combat profile support. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Define Character vs Weapon vs Run stat ownership. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Implement deterministic stat resolution. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY
- [ ] Preserve current gameplay parity. — **Status:** 🟡 IMPLEMENTED / LIVE VERIFY

## Phase U2 — Upgrade Registry migration
- [x] Create Upgrade Registry/schema. — **Status:** ✅ DONE
- [ ] Migrate existing cards incrementally. — **Status:** 🔵 IN PROGRESS
- [ ] Remove old duplicate ownership after verification. — **Status:** 🧹 POST-MIGRATION

## Phase U3 — Rarity + levels + offer rules
- [ ] Implement rarity. — **Status:** ⚪ NOT STARTED
- [ ] Implement max-level/duplicate rules. — **Status:** ⚪ NOT STARTED
- [ ] Implement tags/scopes/prerequisites. — **Status:** ⚪ NOT STARTED
- [ ] Preserve elite reward guarantees. — **Status:** ⚪ NOT STARTED

## Phase U4 — New Hunter build cards
- [ ] Finalize 10–12-card initial pool. — **Status:** ⚪ NOT STARTED
- [ ] Add mechanical projectile upgrades incrementally. — **Status:** ⚪ NOT STARTED
- [ ] Add crit only with combat integration/tests. — **Status:** ⚪ NOT STARTED
- [ ] Verify at least 3 viable build identities. — **Status:** ⚪ NOT STARTED

## Phase U5 — Card visual overhaul
- [ ] Move presentation to one canonical card renderer. — **Status:** ⚪ NOT STARTED
- [ ] Preserve compact icon direction. — **Status:** ⚪ NOT STARTED
- [ ] Make rarity data-driven. — **Status:** ⚪ NOT STARTED
- [ ] Retire old presentation ownership after parity. — **Status:** 🧹 POST-MIGRATION

## Phase U6 — Run stats / build panel
- [ ] Expose resolved stats cleanly. — **Status:** 🔵 IN PROGRESS
- [ ] Build stats/build panel. — **Status:** ⚪ NOT STARTED
- [ ] Verify displayed values equal actual combat values. — **Status:** ⚪ NOT STARTED

## Phase U7 — Balance + cleanup
- [ ] Tune builds after migration. — **Status:** ⚪ NOT STARTED
- [ ] Verify full 10-minute run. — **Status:** ⚪ NOT STARTED
- [ ] Remove obsolete patch ownership. — **Status:** 🧹 POST-MIGRATION
- [ ] Final regression pass. — **Status:** ⚪ NOT STARTED

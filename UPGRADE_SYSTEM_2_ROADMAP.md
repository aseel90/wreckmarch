# Wreckmarch — Upgrade System 2.0 Roadmap

> **Status:** Approved implementation roadmap  
> **Scope:** Character stats, weapon stats, run stats, upgrade cards, rarity, build identity, UI and future extensibility.  
> **Rule:** This document is the implementation checklist. A checkbox becomes `[x]` only after the feature is implemented **and tested in the actual game**.

---
## Status legend

Every checklist item carries a current implementation state:

- **✅ DONE** — completed and verified at the level required for that task.
- **🟡 IMPLEMENTED / LIVE VERIFY** — code is on `main` and automated checks passed, but the deployed build still needs a confirmed Live Chromium pass before the milestone is closed.
- **🔵 IN PROGRESS** — partially implemented or intentionally transitional.
- **⚪ NOT STARTED** — planned but implementation has not started.
- **⏸️ DEFERRED** — intentionally outside the current active phase.
- **🧭 ACTIVE POLICY** — an architectural rule currently enforced during development; it remains visible rather than being treated as a one-time feature.
- **🧹 POST-MIGRATION** — cleanup that becomes actionable only after the replacement path is verified.

> **Last status review:** 2026-08-30. Statuses describe the actual repository state on `main`; they do not count intention as completion.

---

## 0. Core development rule — NO PATCH-ON-PATCH

Wreckmarch must not grow through temporary runtime patches layered over older patches.

Past development showed that duplicated ownership and late runtime overrides can cause regressions such as the wrong character/art appearing, one system silently replacing another, or multiple files trying to control the same feature.

### Mandatory architecture rules

- [ ] Every gameplay responsibility must have **one canonical owner**. — **Status:** 🧭 ACTIVE POLICY
- [ ] Do not create `*-fix`, `*-hotfix`, `*-v2`, `*-v3`, or additional phase patch files when the correct solution is to repair/refactor the canonical system. — **Status:** 🧭 ACTIVE POLICY
- [ ] New Upgrade System 2.0 logic must live in focused canonical modules, not inside new runtime monkey-patches. — **Status:** 🧭 ACTIVE POLICY
- [ ] Character identity/stats belong to `src/characters/`. — **Status:** 🔵 IN PROGRESS
- [ ] Weapon definitions and weapon behavior belong to the canonical combat/weapon layer. — **Status:** 🔵 IN PROGRESS
- [ ] Upgrade definitions and upgrade selection must have one dedicated upgrade module/folder. — **Status:** 🔵 IN PROGRESS
- [ ] Run-time resolved stats must have one canonical resolver/state owner. — **Status:** 🔵 IN PROGRESS
- [ ] UI may display state but must not secretly own gameplay values. — **Status:** 🔵 IN PROGRESS
- [ ] Art/animation loaders must not redefine character gameplay identity. — **Status:** 🔵 IN PROGRESS
- [ ] Before replacing old logic, identify all callers and migrate them; do not leave two active implementations. — **Status:** 🧭 ACTIVE POLICY
- [ ] After migration, remove/deactivate obsolete duplicated logic rather than leaving it as an active fallback. — **Status:** 🧭 ACTIVE POLICY
- [ ] Keep files focused and reasonably sized. Split by responsibility, not by chronological phase number. — **Status:** 🧭 ACTIVE POLICY
- [ ] Every architectural migration must preserve the currently playable build until the replacement is verified. — **Status:** 🧭 ACTIVE POLICY
- [ ] Regression tests must specifically protect character identity, selected character assets, weapon ownership, upgrade application, and stat resolution. — **Status:** 🔵 IN PROGRESS

### Target ownership map

```text
src/characters/
  character-registry.js       -> registered playable characters
  character-system.js         -> character creation/selection contract
  definitions/runner.js       -> Runner/Hunter canonical definition

src/combat/
  weapon-system.js            -> weapon runtime behavior
  projectile-system.js        -> projectile runtime behavior
  ...                         -> combat resolution

src/upgrades/                 -> NEW canonical Upgrade System 2.0 home
  upgrade-registry.js
  upgrade-rarities.js
  upgrade-offer-system.js
  definitions/

src/stats/                    -> NEW only if needed after refactor review
  stat-resolver.js            -> one deterministic final-stat calculation path
```

The exact filenames may be adjusted during implementation if the existing architecture suggests a cleaner fit, but **ownership must remain singular and explicit**.

---

# 1. Current game baseline — preserve this

These values/features are taken from the current game and are the starting point, not arbitrary replacements.

- Runner/Hunter currently has **100 HP**.
- Runner/Hunter base movement speed is **255**.
- Current movement hard cap is **280**.
- Current run target is approximately **10 minutes / 10 waves**.
- Auto-target / auto-fire is part of the current combat identity and must remain supported.
- Current primary weapon already owns damage, fire delay/rate, projectile speed, range and muzzle behavior.
- Current cards already track levels and availability.
- Elite reward design already references a minimum `RARE` rarity concept.
- Existing Fortress/Rig upgrade entries are disabled and must not drive this phase.
- Robot Dog / future companion progression is explicitly outside the implementation scope of this phase.

### Existing upgrade baseline

Current cards include concepts such as:

- Heavy Rivets
- Overclock
- Long Barrel
- Twin Riveter
- Fleet Feet
- Scrap Magnet
- Armor Plate
- Call the Rig / disabled Rig-related upgrades

Upgrade System 2.0 must migrate working cards safely rather than deleting working gameplay and rebuilding everything at once.

---

# 2. Design model

The long-term build pipeline is:

```text
CHARACTER
  Base Stats
  Combat Profile
  Passive
  Starting Weapon
       |
       v
WEAPON
  Base weapon stats
  Projectile behavior
       |
       v
UPGRADES
  Numeric modifiers
  Mechanical modifiers
  Rarity / levels / requirements
       |
       v
STAT RESOLVER + RUN STATE
       |
       v
COMBAT
```

Future extensions:

```text
Character-specific cards
Weapon-specific cards
General cards
        ↓
Synergies
        ↓
Evolutions
        ↓
Future Companion / Robot Dog upgrade pool
```

---

# 3. Character identity and stats

Each playable character must eventually be more than a skin.

A character definition should support:

- `id`
- display identity
- base HP
- movement speed
- combat-stat modifiers
- starting weapon ID
- passive ID/config
- character-specific upgrade tags/pool
- physics/collision configuration where appropriate
- canonical visual/animation references without allowing visuals to redefine gameplay identity

## Runner/Hunter role

Runner/Hunter remains the **baseline balanced character** while this system is built.

Do not rebalance the existing game around invented example numbers. Preserve current values first, then tune intentionally.

### Candidate combat stats

These are architecture targets, not all finalized balance values:

- Max HP
- Move Speed
- Armor
- Critical Chance
- Critical Damage multiplier
- Pickup Radius modifier
- optional future recovery/utility modifiers

### Critical hit note

Crit is a **new combat capability**, not merely an existing number to expose.

Candidate starting balance for testing only:

- Crit Chance: `5%`
- Crit Damage: `x1.5`

These values are not final until tested.

- [x] Extend character definition contract without breaking Runner. — **Status:** ✅ DONE
- [x] Preserve Runner 100 HP / 255 base speed baseline. — **Status:** ✅ DONE
- [x] Add starting weapon reference to character definition. — **Status:** ✅ DONE
- [x] Add combat-stat profile support. — **Status:** ✅ DONE
- [x] Add passive slot/config support without requiring a strong Runner passive yet. — **Status:** ✅ DONE
- [ ] Ensure character visuals cannot override selected character identity. — **Status:** 🔵 IN PROGRESS
- [x] Add regression test: Runner definition always resolves to Runner assets/stats. — **Status:** ✅ DONE
- [ ] Add regression test: adding a future second character cannot mutate Runner definition. — **Status:** ⚪ NOT STARTED

---

# 4. Character stats vs weapon stats vs run state

Do not mix these domains.

## Character / combat stats

Examples:

- HP / Max HP
- Move Speed
- Armor
- Crit Chance
- Crit Damage
- Pickup modifier

## Weapon stats

Examples:

- Base Damage
- Fire Rate / Fire Delay
- Range
- Projectile Speed
- Projectile Count
- Spread
- Pierce count
- Ricochet count
- Explosion Radius
- Knockback
- weapon-specific mechanical flags/effects

## Run state

Run state contains the resolved result of:

```text
Base Character
+ Character modifiers/passive
+ Base Weapon
+ Upgrade modifiers
+ Temporary effects
= Current effective state
```

- [x] Audit current gameplay variables and classify each as Character / Weapon / Run / World. — **Status:** ✅ DONE
- [ ] Document canonical owner for each migrated stat. — **Status:** 🔵 IN PROGRESS
- [ ] Remove duplicate active ownership when migration is complete. — **Status:** 🧹 POST-MIGRATION

---

# 5. Deterministic Stat Resolver

We need one clear path explaining how a final number is produced.

Do not allow random systems to directly mutate the same stat in unrelated files without traceable ownership.

Supported modifier types should include where useful:

1. `FLAT`
2. `ADDITIVE_PERCENT`
3. `MULTIPLICATIVE_PERCENT`
4. `OVERRIDE` / mechanical override when explicitly required

Example conceptual calculation:

```text
Base Damage
+ flat modifiers
+ additive percentage group
× multiplicative modifiers
= effective damage
```

The exact formula must be documented and tested before migration is complete.

### Why this is required

Current upgrades can directly multiply values, e.g. repeated damage multipliers. That can be valid, but stacking must become an intentional rule rather than an accidental consequence of call order.

- [x] Inventory current direct stat mutations. — **Status:** ✅ DONE
- [x] Define modifier ordering. — **Status:** ✅ DONE
- [x] Implement canonical resolver or equivalent canonical calculation layer. — **Status:** ✅ DONE
- [ ] Ensure applying/removing/recalculating upgrades is deterministic. — **Status:** 🔵 IN PROGRESS
- [x] Add tests for flat/additive/multiplicative ordering. — **Status:** ✅ DONE
- [x] Add tests preventing the same upgrade from being applied twice accidentally. — **Status:** ✅ DONE

---

# 6. Upgrade Registry — data-driven cards

Move card definitions out of a monolithic runtime responsibility into a canonical registry.

Each upgrade definition should be able to express:

```text
id
name
description
rarity
maxLevel
tags
requirements / prerequisites
weight / offer rules
modifier data
mechanical effect ID/config
art ID
scope: GENERAL | CHARACTER | WEAPON | COMPANION(future)
```

Not every card needs custom executable logic. Numeric cards should primarily be data-driven. Mechanical cards may call a focused registered effect implementation.

### Migration rule

**Do not migrate all cards in one destructive rewrite.**

- Build registry.
- Migrate a small number of existing cards.
- Test real gameplay.
- Continue card-by-card/group-by-group.
- Remove old duplicate implementation only when migrated behavior is verified.

- [x] Create canonical Upgrade Registry. — **Status:** ✅ DONE
- [x] Define upgrade schema. — **Status:** ✅ DONE
- [x] Add validation for invalid definitions. — **Status:** ✅ DONE
- [x] Migrate Heavy Rivets as first numeric reference card. — **Status:** ✅ DONE
- [x] Verify Heavy Rivets gameplay parity. — **Status:** ✅ DONE
  - Verified on `c9da716`: canonical definition/registry/runtime adapter, shared Phase C/C1 apply path, unit parity, targeted final-card E2E, Quality, full E2E, Smoke, deploy eligibility, and no Live Chromium failure issue after deployment.
- [x] Migrate Overclock. — **Status:** ✅ DONE
  - Verified on `8b57ef7`: canonical definition, 145ms resolved-stat floor, shared Phase C/C1 apply path, unit parity, final-card E2E, Quality, full E2E and Smoke all passed; no `[CI]` or `[LIVE] deployed main smoke failed` issue was opened after the deployment window.
- [x] Migrate Long Barrel. — **Status:** ✅ DONE
  - Gameplay migration merged in `d731bad`; after the Sawbug/CI stabilization merge, `main` `98de52f` recovered with quality=success, e2e=success, smoke=success and passed post-deploy Live Chromium.
- [ ] Migrate Twin Riveter. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
  - PR #89 implements the canonical mechanical-effect path, shared Phase C/C1 registry adapter, WeaponSystem mechanical-state ownership, level 1 → 2 rivets / level 2 → 3 rivets parity, unit coverage and final-scene E2E. Final checkbox remains blocked on clean PR + `main` + Live Chromium verification.
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
- minimum reward guarantees
- power/mechanical significance
- prerequisite depth
- UI presentation

Guideline:

- Common: build foundations / reliable numeric improvements.
- Rare: stronger or more specialized improvements.
- Epic: major build-changing mechanics or advanced synergies.
- Legendary: very rare run-defining effects; use sparingly.

- [ ] Define rarity constants and weights. — **Status:** ⚪ NOT STARTED
- [ ] Connect rarity to upgrade offer system. — **Status:** ⚪ NOT STARTED
- [ ] Preserve/support elite minimum-rarity reward rules. — **Status:** ⚪ NOT STARTED
- [ ] Prevent rarity from becoming purely cosmetic. — **Status:** ⚪ NOT STARTED
- [ ] Balance rarity frequencies against a 10-minute run. — **Status:** ⚪ NOT STARTED

---

# 8. Levels, duplicates and offer rules

Upgrade levels must be explicit.

Rules to implement/design:

- Duplicate card normally increases that card's level.
- A max-level card leaves the normal offer pool unless a later evolution rule explicitly references it.
- Offer generation must respect prerequisites and scope.
- Avoid impossible or dead offers.
- Avoid three functionally identical choices when practical.
- Keep auto-fire/passive combat identity; upgrades should not require unnecessary new input systems.

Future-compatible but not mandatory in first implementation:

- Reroll
- Skip
- Banish

- [ ] Centralize upgrade-level ownership. — **Status:** 🔵 IN PROGRESS
- [ ] Enforce max level. — **Status:** 🔵 IN PROGRESS
- [ ] Remove maxed cards from standard offers. — **Status:** 🔵 IN PROGRESS
- [ ] Implement prerequisite-aware offers. — **Status:** ⚪ NOT STARTED
- [ ] Implement scope-aware offers. — **Status:** ⚪ NOT STARTED
- [ ] Add offer-quality safeguards. — **Status:** ⚪ NOT STARTED
- [ ] Add deterministic seeded offer testing. — **Status:** ⚪ NOT STARTED

---

# 9. Upgrade tags and scopes

Candidate tags:

- `DAMAGE`
- `FIRE_RATE`
- `CRIT`
- `PROJECTILE`
- `MULTISHOT`
- `PIERCE`
- `RICOCHET`
- `EXPLOSIVE`
- `MOBILITY`
- `DEFENSE`
- `ECONOMY`
- `RIVET`
- `UTILITY`

Scopes:

- `GENERAL`
- `CHARACTER`
- `WEAPON`
- `COMPANION` — reserved for future Robot Dog system

- [ ] Implement tags. — **Status:** ⚪ NOT STARTED
- [ ] Implement scopes. — **Status:** ⚪ NOT STARTED
- [ ] Ensure Runner can use general + Runner-specific + compatible weapon cards. — **Status:** ⚪ NOT STARTED
- [ ] Ensure incompatible future weapon cards cannot enter the offer pool. — **Status:** ⚪ NOT STARTED

---

# 10. Hunter / Rivet build expansion

Target initial pool: approximately **10–12 strong Hunter-compatible cards**, including migrated current cards.

The goal is not simply more cards; it is multiple recognizable builds.

## Existing foundations

- Heavy Rivets — damage foundation
- Overclock — fire-rate foundation
- Long Barrel — range/projectile foundation
- Twin Riveter — multishot foundation
- Fleet Feet — mobility
- Scrap Magnet — economy/utility
- Armor Plate — defense

## Candidate new cards

### Piercing Rivets
Rivets penetrate additional enemies.

### Ricochet
Rivets can redirect/bounce to a nearby valid enemy after impact.

### Shrapnel Impact
Impact releases short-range damaging fragments or equivalent controlled secondary projectiles.

### Critical Rivet
Introduces/increases crit-oriented play.

### Explosive Rivet
Controlled impact explosion / area damage.

### Triple Riveter
Advanced multishot upgrade; likely prerequisite-based rather than an unconditional early card.

Possible later advanced card concepts:

- Deadeye / execution-style crit specialization
- specialized overclock payoff
- heavy-rivet payoff

Exact names, values, rarities and requirements require balance passes.

- [ ] Finalize initial 10–12 card pool. — **Status:** ⚪ NOT STARTED
- [ ] Implement first new mechanical card. — **Status:** ⚪ NOT STARTED
- [ ] Implement Piercing Rivets. — **Status:** ⚪ NOT STARTED
- [ ] Implement Ricochet. — **Status:** ⚪ NOT STARTED
- [ ] Implement Shrapnel Impact. — **Status:** ⚪ NOT STARTED
- [ ] Implement Critical Rivet + crit combat support. — **Status:** ⚪ NOT STARTED
- [ ] Implement Explosive Rivet. — **Status:** ⚪ NOT STARTED
- [ ] Implement advanced multishot progression. — **Status:** ⚪ NOT STARTED
- [ ] Test projectile-count/performance limits. — **Status:** ⚪ NOT STARTED
- [ ] Test interactions between mechanical cards. — **Status:** ⚪ NOT STARTED

---

# 11. Build identities

We want runs to diverge into recognizable styles.

Examples, not forced recipes:

### Heavy / penetration build

```text
Heavy Rivets
→ Piercing Rivets
→ Shrapnel / impact payoff
```

### Rapid multishot build

```text
Overclock
→ Twin Riveter
→ Ricochet
→ advanced multishot
```

### Precision / critical build

```text
Critical Rivet
→ Long Barrel
→ advanced crit payoff
```

The system should encourage these patterns without making every run follow one fixed recipe.

- [ ] Verify at least 3 meaningfully different viable builds. — **Status:** ⚪ NOT STARTED
- [ ] Ensure no single card is mandatory for every build. — **Status:** ⚪ NOT STARTED
- [ ] Ensure defensive/utility choices remain useful without overwhelming offensive progression. — **Status:** ⚪ NOT STARTED

---

# 12. Prerequisites, synergies and evolutions

## Prerequisites

Supported in Upgrade System 2.0 architecture from the beginning.

Examples:

- require another card
- require card level
- require compatible weapon/tag
- require character/tag

## Synergies

Implement after core registry/rarity/levels are stable.

## Evolutions

**Architect now, implement later.** Do not bundle full evolution implementation into the first migration.

Potential future model:

```text
Upgrade A at required level
+ Upgrade B / tag requirement
→ unlock Epic/Evolution card
```

- [ ] Prerequisite schema supported. — **Status:** ⚪ NOT STARTED
- [ ] Prerequisite offer filtering tested. — **Status:** ⚪ NOT STARTED
- [ ] Define synergy rules after initial pool is stable. — **Status:** ⏸️ DEFERRED
- [ ] Design first evolution only after normal upgrade system passes balance testing. — **Status:** ⏸️ DEFERRED
- [ ] Implement evolutions in a later sub-phase. — **Status:** ⏸️ DEFERRED

---

# 13. Stat caps and safety limits

Existing movement hard-cap behavior proves caps are already useful in Wreckmarch.

Potential capped/safety-controlled stats:

- Move Speed
- Fire Rate / minimum fire delay
- Crit Chance
- Armor / damage reduction
- Projectile Count
- Ricochet/Pierce counts where performance requires it
- cooldown reduction if added later

Do not invent final cap values without gameplay testing.

- [ ] Centralize relevant caps. — **Status:** 🔵 IN PROGRESS
- [ ] Preserve current movement cap behavior. — **Status:** 🔵 IN PROGRESS
- [ ] Add fire-rate safety limit. — **Status:** ⚪ NOT STARTED
- [ ] Add projectile-count/performance safety limit. — **Status:** ⚪ NOT STARTED
- [ ] Add crit cap when crit ships. — **Status:** ⚪ NOT STARTED
- [ ] Add armor/damage-reduction cap when armor model is finalized. — **Status:** ⚪ NOT STARTED

---

# 14. Upgrade card visual/UI improvement

The current card system should evolve visually without mixing UI ownership with gameplay logic.

Target card information hierarchy:

1. Card art
2. Name
3. Rarity
4. Current/next level
5. Short effect description
6. Real stat preview when useful

Example:

```text
HEAVY RIVETS II
RARE

Damage +20%
28.8 → 34.6
```

Visual goals:

- clearer premium frame language
- rarity readability
- improved card art consistency with Wreckmarch
- remove confusing decorative elements
- readable on mobile
- no giant text blocks

- [ ] Audit current card UI. — **Status:** ⚪ NOT STARTED
- [ ] Finalize rarity frame language. — **Status:** ⚪ NOT STARTED
- [ ] Show card level/max level. — **Status:** ⚪ NOT STARTED
- [ ] Add before → after stat preview where applicable. — **Status:** ⚪ NOT STARTED
- [ ] Improve art consistency. — **Status:** ⚪ NOT STARTED
- [ ] Test three-card selection on target mobile viewport. — **Status:** ⚪ NOT STARTED
- [ ] Ensure UI reads resolved stats rather than duplicating calculations. — **Status:** ⚪ NOT STARTED

---

# 15. Run stats screen

Do not overload the combat HUD.

Preferred future location: Pause / Character / Build panel.

Candidate presentation:

```text
RUNNER
HP             115 / 115
Damage          34.6
Fire Rate       4.2/s
Crit Chance      15%
Crit Damage     150%
Move Speed       263
Armor              8

RIVET GUN
Projectiles        2
Pierce             1
Ricochet           0
```

- [ ] Add canonical read-only build/stat snapshot API. — **Status:** ⚪ NOT STARTED
- [ ] Design compact run stats panel. — **Status:** ⚪ NOT STARTED
- [ ] Show character and weapon stats separately. — **Status:** ⚪ NOT STARTED
- [ ] Ensure displayed values match actual combat calculations. — **Status:** ⚪ NOT STARTED

---

# 16. Status effects — architecture only for now

Future effects may include:

- Burn
- Bleed
- Shock
- Slow

Do not implement a large status-effect system during the first Upgrade 2.0 migration unless required by an approved card.

- [ ] Ensure mechanical-effect architecture does not block future status effects. — **Status:** ⚪ NOT STARTED
- [ ] Defer full status-effect implementation. — **Status:** ⏸️ DEFERRED

---

# 17. Temporary run progression vs permanent progression

Upgrade cards in this roadmap are **run progression** and reset between runs unless explicitly changed by a future design.

Future meta progression must live outside the run-upgrade system.

- [ ] Keep run upgrade state isolated from future permanent progression. — **Status:** 🔵 IN PROGRESS
- [ ] Do not introduce permanent stat mutations through Upgrade System 2.0. — **Status:** 🔵 IN PROGRESS

---

# 18. Future playable characters — compatibility contract

Do **not** implement additional playable characters in this phase.

Architecture must allow future archetypes such as:

### Tank
- higher HP/armor
- lower speed
- different passive/starting weapon

### Scout
- lower HP
- higher mobility/crit tendency
- different passive/starting weapon

### Heavy Gunner
- slower movement
- stronger/heavier weapon profile

These are examples, not approved balance values.

A future character must be addable through a definition/registration path without copying Runner runtime code or adding a patch that overrides Runner.

- [ ] Prove architecture with a test-only/mock second character definition. — **Status:** ⚪ NOT STARTED
- [ ] Verify character selection/creation does not mutate another character. — **Status:** ⚪ NOT STARTED
- [ ] Do not ship another playable character during this phase. — **Status:** ⏸️ DEFERRED

---

# 19. Robot Dog / Companion boundary

The old Rig/Fortress path is not the focus of Upgrade System 2.0.

Future direction: a **Robot Dog companion** with its own identity and upgrade pool.

For now:

- reserve `COMPANION` scope
- do not build new Fortress/Rig upgrade content
- do not let old disabled Rig cards pollute normal upgrade offers
- avoid architecture that assumes the companion is the player weapon

- [ ] Confirm disabled legacy Rig cards cannot appear unexpectedly. — **Status:** ⚪ NOT STARTED
- [ ] Reserve clean companion upgrade extension point. — **Status:** ⚪ NOT STARTED
- [ ] Defer Robot Dog implementation to its own roadmap/phase. — **Status:** ⏸️ DEFERRED

---

# 20. Balance targets

Current baseline: approximately 10-minute run.

Upgrade balance must account for:

- expected number of level-ups in 10 minutes
- how early build identity becomes visible
- rarity frequency
- max-level feasibility
- elite reward quality
- enemy HP scaling
- DPS growth
- projectile/performance growth

Do not balance cards in isolation.

- [ ] Record baseline no-upgrade / current-upgrade run metrics. — **Status:** ⚪ NOT STARTED
- [ ] Define expected upgrade count by run end. — **Status:** ⚪ NOT STARTED
- [ ] Define target timing for first meaningful build decision. — **Status:** ⚪ NOT STARTED
- [ ] Tune rarity distribution. — **Status:** ⚪ NOT STARTED
- [ ] Tune offensive scaling against enemy HP/wave scaling. — **Status:** ⚪ NOT STARTED
- [ ] Validate at least one full 10-minute run after major balance changes. — **Status:** ⚪ NOT STARTED

---

# 21. Testing and regression protection

Every major step requires tests before its checkbox is completed.

Required coverage:

- Character identity cannot be replaced by another definition/art set.
- Runner retains correct base stats.
- Weapon stats resolve from the correct weapon.
- Upgrade applies exactly once per awarded level.
- Max-level cards stop appearing.
- Prerequisites work.
- Rarity guarantees work.
- Stat resolver ordering is deterministic.
- Mechanical projectile upgrades compose safely.
- Run reset removes temporary upgrades.
- Mobile upgrade UI remains usable.
- Full game boots without old patch-order dependency.

- [ ] Add/extend unit tests. — **Status:** 🔵 IN PROGRESS
- [ ] Add integration tests. — **Status:** 🔵 IN PROGRESS
- [ ] Add visual/mobile regression tests where appropriate. — **Status:** ⚪ NOT STARTED
- [ ] Test a real playable build after each migration group. — **Status:** ⚪ NOT STARTED
- [ ] Run full test suite before marking the phase complete. — **Status:** ⚪ NOT STARTED

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
- [x] Confirm a successful post-deploy Live Chromium run on the current `main`. — **Status:** ✅ DONE
  - Current verified gameplay commit: `98de52f` (Quality/E2E/Smoke recovered on `main`; post-deploy Live Chromium verification passed and CI Issue #83 auto-closed).

---


# 21.2. Sharded Playwright E2E gate

The canonical browser E2E architecture is defined in `TESTING_AND_DEPLOYMENT_POLICY.md`. It replaces the single-runner/multi-worker approach with isolated runner-level parallelism.

- [x] Pin Playwright CI execution to one worker per runner. — **Status:** ✅ DONE
- [x] Split the E2E suite across three GitHub Actions shards. — **Status:** ✅ DONE
- [x] Keep one stable aggregate check named `E2E` for branch protection and CI consumers. — **Status:** ✅ DONE
- [x] Use Playwright blob reports per shard and merge them into one HTML diagnostic artifact. — **Status:** ✅ DONE
- [x] Use `retryStrategy: isolated` with one CI retry. — **Status:** ✅ DONE
- [x] Fail CI when Playwright classifies a test as flaky; a retry must not silently turn the gate green. — **Status:** ✅ DONE
- [x] Record traces only on the first retry in CI. — **Status:** ✅ DONE
- [x] Comment failing shard logs directly on the PR and keep aggregate diagnostics as a second layer. — **Status:** ✅ DONE
- [x] Remove temporary diagnostic workflows from the canonical path. — **Status:** ✅ DONE
- [x] Verify the new E2E architecture on PR, merge, and confirm `main` + Live Chromium before marking this gate complete. — **Status:** ✅ DONE
  - Verified on `98de52f`: all three shards, stable aggregate `E2E`, Quality and Smoke passed on `main`; post-deploy Live Chromium passed and the prior CI failure Issue #83 auto-closed.

Architecture rule: speed comes from independent CI shards, never by raising browser-worker contention inside one runner. Test retries are diagnostic only; flaky classifications remain failures.

---

# 22. Cleanup / architecture debt pass

This is essential because the goal is specifically to stop patch-on-patch growth.

During this roadmap, inspect old phase/fix/hotfix files only when touching their responsibility. Do not blindly rewrite unrelated stable systems.

When Upgrade System 2.0 replaces old ownership:

- move durable logic to canonical modules
- update imports/callers
- remove obsolete duplicate runtime overrides
- keep compatibility shims only temporarily and label them clearly
- delete compatibility shim after all callers migrate

- [x] Produce ownership map before major migration. — **Status:** ✅ DONE
- [x] Identify upgrade-related patch/phase ownership that can be retired. — **Status:** ✅ DONE
- [ ] Remove duplicated upgrade logic after migration. — **Status:** 🧹 POST-MIGRATION
- [ ] Confirm script load order is no longer required to override older upgrade behavior. — **Status:** 🧹 POST-MIGRATION
- [ ] Confirm no duplicate character identity/asset ownership exists in touched systems. — **Status:** 🔵 IN PROGRESS
- [ ] Confirm no new oversized monolithic runtime file was created. — **Status:** 🔵 IN PROGRESS

---

# 23. Implementation order — DO NOT SKIP AHEAD

## Phase U0 — Audit and ownership
- [x] Map current character/weapon/upgrade/run stat ownership. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE
- [x] Identify duplicate/patch ownership relevant to this work. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE
- [x] Establish regression baseline/tests. See `tests/unit/upgrade-system-u0-baseline.test.ts`. — **Status:** ✅ DONE

## Phase U1 — Character + weapon + stat architecture
- [x] Extend Runner character contract safely. — **Status:** ✅ DONE
- [x] Add starting weapon/passive/combat profile support. — **Status:** ✅ DONE
- [x] Define Character vs Weapon vs Run stat ownership. — **Status:** ✅ DONE
- [x] Implement deterministic stat resolution. — **Status:** ✅ DONE
- [x] Preserve current gameplay parity. — **Status:** ✅ DONE

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
- [ ] Improve frames/art hierarchy. — **Status:** ⚪ NOT STARTED
- [ ] Add rarity and level presentation. — **Status:** ⚪ NOT STARTED
- [ ] Add real before→after previews. — **Status:** ⚪ NOT STARTED
- [ ] Mobile visual test. — **Status:** ⚪ NOT STARTED

## Phase U6 — Run stats/build panel
- [ ] Expose resolved stats safely. — **Status:** 🔵 IN PROGRESS
- [ ] Implement read-only build panel. — **Status:** ⚪ NOT STARTED
- [ ] Verify displayed values against combat. — **Status:** ⚪ NOT STARTED

## Phase U7 — Balance and cleanup
- [ ] Full 10-minute run tests. — **Status:** ⚪ NOT STARTED
- [ ] Rarity/DPS/progression tuning. — **Status:** ⚪ NOT STARTED
- [ ] Remove obsolete migration shims/duplicate upgrade patches. — **Status:** 🧹 POST-MIGRATION
- [ ] Full regression suite. — **Status:** ⚪ NOT STARTED
- [ ] Update this roadmap with final completed checkboxes. — **Status:** 🧹 POST-MIGRATION

## Later — explicitly NOT part of current implementation
- [ ] Synergy expansion. — **Status:** ⏸️ DEFERRED
- [ ] Evolutions. — **Status:** ⏸️ DEFERRED
- [ ] Additional playable characters. — **Status:** ⏸️ DEFERRED
- [ ] Robot Dog companion implementation and companion cards. — **Status:** ⏸️ DEFERRED
- [ ] Permanent/meta progression. — **Status:** ⏸️ DEFERRED
- [ ] Large status-effect system. — **Status:** ⏸️ DEFERRED

---

# 24. Definition of Done

Upgrade System 2.0 is complete only when:

- Runner remains visually and mechanically the correct character.
- There is one canonical ownership path for touched character/weapon/upgrade/stat responsibilities.
- Existing cards have been safely migrated.
- New cards create multiple real builds rather than only larger numbers.
- Rarity/levels/prerequisites work predictably.
- Stats shown to the player match actual combat.
- The game remains performant and readable on mobile.
- A full 10-minute run can be completed without upgrade-system regression.
- Obsolete upgrade-related patch ownership introduced by older architecture has been retired where safely possible.
- Tests pass.
- This checklist reflects the real implementation state.

---

## Working discipline

When beginning any item:

1. Read this roadmap.
2. Work only on the next approved unchecked item/sub-phase.
3. Modify the canonical owner instead of adding another patch layer.
4. Test it.
5. Only then change `[ ]` to `[x]` in this document.
6. Commit code + checklist update together when practical.

**No checkbox is completed by intention. It is completed by working, tested game behavior.**

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

> **Last status review:** 2026-09-02. Statuses describe the actual repository state on `main`; they do not count intention as completion.

---

## 0.0. Roadmap integrity guard — DO NOT DELETE PLANNED SCOPE

This roadmap is a **protected cumulative plan**. Updating progress must not silently shrink the approved scope.

Mandatory rules for every future edit to `UPGRADE_SYSTEM_2_ROADMAP.md`:

1. Always read the latest `main` version before editing; never push a stale local copy over it.
2. Progress/status edits must be **localized patches**. Do not replace the whole document merely to change checkboxes or evidence.
3. Before committing, run the roadmap integrity test and compare the heading/card anchor inventory.
4. Existing sections, approved card concepts, build identities, deferred items and Definition-of-Done requirements must not be deleted just because they are not the current implementation focus.
5. Removing or renaming a protected roadmap section requires **explicit user approval** and a matching update to `tests/unit/upgrade-roadmap-integrity.test.ts`.
6. Any intentional protected-section removal must be called out in the commit/PR with `ROADMAP-REMOVAL:` and the reason. Absence of that approval means deletion is a regression.
7. A smaller replacement document is **not** considered an acceptable roadmap update.

The integrity test intentionally protects the original Upgrade System 2.0 scope, including the Hunter/Rivet new-card pool and U4–U7 phases, so a future status-only edit cannot silently erase them again.

---

## 0. Core development rule — NO PATCH-ON-PATCH

Wreckmarch must not grow through temporary runtime patches layered over older patches.

Past development showed that duplicated ownership and late runtime overrides can cause regressions such as the wrong character/art appearing, one system silently replacing another, or multiple files trying to control the same feature.

### Mandatory architecture rules

- [ ] Every gameplay responsibility must have **one canonical owner**. — **Status:** 🧭 ACTIVE POLICY
- [ ] Do not create `*-fix`, `*-hotfix`, `*-v2`, `*-v3`, or additional phase patch files when the correct solution is to repair/refactor the canonical system. — **Status:** 🧭 ACTIVE POLICY
- [ ] New Upgrade System 2.0 logic must live in focused canonical modules, not inside new runtime monkey-patches. — **Status:** 🧭 ACTIVE POLICY
- [x] Character identity/stats belong to `src/characters/`. — **Status:** ✅ DONE
- [x] Weapon definitions and weapon behavior belong to the canonical combat/weapon layer. — **Status:** ✅ DONE
- [x] Upgrade definitions and upgrade selection must have one dedicated upgrade module/folder. — **Status:** ✅ DONE
- [x] Run-time resolved stats must have one canonical resolver/state owner. — **Status:** ✅ DONE
- [x] UI may display state but must not secretly own gameplay values. — **Status:** ✅ DONE
- [x] Art/animation loaders must not redefine character gameplay identity. — **Status:** ✅ DONE
- [ ] Before replacing old logic, identify all callers and migrate them; do not leave two active implementations. — **Status:** 🧭 ACTIVE POLICY
- [ ] After migration, remove/deactivate obsolete duplicated logic rather than leaving it as an active fallback. — **Status:** 🧭 ACTIVE POLICY
- [ ] Keep files focused and reasonably sized. Split by responsibility, not by chronological phase number. — **Status:** 🧭 ACTIVE POLICY
- [ ] Every architectural migration must preserve the currently playable build until the replacement is verified. — **Status:** 🧭 ACTIVE POLICY
- [x] Regression tests must specifically protect character identity, selected character assets, weapon ownership, upgrade application, and stat resolution. — **Status:** ✅ DONE

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
- [x] Ensure character visuals cannot override selected character identity. — **Status:** ✅ DONE
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
- [x] Document canonical owner for each migrated stat. — **Status:** ✅ DONE
- [x] Remove duplicate active ownership when migration is complete. — **Status:** ✅ DONE

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
- [x] Ensure applying/removing/recalculating upgrades is deterministic. — **Status:** ✅ DONE
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
- [x] Migrate Twin Riveter. — **Status:** ✅ DONE
  - Verified on `10ba433`: canonical mechanical-effect path, shared Phase C/C1 registry adapter, WeaponSystem mechanical-state ownership, level 1 → 2 rivets / level 2 → 3 rivets parity, unit/final-scene E2E, Quality, Smoke, all three E2E shards, aggregate E2E, deploy, Live Chromium and Pages recovery all passed.
- [x] Migrate Fleet Feet. — **Status:** ✅ DONE
  - Verified on `3fd680b`: canonical Character `moveSpeed` migration uses the `RUN_BALANCE` contract (+3% per level, max level 3, hard cap 280), shared Phase C/C1 stat adapter, unit parity against `getPlayerMoveSpeed()`, deterministic final-scene E2E, Quality, Smoke, all three E2E shards and aggregate E2E; post-merge Live Chromium passed on the same SHA with no open `[CI] main is failing` or `[LIVE] deployed main smoke failed` issue.
- [x] Migrate Scrap Magnet. — **Status:** ✅ DONE
  - Verified on `51a90d7`: canonical Character `pickupRadiusMultiplier` preserves the 135px Phase C base radius and applies +25% multiplicatively per level (max 4) through RunStatState. Shared Phase C/C1 registry adapter, unit parity, deterministic final-scene attraction E2E, Quality, Smoke, all three E2E shards, aggregate E2E and post-merge Live Chromium passed on the same `main` SHA with no open CI/Live failure issue.
- [x] Migrate Armor Plate. — **Status:** ✅ DONE
  - Verified on gameplay commit `361c26b` with production recovery on `f49a580`: canonical mixed upgrade adds +15 `character.maxHp` FLAT per level (max 4) plus transactional `RESTORE_HP` capped at the newly resolved max HP. Shared Phase C/C1 registry wiring, rollback coverage, Quality, Smoke, all E2E shards, aggregate E2E, deploy and post-deploy Live Chromium passed; stale Pages module caching was cleared by bumping the C3/C3.1 import fingerprints, and Live Issue #93 auto-closed after recovery.
- [x] Decide temporary handling of Call the Rig without expanding old Rig system. — **Status:** ✅ DONE
  - Verified on `a44f551`: registry-owned one-level `COMPANION` card with a named `SUMMON_RIG` effect delegates only to `RigSystem.summon()`. Level-2 offer gating is data-driven; reserved Rig Overdrive/Twin Cannon choices remain unavailable in Phase C/C1. Unit/final-scene coverage, Quality, Smoke, all three E2E shards, aggregate E2E, Pages deployment and post-deploy production browser gates passed with no open CI/Live failure issue.
- [x] Remove/deactivate obsolete duplicate card definitions after migration. — **Status:** ✅ DONE
  - Verified on `f723494`: removed reserved Phase C/C1 `rig-overdrive` / `twin-cannon` gameplay placeholders and the Companion V3 upgrade-level monkeypatch while preserving companion presentation/runtime behavior. Twin Riveter level 2 is proven through the real `UpgradeSceneV4`; Quality, Smoke, all three E2E shards, aggregate E2E and Pages deployment passed, and the post-deploy Live Chromium gate completed without opening a `[LIVE] deployed main smoke failed` issue. No `ci-failure` issue remains open.
  - Manual deployed-build baseline after this cleanup: ✅ PASS — upgrade cards, Twin Riveter level 2, Call the Rig and general gameplay were confirmed working normally before the roll-service extraction began.

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

- [x] Define rarity constants and weights. — **Status:** ✅ DONE
- [x] Connect rarity to upgrade offer system. — **Status:** ✅ DONE
- [x] Preserve/support elite minimum-rarity reward rules. — **Status:** ✅ DONE — U3 shipped in PR #249 and was finalized in PR #251 / `30c1ac5c39e9acd676c47ad386652f1f798671d0`: WRECK CRATE keeps three random choices while guaranteeing at least one `RARE+` option when the eligible pool can support it; normal level-up rarity weights remain unchanged.
- [x] Prevent rarity from becoming purely cosmetic. — **Status:** ✅ DONE
- [ ] Balance rarity frequencies against a 10-minute run. — **Status:** 🟡 PARTIAL — WS17/U3 preserve the canonical 65/24/9/2 tail and clamp only the guaranteed Elite reward from Common→Rare; a full post-U3 10-minute rarity-frequency validation is still required.

---

## 7.1. Verified rarity implementation evidence

- [x] Canonical tiers are `COMMON`, `RARE`, `EPIC`, `LEGENDARY`. — **Status:** ✅ DONE
- [x] Current weights are 65 / 24 / 9 / 2. — **Status:** ✅ DONE
- [x] Numeric power multipliers are 1.00x / 1.15x / 1.30x / 1.50x. — **Status:** ✅ DONE
- [x] Rarity does not create rarity-suffixed duplicate upgrade IDs. — **Status:** ✅ DONE
- [x] Max levels and hard caps remain authoritative after rarity scaling. — **Status:** ✅ DONE
- [x] Per-level rarity metadata is recorded in `upgradeRarityHistory`. — **Status:** ✅ DONE
- [x] Final premium cards consume canonical rolled rarity rather than a duplicate UI rarity table. — **Status:** ✅ DONE

Verified gameplay commit: `7f30957`.

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

- [x] Centralize upgrade-level ownership. — **Status:** ✅ DONE
- [x] Enforce max level. — **Status:** ✅ DONE
- [x] Remove maxed cards from standard offers. — **Status:** ✅ DONE
- [x] Implement prerequisite-aware offers. — **Status:** ✅ DONE — PR #188 / `501f5f3387f90667636bd096e3a884fee17385be`; shared requirements resolver enforces prerequisites in canonical availability and direct application
- [x] Implement scope/compatibility-aware technical filtering. — **Status:** ✅ DONE — PR #190 / `25e28a9931f86ce2373b70793e617608483e2af0`; explicit character/weapon mismatches are filtered without curating valid off-build rolls
- [ ] Add offer-quality safeguards. — **Status:** ⚪ NOT STARTED
- [x] Add deterministic seeded offer testing. — **Status:** ✅ DONE

---

## 8.1. Canonical upgrade roll service

The active card scenes no longer own random selection. The shared roll service owns weighted selection and deterministic seeded testing.

- [x] Extract card roll logic from scene UI. — **Status:** ✅ DONE
- [x] Add seeded RNG support for tests. — **Status:** ✅ DONE
- [x] Prevent maxed upgrades from being rolled through canonical availability. — **Status:** ✅ DONE
- [x] Support exclusions and no-valid-choice behavior without scene-specific fallbacks. — **Status:** ✅ DONE
- [x] Roll rarity after canonical card selection. — **Status:** ✅ DONE

Verified gameplay commit: `86e5a11`.

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

- [x] Implement tags. — **Status:** ✅ DONE
- [x] Implement scopes. — **Status:** ✅ DONE
- [x] Ensure Runner can use general + Runner-specific + compatible weapon cards. — **Status:** ✅ DONE — canonical compatibility context + resolver landed in PR #190
- [x] Ensure incompatible future weapon cards cannot enter the offer pool. — **Status:** ✅ DONE — Rivet-only Twin/Triple/Explosive are explicitly `rivet-gun` compatible; deterministic future-shotgun context proves they are excluded

---

## 9.1. Upgrade application transactions

Mixed stat/mechanical cards use one transaction-capable application path so a failed post-stat effect cannot leave half-applied state.

- [x] Add transaction-capable modifier application. — **Status:** ✅ DONE
- [x] Add effect rollback for mixed stat/mechanical upgrades. — **Status:** ✅ DONE
- [x] Prove Armor Plate rollback when its post-stat effect fails. — **Status:** ✅ DONE
- [ ] Extend transaction coverage only when future companion/run effects require it. — **Status:** ⏳ FUTURE

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

**Implementation status:** ✅ DONE — PR #105, merged as `0b33898e66d0f9932330cd0cb53c7651596076e8`; exact-SHA production Live verification and Pages recovery passed. Canonical `pierceCount` weapon state, ordered multi-enemy swept hits, same-projectile duplicate-hit prevention, dedicated Wreckmarch card art, and deterministic Chromium coverage are live.

### Ricochet
Rivets can redirect/bounce to a nearby valid enemy after impact.

**Implementation status:** ✅ DONE — PR #109, merged as `6b499451bb5ff7fc29f184180d420db96fef88c6`; exact-SHA iOS Live verification and Pages recovery passed, and no open Live Chromium or main CI failure remained for the merged SHA. Canonical `ricochetCount`, Pierce-first/final-impact redirect behavior, duplicate-target prevention, overlap/sweep ordering protection, D1-owned card art and deterministic Chromium coverage are live.

### Shrapnel Impact
Impact releases short-range damaging fragments or equivalent controlled secondary projectiles.

**Implementation status:** ✅ DONE — PR #111, merged as `440611c87fdfae9ad36374700e6a5831afd49b7e`; exact-SHA iOS Live verification and Pages recovery passed, and no open Live Chromium or main CI failure remained after the production gate. Canonical `shrapnelCount`, ProjectileSystem-owned bounded secondary fragments, source-hit exclusion, recursion prevention, D1-owned card art and deterministic Chromium coverage are live.

### Critical Rivet
Introduces/increases crit-oriented play.

**Implementation status:** ✅ DONE — PR #115, merged as `3af77d101ba1288ee5b349adecf271594fdea2bc`; exact-SHA iOS Live verification and Pages recovery passed, and no open Live Chromium or main CI failure remained after the production gate. Canonical character-domain `critChance`, one-roll-per-Hero-projectile resolution in WeaponSystem, Runner `critDamageMultiplier = 1.5`, Rig/support isolation, D1-owned card art and deterministic Chromium coverage are live.

### Explosive Rivet
Controlled impact explosion / area damage.

### Triple Riveter
Advanced multishot upgrade; likely prerequisite-based rather than an unconditional early card.

Possible later advanced card concepts:

- Deadeye / execution-style crit specialization
- specialized overclock payoff
- heavy-rivet payoff

Exact names, values, rarities and requirements require balance passes.

> **Protected approved card concepts:** Piercing Rivets, Ricochet, Shrapnel Impact, Critical Rivet, Explosive Rivet and Triple Riveter must remain in this roadmap until implemented, explicitly deferred, or explicitly removed with user approval under the Roadmap integrity guard.

- [x] Finalize initial 10–12 card pool. — **Status:** ✅ DONE — U4 locks a 12-card Hunter core: Heavy Rivets, Overclock, Long Barrel, Twin Riveter, Piercing Rivets, Ricochet, Shrapnel Impact, Critical Rivet, Explosive Rivet, Fleet Feet, Scrap Magnet and Armor Plate. Triple Riveter remains a prerequisite-based advanced unlock; Field Repair + Impact Shield remain survivability auxiliary choices; Call the Rig remains a companion auxiliary choice. `src/upgrades/upgrade-offer-pool.js` is the single offer-pool owner and preserves the existing active choice ordering/weights so normal RNG is not steered.
- [x] Implement first new mechanical card. — **Status:** ✅ DONE — Piercing Rivets, PR #105 / `0b33898e66d0f9932330cd0cb53c7651596076e8`
- [x] Implement Piercing Rivets. — **Status:** ✅ DONE — canonical weapon `pierceCount` + live projectile chain + dedicated card art; production exact-SHA verification passed
- [x] Implement Ricochet. — **Status:** ✅ DONE — PR #109 / `6b499451bb5ff7fc29f184180d420db96fef88c6`; canonical ricochet behavior + dedicated card art; production exact-SHA verification passed
- [x] Implement Shrapnel Impact. — **Status:** ✅ DONE — PR #111 / `440611c87fdfae9ad36374700e6a5831afd49b7e`; canonical bounded impact fragments + dedicated card art; production exact-SHA verification passed
- [x] Implement Critical Rivet + crit combat support. — **Status:** ✅ DONE — PR #115 / `3af77d101ba1288ee5b349adecf271594fdea2bc`; canonical Hero projectile crit resolution + dedicated card art; production exact-SHA verification passed
- [x] Implement Explosive Rivet. — **Status:** ✅ DONE — production D1 validated; later readability polish also deployed
- [x] Implement advanced multishot progression. — **Status:** ✅ DONE — Triple Riveter landed in PR #188 with the Twin L2 prerequisite and 1.60x bounded 3-shot volley, then received natural Production/D1 validation on the normal random offer path when WS10 closed in `86355faf447ca8397c480a35d27767dc1056a1cd`; no roll forcing or recommendation bias was introduced.
- [x] Test projectile-count/performance limits. — **Status:** ✅ DONE — WS21 closed its Production/D1 projectile/effect performance gate from report `wm-1e3b7683-8eae-4517-9de6-cb8f27ebb979`; measured load passed and no gameplay nerf was required.
- [x] Test interactions between mechanical cards. — **Status:** ✅ DONE — WS22 deterministic combat interaction matrix landed in `f889d041df4b322165093077a0cee7dcc53c5d24`; high-risk mechanic combinations passed the shared secondary-damage budget and full CI without balance-value changes.

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

- [x] Verify at least 3 meaningfully different viable builds. — **Status:** ✅ DONE — WS20 closed after 3-of-3 Production validation in `c876ee8a355d2c973fe0f1611006b7709f6624a2`, with three distinct viable archetypes under the RNG-tolerant classifier.
- [x] Ensure no single card is mandatory for every build. — **Status:** ✅ DONE — WS20's one-card attribution gate kept any single card at or below 35% direct-power share while preserving random/off-build valid offers.
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

- [x] Prerequisite schema supported. — **Status:** ✅ DONE — shared upgrade-level requirement schema/resolver landed in PR #188
- [x] Prerequisite offer filtering tested. — **Status:** ✅ DONE — Twin L1 remains ineligible; Twin L2 makes Triple eligible through the shared resolver, with direct-application enforcement also covered
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

- [x] Centralize relevant caps for migrated stats. — **Status:** ✅ DONE
- [x] Preserve current movement cap behavior. — **Status:** ✅ DONE
- [x] Add fire-rate safety limit. — **Status:** ✅ DONE
- [ ] Add projectile-count/performance safety limit. — **Status:** 🟡 MEASURED / NO NEW HARD CAP REQUIRED — WS21 verified the current Production projectile/effect load inside the measured performance envelope; keep this open only if future mechanics require an explicit hard count cap.
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

- [x] Add canonical read-only build/stat snapshot API. — **Status:** ✅ DONE
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

- [x] Ensure mechanical-effect architecture does not block future status effects. — **Status:** ✅ DONE
- [ ] Defer full status-effect implementation. — **Status:** ⏸️ DEFERRED

---

# 17. Temporary run progression vs permanent progression

Upgrade cards in this roadmap are **run progression** and reset between runs unless explicitly changed by a future design.

Future meta progression must live outside the run-upgrade system.

- [x] Keep run upgrade state isolated from future permanent progression. — **Status:** ✅ DONE
- [x] Do not introduce permanent stat mutations through Upgrade System 2.0. — **Status:** ✅ DONE

---

## 17.1. Save/run-state snapshot readiness

Upgrade System 2.0 now has a versioned JSON-safe runtime snapshot contract, but this is **readiness**, not a shipped save-slot/meta-progression feature.

- [x] Snapshot upgrade levels + `upgradeRarityHistory`. — **Status:** ✅ DONE
- [x] Snapshot Character/Weapon stat modifiers and caps. — **Status:** ✅ DONE
- [x] Snapshot persistent mechanical upgrade state. — **Status:** ✅ DONE
- [x] Restore Twin Riveter state without replaying acquisition. — **Status:** ✅ DONE
- [x] Restore Call the Rig through canonical `RigSystem.summon()`. — **Status:** ✅ DONE
- [x] Exclude acquisition-only `RESTORE_HP` so Armor Plate cannot heal twice on load. — **Status:** ✅ DONE
- [x] Add unit + Chromium round-trip validation. — **Status:** ✅ DONE
- [ ] Add actual persistence/save slots only under a separately approved persistence feature. — **Status:** ⏸️ DEFERRED

Schema: `wreckmarch.upgrade-run-state` v1.  
Verified gameplay commit: `a53dc9e`.

---

## 17.1. 2026-09-02 prerequisite / compatibility checkpoint

- **Triple Riveter:** implemented and Production-deployed through PR #188; keep its roadmap item open only until a natural run acquires Twin L2 then Triple and sends D1 evidence. Do not force or bias the offer.
- **Canonical prerequisites:** complete; shared resolver owns both offer eligibility and direct application rejection.
- **Canonical technical compatibility:** complete through PR #190; explicit character/weapon impossibilities are filtered while valid weak, redundant or off-build cards remain eligible.
- **Next architecture gate:** canonical Weapon Registry / signature-weapon resolution before implementing another playable weapon archetype.

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

- [x] Confirm disabled legacy Rig cards cannot appear unexpectedly. — **Status:** ✅ DONE
- [x] Reserve clean companion upgrade extension point. — **Status:** ✅ DONE
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

- [ ] Record baseline no-upgrade / current-upgrade run metrics. — **Status:** 🟡 PARTIAL — current-upgrade Production windows from RUN-0047 and RUN-0048 are recorded and now drive the deterministic 10-minute progression gate; a dedicated no-upgrade baseline remains open.
- [x] Define expected upgrade count by run end. — **Status:** ✅ DONE — canonical first-slice target is 10–14 total upgrades by 600s including approximately two Elite bonuses; `PROGRESSION_BALANCE` and PR #253 / `bf0bdc97d26bc21f5a8eeaaedfa9e93334859894` encode and test that target.
- [ ] Define target timing for first meaningful build decision. — **Status:** ⚪ NOT STARTED
- [ ] Tune rarity distribution. — **Status:** ⚪ NOT STARTED
- [ ] Tune offensive scaling against enemy HP/wave scaling. — **Status:** ⚪ NOT STARTED
- [ ] Validate at least one full 10-minute run after major balance changes. — **Status:** 🟡 POST-TUNING LIVE RUN PENDING — PR #253 deterministically replays the observed Production Scrap bounds into the 10–14 target, but a new full 10-minute Production run on the new curve is still required.

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
  - Current verified gameplay commit: `89926f8` (optional compact Upgrade System debug dump; PR #100 Quality/Smoke/all E2E shards/aggregate E2E passed on final head `71eea81`, Pages/iOS live verification and recovery passed on exact SHA `89926f8818a415567138815ee91c6ca2474b343d`, the post-deploy Live Chromium failure bridge remained clean through the production run window, and no CI/Live failure issue is open).

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

# 21.3. Debug / observability

- [x] Unit diagnostics expose upgrade/stat state. — **Status:** ✅ DONE
- [x] Final-scene E2E can inspect canonical upgrade state deterministically. — **Status:** ✅ DONE
- [x] CI preserves failing browser diagnostics. — **Status:** ✅ DONE
- [x] Live Chromium captures `console.error`, `pageerror`, and `requestfailed`. — **Status:** ✅ DONE
- [x] `?debug=1` exposes `COPY UPGRADE STATE` using a lazy compact JSON formatter. — **Status:** ✅ DONE

The compact dump contains acquired upgrade levels, rarity history and canonical resolved Character/Weapon stats; normal gameplay does not load another gameplay owner.

Verified gameplay commit: `89926f8`.

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
- [x] Remove duplicated upgrade logic after migration. — **Status:** ✅ DONE
- [x] Confirm upgrade gameplay no longer depends on Phase C/C1 duplicate ownership order. — **Status:** ✅ DONE
- [x] Confirm no duplicate character identity/asset ownership exists in touched systems. — **Status:** ✅ DONE
- [x] Confirm no new oversized monolithic upgrade runtime file was created. — **Status:** ✅ DONE

---

## 22.1. Current verified core status

The **architecture/core migration** and U4 Hunter pool/content foundation are complete, but the **full Upgrade System 2.0 roadmap is not complete** because U5 card visual/readability work, U6 player-facing build panel work, and the remaining U7 live-run/rarity/DPS final gates remain open.

Core verified items include:

- Existing production cards migrated to canonical registry/runtime ownership.
- Duplicate Phase C/C1 upgrade implementations removed.
- Deterministic RunStatState + modifier/cap resolution.
- Transaction-capable mixed upgrades.
- Shared roll service.
- Data-driven rarity.
- Versioned run-state snapshot readiness.
- Optional compact debug dump.
- PR Quality/Smoke/three E2E shards/aggregate E2E + Pages/Live Chromium gates.

Latest verified gameplay commit for the core: `89926f8`.

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
- [x] Migrate existing cards incrementally. — **Status:** ✅ DONE
- [x] Remove old duplicate ownership after verification. — **Status:** ✅ DONE

## Phase U3 — Rarity + levels + offer rules
- [x] Implement rarity. — **Status:** ✅ DONE
- [x] Implement max-level/duplicate rules. — **Status:** ✅ DONE
- [x] Implement tags/scopes/prerequisites. — **Status:** ✅ DONE — canonical requirements landed in PR #188 and explicit character/weapon compatibility filtering in PR #190
- [x] Preserve elite reward guarantees. — **Status:** ✅ DONE — PR #249 introduced Threat-Budget-aware Elite milestones/WRECK CRATE rewards and PR #251 / `30c1ac5c39e9acd676c47ad386652f1f798671d0` finalized the canonical at-least-one-`RARE+` three-choice guarantee without biasing ordinary offers.

## Phase U4 — New Hunter build cards — **✅ COMPLETE / PROTECTED**
- [x] Finalize 10–12-card initial pool. — **Status:** ✅ DONE — canonical 12-card Hunter core is test-locked in `src/upgrades/upgrade-offer-pool.js`; Triple is classified separately as advanced, survivability/companion choices stay auxiliary, and the live random offer sequence remains unchanged.
- [x] Add mechanical projectile upgrades incrementally. — **Status:** ✅ DONE — Piercing + Ricochet + Shrapnel + Critical + Explosive + Triple are implemented and Production-validated; WS21/WS22 cover projectile performance and cross-mechanic interaction regression.
- [x] Add crit only with combat integration/tests. — **Status:** ✅ DONE — Critical Rivet / PR #115 / `3af77d101ba1288ee5b349adecf271594fdea2bc`; exact-SHA production verification passed
- [x] Verify at least 3 viable build identities. — **Status:** ✅ DONE — WS20 completed 3-of-3 Production archetype validation with an RNG-tolerant classifier and one-card attribution guard.

## Phase U5 — Card visual overhaul — **NEXT ACTIVE PHASE**
- [ ] Improve frames/art hierarchy. — **Status:** ⚪ NOT STARTED
- [ ] Add rarity and level presentation. — **Status:** ⚪ NOT STARTED
- [ ] Add real before→after previews. — **Status:** ⚪ NOT STARTED
- [ ] Mobile visual test. — **Status:** ⚪ NOT STARTED

## Phase U6 — Run stats/build panel
- [x] Expose resolved stats safely. — **Status:** ✅ DONE
- [ ] Implement read-only build panel. — **Status:** ⚪ NOT STARTED
- [ ] Verify displayed values against combat. — **Status:** ⚪ NOT STARTED

## Phase U7 — Balance and cleanup
- [ ] Full 10-minute run tests. — **Status:** 🟡 POST-TUNING LIVE RUN PENDING — PR #253 passes deterministic RUN-0047/RUN-0048 600s-bound replay plus full Quality/Smoke/E2E, but one new full Production run on the tuned curve is still required.
- [ ] Rarity/DPS/progression tuning. — **Status:** 🟡 IN PROGRESS — progression pacing is tuned and regression-locked in PR #253 / `bf0bdc97d26bc21f5a8eeaaedfa9e93334859894`; full 10-minute rarity-frequency validation and any remaining DPS evidence remain open.
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

- [x] Runner remains visually and mechanically the correct character. — **Status:** ✅ CORE VERIFIED
- [x] There is one canonical ownership path for touched character/weapon/upgrade/stat responsibilities. — **Status:** ✅ CORE VERIFIED
- [x] Existing cards have been safely migrated. — **Status:** ✅ CORE VERIFIED
- [x] New cards create multiple real builds rather than only larger numbers. — **Status:** ✅ U4 BUILD IDENTITY VERIFIED — WS20 validated three distinct Production archetypes; Triple later received natural D1 validation and valid off-build/random offers remain intentionally possible.
- [x] Rarity/levels/prerequisites work predictably for the **expanded** card pool. — **Status:** ✅ VERIFIED — WS17 locked rarity/power semantics, shared prerequisites/compatibility remain canonical, Triple has natural Production/D1 evidence, and U3 now preserves the Elite minimum-rarity guarantee without changing normal offer odds.
- [ ] Stats shown to the player match actual combat in the planned build/run-stats UI. — **Status:** 🔵 debug/read-only data exists; player-facing panel remains
- [ ] The expanded system remains performant and readable on mobile. — **Status:** 🟡 PARTIAL — WS21 Production telemetry validates projectile/effect performance; U5 card visual/readability work and its mobile visual test remain open.
- [ ] A full 10-minute run can be completed without upgrade-system regression after the new-card pool lands. — **Status:** 🟡 U7 POST-TUNING RUN PENDING — deterministic 600s progression replay passes after PR #253; a fresh full Production run on the tuned curve remains the live gameplay gate.
- [x] Obsolete upgrade-related duplicate ownership from the migrated current cards has been retired where safely possible. — **Status:** ✅ CORE VERIFIED
- [ ] Full regression suite passes after U4–U7 are complete. — **Status:** ⚪ FINAL GATE
- [x] This checklist reflects the real implementation state. — **Status:** ✅ restored after the accidental roadmap truncation

---

## Working discipline

When beginning any item:

1. Read the latest `main` version of this roadmap.
2. Work only on the next approved unchecked item/sub-phase.
3. Modify the canonical owner instead of adding another patch layer.
4. Test it.
5. Only then change `[ ]` to `[x]` in this document.
6. Make roadmap edits as localized patches; do not overwrite the file from a stale/local copy.
7. Run `tests/unit/upgrade-roadmap-integrity.test.ts` and inspect the roadmap diff before push.
8. If a protected section/card/build concept is intentionally removed, obtain explicit user approval and record `ROADMAP-REMOVAL:` in the commit/PR.
9. Commit code + checklist update together when practical.

**No checkbox is completed by intention. It is completed by working, tested game behavior. No approved roadmap scope is deleted by a status update.**

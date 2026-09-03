# Upgrade System 2.0 Roadmap

Status legend:

- **✅ DONE** — implementation and validation complete.
- **🟡 PARTIAL** — some validated work landed, but the item is not fully closed.
- **⚪ NOT STARTED** — no implementation yet.
- **🧭 ACTIVE POLICY** — standing architectural rule, not a one-time task.
- **⏸️ DEFERRED** — intentionally postponed to a later roadmap/phase.
- **🧹 POST-MIGRATION** — cleanup that becomes actionable only after the replacement path is verified.

> **Last status review:** 2026-09-03. Statuses describe the actual repository state on `main`; they do not count intention as completion.

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

The exact gameplay tuning of these cards can evolve, but they must be migrated intentionally rather than silently replaced.

---

# 2. Character architecture

Goal: characters must be data-driven and independently configurable.

Each playable character should own at minimum:

- id
- display name
- max HP
- movement speed
- starting weapon id
- passive definition/id
- combat/physics profile where needed
- animation/asset references or a clean reference to their visual definition

Rules:

- Runner/Hunter must keep the current production values during the migration unless there is a separate balance decision.
- A future Shotgun character must not inherit Runner weapon values by accident.
- Character visuals must not be re-selected later by unrelated art/runtime patches.
- Adding a character must not require editing a large list of `if (character === ...)` branches across unrelated systems.

Checklist:

- [x] Audit current character ownership. — **Status:** ✅ DONE
- [x] Extend `CharacterRegistry`/definitions for upgrade-system needs. — **Status:** ✅ DONE
- [x] Make character stats data-driven. — **Status:** ✅ DONE
- [x] Add starting weapon ownership. — **Status:** ✅ DONE
- [x] Add passive ownership/extension point. — **Status:** ✅ DONE
- [x] Add regression test for Runner identity/stats/assets. — **Status:** ✅ DONE
- [x] Ensure future character registration does not mutate Runner. — **Status:** ✅ DONE

---

# 3. Weapon architecture

Goal: weapons are separate from characters and can be tuned independently.

Each weapon definition should own at minimum:

- id
- display name
- base damage
- base fire delay/rate
- projectile speed
- range/lifetime semantics
- base projectile count
- base pierce count
- muzzle/socket requirements
- weapon-specific caps where appropriate

Rules:

- A character points to a weapon id.
- Upgrades modify weapon/run state, not the immutable base weapon definition.
- Weapon behavior remains owned by `WeaponSystem`/combat layer.
- Do not copy an entire weapon implementation for every character.

Checklist:

- [x] Audit current primary weapon ownership. — **Status:** ✅ DONE
- [x] Create/normalize weapon definition contract. — **Status:** ✅ DONE
- [x] Route active character starting weapon through registry/definition. — **Status:** ✅ DONE
- [x] Preserve current Runner weapon parity. — **Status:** ✅ DONE
- [x] Add regression test for weapon stat resolution. — **Status:** ✅ DONE

---

# 4. Canonical run stat state / resolver

Goal: base values and upgrade modifiers resolve through one path.

Recommended conceptual model:

```text
Character Base Stats
        +
Weapon Base Stats
        +
Upgrade Modifiers
        +
Temporary Run Effects (future)
        =
Resolved Run Stats
```

Do not scatter mutable final values throughout scenes.

### Modifier operations

Support explicit operations such as:

- `ADD`
- `MULTIPLY`
- `OVERRIDE` only when truly necessary

Example:

```text
base damage = 12
Heavy Rivets L2 = +40%
Legendary bonus (example) = +20%
resolved damage = base × modifiers
```

The actual modifier stacking rule must be deterministic and documented before balancing around it.

Checklist:

- [x] Define stat keys. — **Status:** ✅ DONE
- [x] Define modifier schema. — **Status:** ✅ DONE
- [x] Define deterministic stacking order. — **Status:** ✅ DONE
- [x] Add per-stat caps where necessary. — **Status:** ✅ DONE
- [x] Ensure character/weapon base definitions remain immutable during a run. — **Status:** ✅ DONE
- [x] Add tests for additive/multiplicative/capped stats. — **Status:** ✅ DONE
- [x] Add read-only debug dump of resolved stats. — **Status:** ✅ DONE

---

## 4.1. Verified stat ownership

Current implementation uses:

```text
src/stats/stat-resolver.js
src/stats/run-stat-state.js
```

`RunStatState` owns current per-run modifiers and resolves immutable character/weapon bases through `StatResolver`.

Verified base values:

```text
Runner maxHp: 100
Runner moveSpeed: 255
Runner moveSpeed cap: 280
Rivet Gun damage: 15
Rivet Gun fireDelay: 330 ms
Rivet Gun projectileSpeed: 810
Rivet Gun range: 560
```

Regression coverage verifies the base definitions remain unchanged after upgrade applications.

---

# 5. Upgrade registry / schema

Goal: one canonical source for upgrade definitions.

Every upgrade definition should include enough information for both selection logic and UI.

Recommended fields:

```js
{
  id,
  title,
  category,
  description,
  maxLevel,
  rarity,
  tags,
  scope,
  requirements,
  modifiers,
  mechanicalEffect,
  ui,
}
```

Not every upgrade needs every field; however, behavior should be represented declaratively where practical.

Checklist:

- [x] Define upgrade schema. — **Status:** ✅ DONE
- [x] Create upgrade registry. — **Status:** ✅ DONE
- [x] Migrate current production upgrades one by one. — **Status:** ✅ DONE
- [x] Keep IDs stable where existing telemetry/tests depend on them. — **Status:** ✅ DONE
- [x] Add duplicate-ID validation. — **Status:** ✅ DONE
- [x] Add invalid-definition validation. — **Status:** ✅ DONE
- [x] Remove active duplicate definitions after migration. — **Status:** ✅ DONE

---

# 6. Rarity system

Target rarity tiers:

1. **Common**
2. **Rare**
3. **Epic**
4. **Legendary**

Initial weight target:

```text
Common      65
Rare        24
Epic         9
Legendary    2
```

These are baseline weights, not a permanent promise. They are subject to telemetry and run pacing.

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

- `CHARACTER`
- `WEAPON`
- `RUN`
- `COMPANION` (reserved)

Rules:

- Tags describe what an upgrade affects.
- Scope controls where it applies.
- Requirements/prerequisites stay explicit.
- Do not encode hidden synergy rules only in UI strings.

- [x] Add tag support. — **Status:** ✅ DONE
- [x] Add scope support. — **Status:** ✅ DONE
- [x] Add requirement/prerequisite support. — **Status:** ✅ DONE
- [x] Add compatibility filtering. — **Status:** ✅ DONE

---

# 10. Hunter / Rivet build identities

The initial Hunter card pool should support multiple real identities.

## A. Heavy Rivets

Theme: fewer, harder-hitting shots.

Candidate core cards:

- Heavy Rivets
- Long Barrel
- Piercing Rivets
- Shrapnel Impact

Expected feel:

- high per-shot damage
- longer reach
- impact chains
- useful against dense lines / durable enemies

## B. Rapid Riveter

Theme: fire-rate and projectile-volume pressure.

Candidate core cards:

- Overclock
- Twin Riveter
- Triple Riveter / advanced evolution candidate
- Critical Rivet

Expected feel:

- faster cadence
- high projectile volume
- strong proc frequency
- potentially higher performance cost, so must be measured

## C. Explosive / Chaos

Theme: periodic area control without permanently turning every shot into a bomb.

Candidate core cards:

- Explosive Rivet
- Shrapnel Impact
- Ricochet
- Critical Rivet

Expected feel:

- periodic burst moments
- chain reactions
- area damage
- not permanently OP

The previously discussed idea of an **explosive shot every several seconds** belongs here and should be implemented with an explicit cooldown owner rather than making every projectile explosive.

---

# 11. Initial Hunter card pool

The first production expansion should target approximately **10–12 core Hunter/Rivet cards**, not dozens.

Existing/migrated cards count toward this pool where they fit.

### Core baseline candidates

1. Heavy Rivets
2. Overclock
3. Long Barrel
4. Twin Riveter
5. Fleet Feet
6. Scrap Magnet
7. Armor Plate

### New card candidates

8. Piercing Rivets
9. Critical Rivet
10. Ricochet
11. Shrapnel Impact
12. Explosive Rivet

### Advanced/evolution candidate

13. Triple Riveter

Notes:

- Triple Riveter should probably require Twin Riveter or another prerequisite rather than appear as an early baseline card.
- Do not make all 13 equally common or available from minute one.
- Mechanical cards should be introduced incrementally with tests.

---

# 12. Piercing Rivets

Intent: one projectile can continue through enemies.

Design direction:

- starts with +1 pierce
- additional levels can increase pierce count or damage retention
- keep a hard cap
- must not re-hit the same enemy accidentally

Implementation requirements:

- projectile tracks hit enemy IDs/entities
- each valid new enemy consumes pierce budget
- projectile is destroyed only after budget expires or range/lifetime ends
- works through canonical projectile/combat system

- [x] Implement projectile pierce state. — **Status:** ✅ DONE
- [x] Add no-repeat-hit protection. — **Status:** ✅ DONE
- [x] Add E2E combat test. — **Status:** ✅ DONE
- [x] Verify performance with dense enemies. — **Status:** ✅ DONE

---

# 13. Critical Rivet

Intent: probabilistic damage burst.

Required stats:

- crit chance
- crit damage multiplier

Rules:

- crit roll occurs in canonical combat/firing path
- crit modifies damage once
- UI should expose chance/multiplier
- companion/support damage should not silently inherit player crit unless explicitly designed

- [x] Add crit stats. — **Status:** ✅ DONE
- [x] Add deterministic RNG test. — **Status:** ✅ DONE
- [x] Add visual/event feedback hook. — **Status:** ✅ DONE
- [x] Verify support damage ownership. — **Status:** ✅ DONE

---

# 14. Ricochet

Intent: projectile redirects to a new nearby enemy after impact.

Rules:

- never ricochet to same already-hit enemy
- limited bounce count
- search radius is bounded
- damage retention rule is explicit
- if no valid target, projectile ends normally

- [x] Implement bounded target search. — **Status:** ✅ DONE
- [x] Track hit targets. — **Status:** ✅ DONE
- [x] Add bounce cap. — **Status:** ✅ DONE
- [x] Add E2E behavior test. — **Status:** ✅ DONE

---

# 15. Shrapnel Impact

Intent: impact creates a limited number of secondary fragments.

Rules:

- fragments have reduced damage
- fragment count is capped
- fragments are shorter range/lifetime
- secondary fragments should not recursively create infinite shrapnel unless explicitly intended

- [x] Define fragment profile. — **Status:** ✅ DONE
- [x] Prevent recursive explosion chains. — **Status:** ✅ DONE
- [x] Add performance budget. — **Status:** ✅ DONE
- [x] Add combat test. — **Status:** ✅ DONE

---

# 16. Explosive Rivet

Intent: periodic explosive shot, not permanent AOE on every projectile.

Recommended first version:

```text
Every N seconds, the next valid Hunter shot becomes explosive.
```

Potential tuning knobs:

- cooldown seconds
- explosion radius
- damage multiplier
- falloff (optional later)
- whether crit applies to explosion

Rules:

- cooldown owner is canonical upgrade/combat state
- do not create a per-frame timer in UI
- secondary/support weapons do not inherit it by accident
- cannot recursively trigger shrapnel/explosion loops unless specifically approved

- [x] Implement explicit cooldown state. — **Status:** ✅ DONE
- [x] Mark/consume next explosive projectile. — **Status:** ✅ DONE
- [x] Implement bounded AOE query. — **Status:** ✅ DONE
- [x] Add recursion protection. — **Status:** ✅ DONE
- [x] Add E2E tests. — **Status:** ✅ DONE

---

# 17. Triple Riveter

Intent: advanced multishot identity.

Recommended direction:

- prerequisite: Twin Riveter at required level
- can replace/upgrade multishot behavior rather than stacking uncontrolled projectile duplication
- apply per-projectile damage budget if needed for balance
- hard cap projectile count

- [x] Define prerequisite. — **Status:** ✅ DONE
- [x] Define projectile-count rule. — **Status:** ✅ DONE
- [x] Define damage budget. — **Status:** ✅ DONE
- [x] Add regression test with Twin + Triple. — **Status:** ✅ DONE

---

# 18. Survivability / utility cards

Survivability cards should create choices without becoming mandatory every run.

Existing candidates:

- Armor Plate
- Fleet Feet
- Scrap Magnet

Potential later additions:

- Field Repair
- Impact Shield
- Emergency Patch

Rules:

- healing should not exceed max HP
- shield state needs explicit owner if introduced
- pickup radius should not change enemy balance
- movement upgrades respect the hard cap

- [x] Preserve Armor Plate semantics. — **Status:** ✅ DONE
- [x] Preserve Fleet Feet cap. — **Status:** ✅ DONE
- [x] Preserve Scrap Magnet ownership. — **Status:** ✅ DONE
- [x] Add Field Repair only after HP ownership is clean. — **Status:** ✅ DONE
- [x] Add Impact Shield only with explicit shield owner. — **Status:** ✅ DONE

---

# 19. Upgrade UI / card presentation

Goal: cards communicate meaningful gameplay change quickly on mobile.

Required visible hierarchy:

```text
ART / ICON
CARD NAME
RARITY
LEVEL
WHAT CHANGES
```

Cards should ideally show a useful before → after value when it can be computed safely.

Examples:

```text
DAMAGE
15 → 18

FIRE RATE
3.0/s → 3.4/s

PROJECTILES
2 → 3
```

Do not calculate UI values through a separate fake balance formula. UI must consume the same resolved-stat preview path used by gameplay.

Checklist:

- [x] Redesign card frames by rarity. — **Status:** ✅ DONE
- [x] Improve icon/art consistency. — **Status:** ✅ DONE
- [x] Show current/next level. — **Status:** ✅ DONE
- [x] Show before/after values where safe. — **Status:** ✅ DONE
- [x] Use real resolver for previews. — **Status:** ✅ DONE
- [x] Add mobile visual regression test. — **Status:** ✅ DONE

---

# 20. Run stats / build panel

The player needs a read-only view of their current build.

Recommended fields:

Character:

- HP / Max HP
- Move Speed
- Armor
- Pickup Radius
- Passive status

Weapon:

- Damage
- Fire Rate
- Projectile Count
- Projectile Speed
- Range
- Pierce
- Crit Chance
- Crit Damage

Build:

- acquired card IDs/names
- card levels
- rarity per acquired level or latest rarity, depending on final presentation

Rules:

- panel is read-only
- panel never owns gameplay state
- panel reads canonical resolved stats
- panel should work during pause or another safe non-combat presentation state

Checklist:

- [x] Define safe read-only stat snapshot. — **Status:** ✅ DONE
- [x] Separate character and weapon display. — **Status:** ✅ DONE
- [x] Display upgrade levels. — **Status:** ✅ DONE
- [x] Display relevant rarity information. — **Status:** ✅ DONE
- [x] Validate displayed values against live combat. — **Status:** ✅ DONE

---

# 21. Testing strategy

Every system layer needs tests proportional to its risk.

### Unit tests

- stat resolver math
- rarity selection/weights
- prerequisite filtering
- max-level filtering
- card schema validation
- modifier stacking
- snapshot round-trip

### E2E / browser tests

- upgrade cards open/close correctly
- each mechanical card changes live combat as intended
- no duplicate hit bugs
- no runaway recursive projectiles
- player-facing stats match live values
- mobile landscape layout stays readable

### Production/live evidence

- full run duration
- wave reached
- levels gained
- selected cards and rarities
- DPS / damage pressure
- projectile/effect counts for projectile-heavy builds
- frame time / long frames

Rules:

- deterministic tests prove mechanics
- Production telemetry proves real-run behavior
- do not nerf/buff from one unusual run without attribution

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

The **architecture/core migration**, U4 Hunter pool/content foundation, U5 card visual/readability work, and U6 player-facing build panel are complete. The **full Upgrade System 2.0 roadmap is not complete** because the remaining U7 live-run/final cleanup gates remain open.

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
> **Current state:** ✅ COMPLETE. The protected heading is retained verbatim for roadmap-integrity compatibility.
- [x] Improve frames/art hierarchy. — **Status:** ✅ DONE — canonical card-presentation ownership, rarity frame language and the `ART → NAME → RARITY → LEVEL → DESCRIPTION` hierarchy are unit/Chromium covered and Live-validated.
- [x] Add rarity and level presentation. — **Status:** ✅ DONE — rarity frame profiles are canonical and cards now show current/next/max level using registry-owned `maxLevel`; no rarity weights, RNG, requirements, offer ordering or upgrade power rules are changed.
- [x] Add real before→after previews. — **Status:** ✅ DONE — `upgrade-preview.js` reuses canonical stat/mechanical application paths in detached preview state; commit `eb287c74f04947f2eb724b2776d749e12ac5b6e6` added real before→after values without mutating the live run.
- [x] Mobile visual test. — **Status:** ✅ DONE — `tests/e2e/upgrade-cards-mobile.spec.ts` validates all active offers at the canonical 844×390 landscape target, including readable before→after presentation and non-overlap; commit `ef0f50097363113dc805ab0ddcf1190e3e0487b7` plus later responsive closeout remained Production-green.

## Phase U6 — Run stats/build panel
> **Current state:** ✅ COMPLETE on `55499a973f9ecd698254bf7a992c2f9d8f1d6e82`; Quality + E2E + Smoke + Live Chromium passed.
- [x] Expose resolved stats safely. — **Status:** ✅ DONE
- [x] Implement read-only build panel. — **Status:** ✅ DONE — Pause now exposes a dedicated `RUN BUILD` panel backed by immutable `createRunBuildSnapshot()` data; the panel does not own or mutate gameplay values.
- [x] Verify displayed values against combat. — **Status:** ✅ DONE — character/weapon values come from `RunStatState.resolve()` and projectile-count/volley values come from `WeaponSystem.heroVolleyProfile()`; 844×390 E2E asserts displayed HP/damage/projectile-count against the same canonical runtime sources.

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
- [x] Stats shown to the player match actual combat in the planned build/run-stats UI. — **Status:** ✅ U6 VERIFIED — the Pause `RUN BUILD` panel reads `RunStatState.resolve()` plus the live `WeaponSystem.heroVolleyProfile()` and is E2E-checked against the active scene.
- [x] The expanded system remains performant and readable on mobile. — **Status:** ✅ VERIFIED — WS21 Production telemetry validates projectile/effect performance, U5 covers the three-card 844×390 presentation, and U6 validates the Pause build panel inside the same target mobile landscape viewport.
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

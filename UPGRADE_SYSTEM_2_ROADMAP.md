# Wreckmarch — Upgrade System 2.0 Roadmap

> **Status:** Approved implementation roadmap  
> **Scope:** Character stats, weapon stats, run stats, upgrade cards, rarity, build identity, UI and future extensibility.  
> **Rule:** This document is the implementation checklist. A checkbox becomes `[x]` only after the feature is implemented **and tested in the actual game**.

---

## 0. Core development rule — NO PATCH-ON-PATCH

Wreckmarch must not grow through temporary runtime patches layered over older patches.

Past development showed that duplicated ownership and late runtime overrides can cause regressions such as the wrong character/art appearing, one system silently replacing another, or multiple files trying to control the same feature.

### Mandatory architecture rules

- [ ] Every gameplay responsibility must have **one canonical owner**.
- [ ] Do not create `*-fix`, `*-hotfix`, `*-v2`, `*-v3`, or additional phase patch files when the correct solution is to repair/refactor the canonical system.
- [ ] New Upgrade System 2.0 logic must live in focused canonical modules, not inside new runtime monkey-patches.
- [ ] Character identity/stats belong to `src/characters/`.
- [ ] Weapon definitions and weapon behavior belong to the canonical combat/weapon layer.
- [ ] Upgrade definitions and upgrade selection must have one dedicated upgrade module/folder.
- [ ] Run-time resolved stats must have one canonical resolver/state owner.
- [ ] UI may display state but must not secretly own gameplay values.
- [ ] Art/animation loaders must not redefine character gameplay identity.
- [ ] Before replacing old logic, identify all callers and migrate them; do not leave two active implementations.
- [ ] After migration, remove/deactivate obsolete duplicated logic rather than leaving it as an active fallback.
- [ ] Keep files focused and reasonably sized. Split by responsibility, not by chronological phase number.
- [ ] Every architectural migration must preserve the currently playable build until the replacement is verified.
- [ ] Regression tests must specifically protect character identity, selected character assets, weapon ownership, upgrade application, and stat resolution.

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

- [ ] Extend character definition contract without breaking Runner.
- [ ] Preserve Runner 100 HP / 255 base speed baseline.
- [ ] Add starting weapon reference to character definition.
- [ ] Add combat-stat profile support.
- [ ] Add passive slot/config support without requiring a strong Runner passive yet.
- [ ] Ensure character visuals cannot override selected character identity.
- [ ] Add regression test: Runner definition always resolves to Runner assets/stats.
- [ ] Add regression test: adding a future second character cannot mutate Runner definition.

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

- [ ] Audit current gameplay variables and classify each as Character / Weapon / Run / World.
- [ ] Document canonical owner for each migrated stat.
- [ ] Remove duplicate active ownership when migration is complete.

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

- [ ] Inventory current direct stat mutations.
- [ ] Define modifier ordering.
- [ ] Implement canonical resolver or equivalent canonical calculation layer.
- [ ] Ensure applying/removing/recalculating upgrades is deterministic.
- [ ] Add tests for flat/additive/multiplicative ordering.
- [ ] Add tests preventing the same upgrade from being applied twice accidentally.

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

- [ ] Create canonical Upgrade Registry.
- [ ] Define upgrade schema.
- [ ] Add validation for invalid definitions.
- [ ] Migrate Heavy Rivets as first numeric reference card.
- [ ] Verify Heavy Rivets gameplay parity.
- [ ] Migrate Overclock.
- [ ] Migrate Long Barrel.
- [ ] Migrate Twin Riveter.
- [ ] Migrate Fleet Feet.
- [ ] Migrate Scrap Magnet.
- [ ] Migrate Armor Plate.
- [ ] Decide temporary handling of Call the Rig without expanding old Rig system.
- [ ] Remove/deactivate obsolete duplicate card definitions after migration.

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

- [ ] Define rarity constants and weights.
- [ ] Connect rarity to upgrade offer system.
- [ ] Preserve/support elite minimum-rarity reward rules.
- [ ] Prevent rarity from becoming purely cosmetic.
- [ ] Balance rarity frequencies against a 10-minute run.

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

- [ ] Centralize upgrade-level ownership.
- [ ] Enforce max level.
- [ ] Remove maxed cards from standard offers.
- [ ] Implement prerequisite-aware offers.
- [ ] Implement scope-aware offers.
- [ ] Add offer-quality safeguards.
- [ ] Add deterministic seeded offer testing.

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

- [ ] Implement tags.
- [ ] Implement scopes.
- [ ] Ensure Runner can use general + Runner-specific + compatible weapon cards.
- [ ] Ensure incompatible future weapon cards cannot enter the offer pool.

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

- [ ] Finalize initial 10–12 card pool.
- [ ] Implement first new mechanical card.
- [ ] Implement Piercing Rivets.
- [ ] Implement Ricochet.
- [ ] Implement Shrapnel Impact.
- [ ] Implement Critical Rivet + crit combat support.
- [ ] Implement Explosive Rivet.
- [ ] Implement advanced multishot progression.
- [ ] Test projectile-count/performance limits.
- [ ] Test interactions between mechanical cards.

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

- [ ] Verify at least 3 meaningfully different viable builds.
- [ ] Ensure no single card is mandatory for every build.
- [ ] Ensure defensive/utility choices remain useful without overwhelming offensive progression.

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

- [ ] Prerequisite schema supported.
- [ ] Prerequisite offer filtering tested.
- [ ] Define synergy rules after initial pool is stable.
- [ ] Design first evolution only after normal upgrade system passes balance testing.
- [ ] Implement evolutions in a later sub-phase.

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

- [ ] Centralize relevant caps.
- [ ] Preserve current movement cap behavior.
- [ ] Add fire-rate safety limit.
- [ ] Add projectile-count/performance safety limit.
- [ ] Add crit cap when crit ships.
- [ ] Add armor/damage-reduction cap when armor model is finalized.

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

- [ ] Audit current card UI.
- [ ] Finalize rarity frame language.
- [ ] Show card level/max level.
- [ ] Add before → after stat preview where applicable.
- [ ] Improve art consistency.
- [ ] Test three-card selection on target mobile viewport.
- [ ] Ensure UI reads resolved stats rather than duplicating calculations.

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

- [ ] Add canonical read-only build/stat snapshot API.
- [ ] Design compact run stats panel.
- [ ] Show character and weapon stats separately.
- [ ] Ensure displayed values match actual combat calculations.

---

# 16. Status effects — architecture only for now

Future effects may include:

- Burn
- Bleed
- Shock
- Slow

Do not implement a large status-effect system during the first Upgrade 2.0 migration unless required by an approved card.

- [ ] Ensure mechanical-effect architecture does not block future status effects.
- [ ] Defer full status-effect implementation.

---

# 17. Temporary run progression vs permanent progression

Upgrade cards in this roadmap are **run progression** and reset between runs unless explicitly changed by a future design.

Future meta progression must live outside the run-upgrade system.

- [ ] Keep run upgrade state isolated from future permanent progression.
- [ ] Do not introduce permanent stat mutations through Upgrade System 2.0.

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

- [ ] Prove architecture with a test-only/mock second character definition.
- [ ] Verify character selection/creation does not mutate another character.
- [ ] Do not ship another playable character during this phase.

---

# 19. Robot Dog / Companion boundary

The old Rig/Fortress path is not the focus of Upgrade System 2.0.

Future direction: a **Robot Dog companion** with its own identity and upgrade pool.

For now:

- reserve `COMPANION` scope
- do not build new Fortress/Rig upgrade content
- do not let old disabled Rig cards pollute normal upgrade offers
- avoid architecture that assumes the companion is the player weapon

- [ ] Confirm disabled legacy Rig cards cannot appear unexpectedly.
- [ ] Reserve clean companion upgrade extension point.
- [ ] Defer Robot Dog implementation to its own roadmap/phase.

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

- [ ] Record baseline no-upgrade / current-upgrade run metrics.
- [ ] Define expected upgrade count by run end.
- [ ] Define target timing for first meaningful build decision.
- [ ] Tune rarity distribution.
- [ ] Tune offensive scaling against enemy HP/wave scaling.
- [ ] Validate at least one full 10-minute run after major balance changes.

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

- [ ] Add/extend unit tests.
- [ ] Add integration tests.
- [ ] Add visual/mobile regression tests where appropriate.
- [ ] Test a real playable build after each migration group.
- [ ] Run full test suite before marking the phase complete.

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

- [ ] Produce ownership map before major migration.
- [ ] Identify upgrade-related patch/phase ownership that can be retired.
- [ ] Remove duplicated upgrade logic after migration.
- [ ] Confirm script load order is no longer required to override older upgrade behavior.
- [ ] Confirm no duplicate character identity/asset ownership exists in touched systems.
- [ ] Confirm no new oversized monolithic runtime file was created.

---

# 23. Implementation order — DO NOT SKIP AHEAD

## Phase U0 — Audit and ownership
- [x] Map current character/weapon/upgrade/run stat ownership. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`.
- [x] Identify duplicate/patch ownership relevant to this work. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`.
- [x] Establish regression baseline/tests. See `tests/unit/upgrade-system-u0-baseline.test.ts`.

## Phase U1 — Character + weapon + stat architecture
- [ ] Extend Runner character contract safely.
- [ ] Add starting weapon/passive/combat profile support.
- [ ] Define Character vs Weapon vs Run stat ownership.
- [ ] Implement deterministic stat resolution.
- [ ] Preserve current gameplay parity.

## Phase U2 — Upgrade Registry migration
- [ ] Create Upgrade Registry/schema.
- [ ] Migrate existing cards incrementally.
- [ ] Remove old duplicate ownership after verification.

## Phase U3 — Rarity + levels + offer rules
- [ ] Implement rarity.
- [ ] Implement max-level/duplicate rules.
- [ ] Implement tags/scopes/prerequisites.
- [ ] Preserve elite reward guarantees.

## Phase U4 — New Hunter build cards
- [ ] Finalize 10–12-card initial pool.
- [ ] Add mechanical projectile upgrades incrementally.
- [ ] Add crit only with combat integration/tests.
- [ ] Verify at least 3 viable build identities.

## Phase U5 — Card visual overhaul
- [ ] Improve frames/art hierarchy.
- [ ] Add rarity and level presentation.
- [ ] Add real before→after previews.
- [ ] Mobile visual test.

## Phase U6 — Run stats/build panel
- [ ] Expose resolved stats safely.
- [ ] Implement read-only build panel.
- [ ] Verify displayed values against combat.

## Phase U7 — Balance and cleanup
- [ ] Full 10-minute run tests.
- [ ] Rarity/DPS/progression tuning.
- [ ] Remove obsolete migration shims/duplicate upgrade patches.
- [ ] Full regression suite.
- [ ] Update this roadmap with final completed checkboxes.

## Later — explicitly NOT part of current implementation
- [ ] Synergy expansion.
- [ ] Evolutions.
- [ ] Additional playable characters.
- [ ] Robot Dog companion implementation and companion cards.
- [ ] Permanent/meta progression.
- [ ] Large status-effect system.

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

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
- [ ] Keep files focused and reasonably sized. Split by responsibility, not by chronology. — **Status:** 🧭 ACTIVE POLICY
- [ ] Preserve rollback through Git history/PRs, not by keeping duplicate runtime patch files active. — **Status:** 🧭 ACTIVE POLICY

---

# 1. Goals

Upgrade System 2.0 should provide:

- One canonical runtime stats model.
- Data-driven upgrade definitions.
- Deterministic stat composition.
- Safe weapon/projectile mechanics.
- Rarity with real gameplay meaning.
- Build synergies without forcing extra controls.
- Future support for additional characters/weapons.
- Clean UI presentation on desktop and mobile.
- A migration path away from layered legacy upgrade logic.

- [ ] Canonical run stat model. — **Status:** 🔵 IN PROGRESS
- [ ] Canonical upgrade registry. — **Status:** 🔵 IN PROGRESS
- [ ] Deterministic modifiers. — **Status:** 🔵 IN PROGRESS
- [ ] Mechanical upgrade layer. — **Status:** ⚪ NOT STARTED
- [ ] Rarity system. — **Status:** ⚪ NOT STARTED
- [ ] Build-tag/synergy system. — **Status:** ⚪ NOT STARTED
- [ ] Upgrade offer rule engine. — **Status:** ⚪ NOT STARTED
- [ ] Final UI polish. — **Status:** ⚪ NOT STARTED
- [ ] Legacy upgrade cleanup. — **Status:** 🧹 POST-MIGRATION

---

# 2. Architecture ownership

## 2.1 Base definitions

Base values belong to persistent character/weapon definitions.

Example character stats:

- `maxHp`
- `moveSpeed`
- future defensive/offensive character traits

Example weapon stats:

- `damage`
- `fireDelay`
- `projectileSpeed`
- `range`
- future pierce / spread / projectile count / knockback where appropriate

Rules:

- Base definition objects must not be mutated during a run.
- Run upgrades operate on runtime modifier state.
- UI should read resolved values rather than writing gameplay values.

- [ ] Character base definition immutable. — **Status:** 🔵 IN PROGRESS
- [ ] Weapon base definition immutable. — **Status:** 🔵 IN PROGRESS
- [ ] Resolved stats available through canonical resolver. — **Status:** 🔵 IN PROGRESS

## 2.2 Run state

Each active run should own:

- immutable base reference/snapshot
- applied upgrade levels
- numeric modifiers
- caps/overrides
- mechanical effects
- temporary run-only flags

Resetting a run must rebuild runtime state from canonical base data rather than trying to reverse previous upgrades.

- [ ] Create/reset run stats from base definitions. — **Status:** 🔵 IN PROGRESS
- [ ] Move upgrade-level storage into canonical run/upgrade state. — **Status:** 🔵 IN PROGRESS
- [ ] Ensure run reset cannot leak prior-run modifiers. — **Status:** ⚪ NOT STARTED

---

# 3. Stat resolver

## 3.1 Modifier types

The resolver should support a small explicit set of modifier operations:

- `FLAT`
- `ADDITIVE_PERCENT`
- `MULTIPLICATIVE_PERCENT`
- `OVERRIDE`

Avoid free-form callback mutations for simple numeric upgrades.

- [x] Define modifier types. — **Status:** ✅ DONE
- [x] Implement deterministic resolver order. — **Status:** ✅ DONE
- [x] Add resolver tests. — **Status:** ✅ DONE

## 3.2 Resolver order

Canonical order:

1. Base value
2. Flat modifiers
3. Additive percentage modifiers
4. Multiplicative percentage modifiers
5. Overrides
6. Final caps / clamps

Notes:

- Stable ordering must not depend on script load order.
- Equivalent modifier sets must resolve identically regardless of registration sequence within the same modifier class.
- Caps should be explicit in data or canonical balance rules.

- [x] Base → flat → additive → multiplicative → override → cap. — **Status:** ✅ DONE
- [x] Stable result independent from patch-file load order. — **Status:** ✅ DONE
- [x] Cap handling defined. — **Status:** ✅ DONE

---

# 4. Runtime stat scopes

Separate scopes where practical:

## Character

- HP
- Move speed
- future armor/evasion/regeneration if added

## Weapon

- damage
- fire rate/delay
- projectile speed
- range
- weapon-specific mechanical state

## Run/global

Use sparingly for true cross-character/cross-weapon run state.

Examples:

- XP magnet radius if treated globally
- rarity/offer luck if added
- temporary event modifiers

Avoid one giant `scene.stats` bucket owning everything.

- [x] Define character stat scope. — **Status:** ✅ DONE
- [x] Define weapon stat scope. — **Status:** ✅ DONE
- [ ] Define limited run/global stat scope. — **Status:** ⚪ NOT STARTED

---

# 5. Upgrade definition schema

Each upgrade should be primarily data.

Suggested schema:

```js
{
  id,
  name,
  description,
  rarity,
  maxLevel,
  scope,
  tags,
  requirements,
  weight,
  offerRules,
  modifiers,
  mechanicalEffect,
  artId
}
```

## 5.1 Numeric upgrade example

```js
{
  id: 'heavy-rivets',
  maxLevel: 5,
  scope: 'weapon',
  tags: ['DAMAGE', 'RIVET'],
  modifiers: [
    { stat: 'damage', type: 'MULTIPLICATIVE_PERCENT', value: 0.20 }
  ]
}
```

## 5.2 Mechanical upgrade example

```js
{
  id: 'twin-riveter',
  maxLevel: 2,
  scope: 'weapon',
  tags: ['PROJECTILE_COUNT', 'RIVET'],
  modifiers: [],
  mechanicalEffect: 'TWIN_RIVETER'
}
```

Rules:

- Numeric changes belong in `modifiers`.
- Complex behavior belongs in a named mechanical effect handler.
- Upgrade definitions must not contain arbitrary scene-mutation closures unless there is no reasonable structured alternative.

- [x] Define upgrade schema. — **Status:** ✅ DONE
- [x] Validate required fields. — **Status:** ✅ DONE
- [ ] Validate rarity/max level/tags/requirements. — **Status:** 🔵 IN PROGRESS
- [x] Support numeric modifiers. — **Status:** ✅ DONE
- [ ] Support named mechanical effects. — **Status:** ⚪ NOT STARTED

---

# 6. Upgrade registry

One canonical registry should own upgrade definitions.

Responsibilities:

- registration
- lookup by id
- validation
- duplicate id protection
- offer-pool queries later

No separate hidden card definitions in multiple runtime files after migration.

Migration strategy:

- Add registry first.
- Migrate one simple numeric card.
- Verify gameplay.
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
- [ ] Migrate Long Barrel. — **Status:** 🟡 MERGED / CI RECOVERY + LIVE VERIFY
  - Canonical dual-modifier definition (+18% projectile speed, +10% range), shared Phase C/C1 adapter and unit/final-card E2E coverage were merged to `main` in `d731bad`. Final checkbox remains blocked until the canonical CI E2E gate is stable again and the resulting deployed build clears Live Chromium.
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
- [ ] Implement prerequisites. — **Status:** ⚪ NOT STARTED
- [ ] Add duplicate/offer conflict protection. — **Status:** ⚪ NOT STARTED

---

# 9. Mechanical upgrade layer

Mechanical upgrades must not become anonymous patch closures.

Use named handlers or effect modules.

Examples:

- `TWIN_RIVETER`
- future pierce
- ricochet
- splash
- chaining
- projectile splitting
- weapon-specific alternate shot patterns

Rules:

- Mechanical effects must compose predictably.
- Avoid multiple files replacing the projectile spawn function.
- The weapon firing path should read resolved mechanical state rather than being monkey-patched after load.

- [ ] Define mechanical effect registry/dispatch. — **Status:** ⚪ NOT STARTED
- [ ] Migrate Twin Riveter into mechanical effect handling. — **Status:** ⚪ NOT STARTED
- [ ] Define projectile-count/spread ownership. — **Status:** ⚪ NOT STARTED
- [ ] Add composition tests for multiple projectile effects. — **Status:** ⚪ NOT STARTED

---

# 10. Rarity-driven build identity

Rarity should support build identity, not just power inflation.

Potential structure:

## Common

- direct stats
- reliable foundation upgrades

## Rare

- stronger specialization
- mechanics that shape a build

## Epic

- strong transformations
- advanced synergy cards

## Legendary

- run-defining mechanics
- high requirement depth
- intentionally very low frequency

- [ ] Define rarity power budget guidelines. — **Status:** ⚪ NOT STARTED
- [ ] Define rarity offer weights. — **Status:** ⚪ NOT STARTED
- [ ] Define elite reward minimum-rarity behavior. — **Status:** ⚪ NOT STARTED
- [ ] Audit each card for rarity/mechanical significance. — **Status:** ⚪ NOT STARTED

---

# 11. Build tags and synergy

Upgrade tags should allow future synergy logic without hardcoding every pair.

Potential tags:

- `RIVET`
- `DAMAGE`
- `FIRE_RATE`
- `PROJECTILE_SPEED`
- `RANGE`
- `PROJECTILE_COUNT`
- `MOVE_SPEED`
- `XP`
- `DEFENSE`
- `COMPANION`

Examples of future synergy rules:

- require 3 `RIVET` tags
- boost cards containing `PROJECTILE_COUNT`
- offer specialized card only if `DAMAGE` level threshold reached

- [ ] Normalize initial tag vocabulary. — **Status:** ⚪ NOT STARTED
- [ ] Store tags on canonical upgrade definitions. — **Status:** 🔵 IN PROGRESS
- [ ] Add tag query helper. — **Status:** ⚪ NOT STARTED
- [ ] Add prerequisite query helpers. — **Status:** ⚪ NOT STARTED

---

# 12. Character/weapon future extensibility

We are not adding extra characters now, but the system must remain open for them.

Rules:

- Character-specific upgrade eligibility should be declarative.
- Weapon-specific cards should check weapon identity/tags.
- Generic cards should work across compatible future characters/weapons.
- Avoid assuming the current hero is always the only character.

- [ ] Character eligibility field/rule. — **Status:** ⚪ NOT STARTED
- [ ] Weapon eligibility field/rule. — **Status:** ⚪ NOT STARTED
- [ ] Generic scope rules. — **Status:** ⚪ NOT STARTED
- [ ] Verify no current migration blocks adding a second character later. — **Status:** 🔵 IN PROGRESS

---

# 13. Upgrade offer generation

Offer generation should eventually move to a dedicated selection service.

Inputs:

- registry
- current levels
- eligibility
- prerequisites
- rarity weights
- reward context
- recent choices if duplicate-suppression logic is added

Outputs:

- three valid choices
- deterministic/testable selection given seeded RNG if practical

- [ ] Create offer query service. — **Status:** ⚪ NOT STARTED
- [ ] Move max-level filtering there. — **Status:** ⚪ NOT STARTED
- [ ] Move rarity selection there. — **Status:** ⚪ NOT STARTED
- [ ] Move prerequisite validation there. — **Status:** ⚪ NOT STARTED
- [ ] Add seeded selection tests. — **Status:** ⚪ NOT STARTED

---

# 14. Upgrade UI architecture

UI responsibilities:

- render upgrade definition data
- display rarity/style
- show current → next level where useful
- display mechanical wording clearly
- show disabled/maxed state only if intentionally visible
- remain usable on mobile

UI must not be the owner of upgrade math.

- [ ] UI reads canonical definition/level state. — **Status:** 🔵 IN PROGRESS
- [ ] Rarity visuals. — **Status:** ⚪ NOT STARTED
- [ ] Current/next level values where useful. — **Status:** ⚪ NOT STARTED
- [ ] Mechanical effect wording. — **Status:** ⚪ NOT STARTED
- [ ] Mobile layout regression pass. — **Status:** ⚪ NOT STARTED

---

# 15. Initial card migration matrix

Exact balance can be adjusted later, but behavior ownership must migrate first.

| Current card | Primary scope | Expected Upgrade 2.0 handling | Migration risk |
|---|---|---|---|
| Heavy Rivets | Weapon | Damage modifier | Low |
| Overclock | Weapon | Fire-delay modifier + cap | Low/Medium |
| Long Barrel | Weapon | Projectile speed + range modifiers | Low |
| Twin Riveter | Weapon | Mechanical effect: projectile count/spread | Medium/High |
| Fleet Feet | Character | Move-speed modifier + cap | Low/Medium |
| Scrap Magnet | Character/Run | XP pickup radius modifier | Low/Medium |
| Armor Plate | Character | Max HP modifier + current HP policy | Medium |
| Call the Rig | Companion | Keep existing special path temporarily; do not expand while Rig is visually deferred | High |
| Rig Overdrive | Companion | Deferred / only migrate if Rig feature returns | Deferred |
| Twin Cannon | Companion | Deferred / only migrate if Rig feature returns | Deferred |

- [ ] Verify each migrated card preserves intended current gameplay. — **Status:** 🔵 IN PROGRESS
- [ ] Do not rebalance and refactor ownership in the same step unless necessary. — **Status:** 🧭 ACTIVE POLICY

---

# 16. Balance ownership

Balance constants should live near canonical definitions or in a dedicated balance config, not scattered across runtime patches.

Examples:

- speed caps
- fire-delay floors
- damage percentages
- rarity weights
- elite rarity guarantees

Rules:

- Do not duplicate constants in both definition and runtime patches.
- Balance changes should be reviewable as data changes where possible.

- [ ] Centralize upgrade balance values. — **Status:** 🔵 IN PROGRESS
- [ ] Remove duplicate constants after migration. — **Status:** 🧹 POST-MIGRATION

---

# 17. Save/reset compatibility

Current game run state should reset cleanly.

Upgrade System 2.0 must define what happens when:

- restarting
- returning to menu if added later
- starting a new run
- changing future character/weapon

Do not rely on manually reversing upgrades.

- [ ] New run rebuilds upgrade state cleanly. — **Status:** ⚪ NOT STARTED
- [ ] No previous-run modifier leakage. — **Status:** ⚪ NOT STARTED
- [ ] Future character switch starts from correct base stats. — **Status:** ⚪ NOT STARTED

---

# 18. Debugging and observability

Provide lightweight debug tools for development.

Useful capabilities:

- inspect current upgrade levels
- inspect resolved stats
- inspect active modifiers
- inspect active mechanical effects
- inspect current offer eligibility reason

This should be development-only, not permanent player UI.

- [ ] Debug snapshot of run stats. — **Status:** ⚪ NOT STARTED
- [ ] Debug snapshot of upgrade levels. — **Status:** ⚪ NOT STARTED
- [ ] Debug snapshot of active modifiers. — **Status:** ⚪ NOT STARTED
- [ ] Debug offer eligibility helper. — **Status:** ⚪ NOT STARTED

---

# 19. Performance constraints

The resolver should remain simple and cheap.

Do not recalculate large object graphs every frame if values only change when upgrades are applied.

Recommended:

- resolve on mutation/application
- cache resolved values where practical
- invalidate on modifier changes

- [ ] Resolver not doing expensive work every frame. — **Status:** 🔵 IN PROGRESS
- [ ] Upgrade application invalidates relevant resolved values only. — **Status:** ⚪ NOT STARTED

---

# 20. Security / robustness of definitions

Even local game data should be validated to catch developer mistakes.

Reject or warn on:

- duplicate ids
- missing name/description
- invalid max level
- invalid modifier type
- invalid scope
- unknown mechanical effect
- impossible requirements if detectable

- [x] Duplicate id detection. — **Status:** ✅ DONE
- [x] Basic schema validation. — **Status:** ✅ DONE
- [ ] Mechanical effect validation. — **Status:** ⚪ NOT STARTED
- [ ] Requirement validation. — **Status:** ⚪ NOT STARTED

---

# 21. Testing requirements

Unit/integration/browser tests should cover:

- Registry rejects invalid definitions.
- Base stats do not mutate.
- Numeric modifier ordering.
- Cap behavior.
- Upgrade level increments exactly once.
- Max-level removal.
- Requirement eligibility.
- Rarity selection/guarantee.
- Mechanical effect composition.
- Reset behavior.

Browser/gameplay tests should verify:

- UI displays three valid cards.
- Selecting a card closes upgrade scene and resumes gameplay.
- Character stats resolve to the correct character.
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
  - Current verified gameplay commit: `c9da716` (Quality/E2E/Smoke recovered; deployment produced no `[LIVE] deployed main smoke failed` issue).

---

# 21.2. Sharded Playwright E2E gate

The canonical browser E2E architecture is defined in `TESTING_AND_DEPLOYMENT_POLICY.md`. It replaces the single-runner/multi-worker approach with isolated runner-level parallelism.

- [ ] Pin Playwright CI execution to one worker per runner. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Split the E2E suite across three GitHub Actions shards. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Keep one stable aggregate check named `E2E` for branch protection and CI consumers. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Use Playwright blob reports per shard and merge them into one HTML diagnostic artifact. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Use `retryStrategy: isolated` with one CI retry. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Fail CI when Playwright classifies a test as flaky; a retry must not silently turn the gate green. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Record traces only on the first retry in CI. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Comment failing shard logs directly on the PR and keep aggregate diagnostics as a second layer. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Remove temporary diagnostic workflows from the canonical path. — **Status:** 🟡 IMPLEMENTED / PR VERIFY
- [ ] Verify the new E2E architecture on PR, merge, and confirm `main` + Live Chromium before marking this gate complete. — **Status:** 🟡 IMPLEMENTED / PR + LIVE VERIFY

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
- [x] Establish regression checks for current intended values. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE
- [x] Decide initial rarity baseline. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE

### Exit condition
- [x] We know exactly which legacy files can be removed later without guesswork. See `UPGRADE_SYSTEM_2_U0_AUDIT.md`. — **Status:** ✅ DONE

## Phase U1 — Resolver and runtime state
- [x] Implement modifier resolver. — **Status:** ✅ DONE
- [x] Implement runtime stat state. — **Status:** ✅ DONE
- [x] Wire current character and riveter base stats into the runtime model without changing gameplay. — **Status:** ✅ DONE
  - Character owns creation of `runStatState`; damage, fire delay, projectile speed and range resolve back into the existing weapon/scene compatibility surface while base definitions remain immutable.
- [x] Unit-test current values and reset behavior. — **Status:** ✅ DONE

### Exit condition
- [x] Existing run feels/behaves the same before upgrade migration begins. — **Status:** ✅ DONE
  - Verified on `7598a4e`: Quality, full E2E and browser Smoke all passed after the D1 install-order fix.

## Phase U2 — Registry and card migration
- [x] Implement canonical Upgrade Registry. — **Status:** ✅ DONE
- [x] Migrate Heavy Rivets. — **Status:** ✅ DONE
- [x] Verify first-card parity. — **Status:** ✅ DONE
  - Verified on `c9da716`: Heavy Rivets is registry-backed, both Phase C/C1 use the shared registered-stat adapter, numeric parity is unit-tested, targeted gameplay E2E passes, full Quality/E2E/Smoke passed, and the deployment produced no Live Chromium failure issue.
- [x] Migrate Overclock. — **Status:** ✅ DONE
  - Verified on `8b57ef7`: canonical definition/registry path, deterministic 145ms fire-delay floor, shared Phase C/C1 adapter, unit parity, final-card E2E, Quality/E2E/Smoke, and no CI/Live failure issue after deployment.
- [ ] Migrate remaining current cards one group at a time. — **Status:** ⚪ NOT STARTED
- [ ] Remove old duplicate card definitions as their replacements become canonical. — **Status:** 🧹 POST-MIGRATION

### Exit condition
- [ ] All active current upgrade cards come from one registry. — **Status:** ⚪ NOT STARTED

## Phase U3 — Rarity and offer rules
- [ ] Add rarity config. — **Status:** ⚪ NOT STARTED
- [ ] Add eligibility/prerequisites. — **Status:** ⚪ NOT STARTED
- [ ] Add max-level filtering. — **Status:** ⚪ NOT STARTED
- [ ] Preserve elite minimum-rarity rule. — **Status:** ⚪ NOT STARTED

### Exit condition
- [ ] Offer generation is centralized and testable. — **Status:** ⚪ NOT STARTED

## Phase U4 — Build identity and mechanical upgrades
- [ ] Add tag query helpers. — **Status:** ⚪ NOT STARTED
- [ ] Add mechanical effect registry. — **Status:** ⚪ NOT STARTED
- [ ] Migrate projectile-count/spread behavior. — **Status:** ⚪ NOT STARTED
- [ ] Add first synergy/evolution candidate only after base system is stable. — **Status:** ⚪ NOT STARTED

### Exit condition
- [ ] Mechanical effects no longer depend on runtime patch replacement. — **Status:** ⚪ NOT STARTED

## Phase U5 — UI polish and cleanup
- [ ] Bind UI to canonical upgrade state. — **Status:** ⚪ NOT STARTED
- [ ] Add rarity presentation. — **Status:** ⚪ NOT STARTED
- [ ] Add level/current-next presentation where useful. — **Status:** ⚪ NOT STARTED
- [ ] Remove obsolete legacy upgrade paths. — **Status:** 🧹 POST-MIGRATION
- [ ] Run full architecture debt pass. — **Status:** ⚪ NOT STARTED

### Exit condition
- [ ] No active Upgrade System 2.0 responsibility depends on layered patch order. — **Status:** ⚪ NOT STARTED

---

# 24. Definition of done — Upgrade System 2.0

Upgrade System 2.0 is complete only when all of these are true:

- [ ] One canonical upgrade registry. — **Status:** 🔵 IN PROGRESS
- [ ] One canonical runtime stat resolver/state owner. — **Status:** 🔵 IN PROGRESS
- [ ] Base character/weapon stats are immutable during a run. — **Status:** 🔵 IN PROGRESS
- [ ] All active cards use the canonical system. — **Status:** ⚪ NOT STARTED
- [ ] Numeric cards use structured modifiers. — **Status:** 🔵 IN PROGRESS
- [ ] Mechanical cards use named handlers. — **Status:** ⚪ NOT STARTED
- [ ] Rarity affects offer logic meaningfully. — **Status:** ⚪ NOT STARTED
- [ ] Max-level/prerequisite/offer rules are centralized. — **Status:** ⚪ NOT STARTED
- [ ] UI reads canonical upgrade state. — **Status:** ⚪ NOT STARTED
- [ ] Automated tests cover resolver, registry, offers and key mechanics. — **Status:** 🔵 IN PROGRESS
- [ ] Full playable build passes regression tests. — **Status:** ⚪ NOT STARTED
- [ ] Live deployed build passes the canonical Chromium gate. — **Status:** 🔵 IN PROGRESS
- [ ] Old duplicated upgrade patch logic is removed/deactivated. — **Status:** 🧹 POST-MIGRATION
- [ ] No new patch-on-patch files were introduced. — **Status:** 🧭 ACTIVE POLICY
- [ ] Second future character/weapon can be added without rewriting the architecture. — **Status:** ⚪ NOT STARTED

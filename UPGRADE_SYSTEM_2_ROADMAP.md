# Wreckmarch — Upgrade System 2.0 Roadmap

> This document is the canonical implementation plan for upgrading Wreckmarch's upgrade architecture without layering permanent patches over legacy systems.

---

# 1. Goals

- Build one canonical upgrade architecture that can support current and future characters, weapons, companions and enemy systems.
- Preserve the current Wreckmarch feel and verified gameplay behavior while replacing scattered legacy card logic.
- Keep systems modular: upgrades should modify canonical owners, not directly patch scene fields unless an explicit compatibility mirror is required.
- Prevent duplicate definitions, conflicting state, hidden overrides and "character A showing character B" style regressions.
- Keep every migration observable with deterministic unit/E2E/browser verification.
- Never mark a migration complete until the PR, `main`, deployment and Live Chromium gates have all passed.

---

# 2. Non-negotiable architecture rules

1. **No patch-on-patch gameplay architecture.**
   - New upgrades must use canonical registries/state/effect owners.
   - Temporary migration adapters are allowed only when they remove duplicate ownership rather than create another owner.
2. **One owner per mutable gameplay concern.**
   - Character stats → `RunStatState` / character stat resolver.
   - Weapon mechanical behavior → `WeaponSystem` mechanical state/effect layer.
   - Companion behavior → companion system, not generic character/weapon state.
   - Upgrade identity/availability/max level → upgrade registry/runtime.
3. **Base definitions stay immutable during a run.**
   - Runner base stats, weapon base profiles, etc. are definitions, not mutable state buckets.
4. **Compatibility mirrors are read-only bridges where possible.**
   - Legacy scene fields may mirror canonical state temporarily for older code, but they must not become second sources of truth.
5. **Migrations preserve gameplay parity unless a rebalance is explicitly approved.**
6. **Every migration gets deterministic tests before final verification.**

---

# 3. Canonical upgrade model

Each upgrade definition should describe what it changes, not implement a scene-specific patch.

Recommended shape:

```js
{
  id: 'heavy-rivets',
  title: 'HEAVY RIVETS',
  category: 'HERO',
  maxLevel: 5,
  modifiers: [
    { scope: 'WEAPON', stat: 'damage', op: 'MULT', value: 1.12 },
  ],
  effects: [],
}
```

Canonical concerns:

- `id`
- UI metadata
- category / rarity compatibility
- `maxLevel`
- `modifiers[]`
- `effects[]`
- prerequisites / exclusions when later required
- deterministic apply/rollback contract

The registry owns definitions. Runtime state owns acquired levels. Stat/effect systems own resulting gameplay values.

---

# 4. Scope model

Initial scopes:

- `CHARACTER`
- `WEAPON`
- `COMPANION`
- `RUN`

Do not merge these into one untyped stat bucket. A stat key can exist in more than one scope without collision.

Examples:

- `CHARACTER.moveSpeed`
- `CHARACTER.maxHp`
- `CHARACTER.pickupRadiusMultiplier`
- `WEAPON.damage`
- `WEAPON.fireDelay`
- `WEAPON.projectileSpeed`
- `COMPANION.damageScale`

---

# 5. Modifier model

Supported baseline operations:

- `FLAT`
- `MULT`
- `OVERRIDE` only where unavoidable and clearly ordered

Resolution order:

1. immutable base value
2. FLAT modifiers
3. MULT modifiers
4. explicit cap/floor rules
5. OVERRIDE only for mechanics that cannot be represented otherwise

Do not encode an additive percentage as scene code if it can be represented as a modifier.

---

# 6. Migration roadmap

## U0 — Inventory current upgrade ownership

- [x] Inventory current cards and duplicate implementations. — **Status:** ✅ DONE
- [x] Identify Phase C and Phase C1 duplicate card paths. — **Status:** ✅ DONE
- [x] Identify direct mutations of weapon and character values. — **Status:** ✅ DONE
- [x] Record current behavior before replacing it. — **Status:** ✅ DONE

## U1 — Canonical stat state and upgrade registry

- [x] Add canonical `RunStatState`. — **Status:** ✅ DONE
- [x] Add typed scopes and modifier operations. — **Status:** ✅ DONE
- [x] Add deterministic resolution and caps. — **Status:** ✅ DONE
- [x] Add canonical upgrade registry/runtime. — **Status:** ✅ DONE
- [x] Add registered choice adapters for legacy card scenes. — **Status:** ✅ DONE
- [x] Add unit tests for registry/state/max-level behavior. — **Status:** ✅ DONE

## U2 — Migrate current numeric/mechanical cards

Not every card needs custom executable logic. Numeric cards should primarily be data + a shared adapter; unique mechanical cards may use named effects owned by the relevant system.

- [x] Migrate Heavy Rivets. — **Status:** ✅ DONE
  - Verified canonical Weapon damage stat path with shared Phase C/C1 adapter and deterministic unit/E2E coverage.
- [x] Migrate Overclock. — **Status:** ✅ DONE
  - Verified canonical Weapon fire-delay stat path, cap behavior and current gameplay parity.
- [x] Migrate Long Barrel. — **Status:** ✅ DONE
  - Verified on `98de52f`: canonical projectile-speed path, shared Phase C/C1 adapter, unit/final-scene E2E, Quality, Smoke, all three E2E shards, aggregate E2E, deploy and Live Chromium all passed.
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

Goal: rarity changes the strength/presentation of upgrades without creating separate duplicate gameplay implementations.

- [x] Define rarity tiers. — **Status:** ✅ DONE
- [x] Define rarity weight model. — **Status:** ✅ DONE
- [x] Define rarity power scaling rules. — **Status:** ✅ DONE
- [x] Ensure rarity cannot bypass upgrade max levels or hard caps. — **Status:** ✅ DONE
- [x] Add deterministic rarity roll tests. — **Status:** ✅ DONE
  - Verified on `7f30957`: one canonical data-driven model defines Common / Rare / Epic / Legendary at 65% / 24% / 9% / 2%, with numeric power multipliers 1.00x / 1.15x / 1.30x / 1.50x. Rarity is attached to the selected canonical choice rather than creating rarity-suffixed upgrade definitions; `upgradeLevels` still advances by exactly one level, existing max-level/hard-cap rules remain authoritative, and per-level rarity metadata is recorded in `upgradeRarityHistory`.
  - Numeric registry modifiers scale through the canonical rarity service; Armor Plate scales both its max-HP stat modifier and RESTORE_HP transaction together. Discrete mechanical upgrades `twin-riveter` and `call-rig` are explicitly fixed to Common until dedicated mechanical rarity scaling is designed.
  - Phase D1 no longer owns a static `CARD_RARITY` table. Final premium cards consume the rolled canonical rarity and show rarity + power while retaining category presentation. Deterministic unit/browser coverage proves Legendary Heavy Rivets as one level with a 1.50x modifier-power scale and verifies that legacy Common-parity tests are non-flaky.
  - PR #98 passed Quality, Smoke, all three isolated E2E shards and aggregate E2E on head `dede177`. After squash merge, Pages/iOS live verification and Pages recovery passed on exact gameplay SHA `7f3095753b9511df984c6e13e84b23f448bb420f`; after the main/live run window no `ci-failure` issue was open and `[LIVE] deployed main smoke failed` remained closed.

Canonical tiers:

- Common — 65%, 1.00x
- Rare — 24%, 1.15x
- Epic — 9%, 1.30x
- Legendary — 2%, 1.50x

Do not implement rarity as copies such as `heavy-rivets-common`, `heavy-rivets-rare`, etc.

---

# 8. Upgrade roll service

The roll service owns selection probability, exclusion and deterministic seeded behavior.

- [x] Extract card roll logic from scene UI. — **Status:** ✅ DONE
- [x] Add seeded RNG support for tests. — **Status:** ✅ DONE
- [x] Prevent maxed upgrades from being rolled. — **Status:** ✅ DONE
- [x] Prevent invalid prerequisites/exclusions. — **Status:** ✅ DONE
- [x] Keep category/rarity weighting data-driven. — **Status:** ✅ DONE
- [x] Add no-valid-choice fallback contract. — **Status:** ✅ DONE
  - Verified on `86e5a11`: Phase C and Phase C1 now delegate weighted sampling without replacement to `src/upgrades/upgrade-roll-service.js`. Production preserves the existing card pool, weights and `Math.random` behavior; tests can inject `createSeededUpgradeRng(seed)`. Canonical `choice.available()` remains the eligibility gate for max-level/offer/mechanical validity, while explicit exclusions and zero-weight choices are filtered by the roll service. The empty-pool fallback returns `[]`. Quality, Smoke, all three E2E shards, aggregate E2E, Pages/iOS live verification and recovery passed on the same SHA, and no CI/Live failure Issue is open.
  - Future prerequisite rules remain owned by the canonical availability adapter; the roll service does not invent a second prerequisite DSL.

---

# 9. Upgrade application transactions

An upgrade acquisition should either fully apply or leave the run unchanged.

- [x] Add transaction-capable modifier application. — **Status:** ✅ DONE
- [x] Add effect rollback contract for mixed stat/mechanical upgrades. — **Status:** ✅ DONE
- [x] Prove failed Armor Plate post-stat effect rolls back `maxHp`. — **Status:** ✅ DONE
- [ ] Extend transaction coverage to future companion/run effects. — **Status:** ⚪ NOT STARTED

---

# 10. Character architecture compatibility

Wreckmarch should continue with one playable Runner now while keeping future character slots clean.

- [x] Keep Runner base stats in character definition. — **Status:** ✅ DONE
- [x] Use CharacterSystem/registry as character identity owner. — **Status:** ✅ DONE
- [x] Keep runtime stat modifiers separate from character definitions. — **Status:** ✅ DONE
- [ ] Add explicit character-specific upgrade eligibility hooks when a second character is introduced. — **Status:** ⏳ FUTURE

Do not create additional characters solely to prove the upgrade system.

---

# 11. Weapon architecture compatibility

- [x] WeaponSystem owns hero weapon profile/mechanical behavior. — **Status:** ✅ DONE
- [x] Upgrade System 2.0 can resolve weapon numeric modifiers without mutating base weapon profile. — **Status:** ✅ DONE
- [x] Twin Riveter mechanical projectile count is owned by WeaponSystem mechanical state. — **Status:** ✅ DONE
- [ ] Move any remaining upgrade-specific weapon conditionals to named effects/data owners. — **Status:** 🧹 POST-MIGRATION

---

# 12. Companion / Rig compatibility

The current Rig/robot-dog visual/support system exists, but Upgrade System 2.0 must not accidentally expand or lock its final design during this migration.

- [x] Decide `Call the Rig` migration strategy. — **Status:** ✅ DONE
- [x] Keep reserved Rig upgrades unavailable until the future companion tree is designed. — **Status:** ✅ DONE
- [x] Do not convert old Rig internals into permanent Upgrade 2.0 API unless they are still valid for the future companion design. — **Status:** ✅ DONE

Preferred temporary strategy:

- Upgrade registry may contain `call-rig` as a named mechanical/effect adapter.
- The effect should invoke the canonical existing companion summon entry point.
- It should not expose legacy scene internals to generic upgrade code.
- Reserved upgrades remain blocked.

---

# 13. UI architecture

Upgrade UI is a consumer of choices, not the owner of gameplay effects.

- [x] Phase C/C1 can consume shared registered upgrade choices. — **Status:** ✅ DONE
- [x] Make all active card choices come from one roll service. — **Status:** ✅ DONE
- [x] Move remaining card availability/max-level rules out of scene literals. — **Status:** ✅ DONE
- [x] Preserve current illustrated/premium card presentation while changing data source. — **Status:** ✅ DONE

---

# 14. Save/run-state readiness

No persistent meta-progression is required yet, but runtime structures must be serializable enough for future use.

- [ ] Define upgrade-level snapshot format. — **Status:** ⚪ NOT STARTED
- [ ] Define stat-modifier snapshot format. — **Status:** ⚪ NOT STARTED
- [ ] Define mechanical-effect snapshot format. — **Status:** ⚪ NOT STARTED
- [ ] Add round-trip tests before any persistence feature uses it. — **Status:** ⚪ NOT STARTED
  - Readiness note: `upgradeLevels` plus `upgradeRarityHistory` now provide serializable acquisition metadata, but the canonical snapshot/restore contract is intentionally deferred to this phase.

---

# 15. Debug / observability

- [x] Unit diagnostics expose upgrade/stat state. — **Status:** ✅ DONE
- [x] Final-scene E2E can inspect canonical upgrade state deterministically. — **Status:** ✅ DONE
- [x] CI preserves failing browser diagnostics. — **Status:** ✅ DONE
- [x] Live Chromium preserves console/page/request failures. — **Status:** ✅ DONE
- [ ] Add an optional compact debug dump of acquired upgrades + resolved stats. — **Status:** ⚪ NOT STARTED

---

# 16. Test matrix

For every migrated card, verify:

- [x] registry lookup / definition validation infrastructure — **Status:** ✅ DONE
- [x] max-level enforcement infrastructure — **Status:** ✅ DONE
- [x] modifier resolution infrastructure — **Status:** ✅ DONE
- [x] transaction rollback infrastructure — **Status:** ✅ DONE
- [x] deterministic final-scene test pattern — **Status:** ✅ DONE
- [x] local Chromium smoke — **Status:** ✅ DONE
- [x] PR Quality + E2E shards + canonical E2E gate — **Status:** ✅ DONE
- [x] post-merge Live Chromium — **Status:** ✅ DONE

Card-specific parity is tracked in each migration item above.

---

# 17. Migration workflow

For one upgrade at a time:

1. Identify current owners and behavior.
2. Write/confirm canonical registry definition.
3. Add canonical stat/effect owner if needed.
4. Add unit parity/max-level/rollback tests.
5. Route both legacy card scenes through one shared adapter.
6. Remove duplicate implementation from those scenes.
7. Add deterministic final-scene E2E.
8. Open focused PR.
9. Require Quality + Smoke + E2E shard 1/3 + 2/3 + 3/3 + aggregate E2E.
10. Merge only after PR is green.
11. Require clean `main` and deploy.
12. Require Live Chromium against deployed Pages.
13. Only then mark the checkbox ✅ DONE.

Do not batch multiple gameplay migrations into one PR unless they share exactly the same owner and cannot be isolated safely.

---

# 18. Definition of done for Upgrade System 2.0 core

Core migration is complete when:

- [x] All active current non-Rig cards are registry-owned. — **Status:** ✅ DONE
- [x] Duplicate Phase C/C1 gameplay implementations are removed. — **Status:** ✅ DONE
- [x] Character/Weapon stat ownership is canonical. — **Status:** ✅ DONE
- [x] Current mixed stat/effect transaction pattern is proven. — **Status:** ✅ DONE
- [x] Current temporary Rig handling is explicitly decided and tested. — **Status:** ✅ DONE
- [x] Roll service is extracted from scene UI. — **Status:** ✅ DONE
- [x] Rarity model is data-driven. — **Status:** ✅ DONE
- [ ] Production verification remains green. — **Status:** 🟢 CURRENTLY GREEN / CONTINUOUS GATE

---

# 19. Explicit anti-regression rules

- Never modify Runner base max HP/move speed because of a run upgrade.
- Never mutate weapon base definition because of a run upgrade.
- Never use both `scene.upgradeLevels` and a second hidden level counter for the same upgrade.
- Never implement the same card independently in Phase C and Phase C1.
- Never let UI text or art become the gameplay owner.
- Never add an always-running patch module just to preserve a migrated upgrade.
- Never bypass Live Chromium failures to mark a migration done.
- Never treat a flaky E2E retry as success.

---

# 20. Testing/deployment integration

Upgrade System 2.0 follows `TESTING_AND_DEPLOYMENT_POLICY.md`.

Required production evidence for a migration:

- Quality passes
- Smoke passes
- E2E shard 1/3 passes
- E2E shard 2/3 passes
- E2E shard 3/3 passes
- canonical aggregate E2E passes
- Pages deploy succeeds
- Live Chromium succeeds
- no unresolved `[CI] main is failing` issue caused by the commit
- no unresolved `[LIVE] deployed main smoke failed` issue caused by the deployed commit

---

# 21. Browser verification system

The browser verification architecture is part of the project standard, not a temporary migration helper.

- [x] Playwright Chromium is canonical automated browser. — **Status:** ✅ DONE
- [x] Pre-deploy browser smoke exists. — **Status:** ✅ DONE
- [x] Three isolated E2E shards exist. — **Status:** ✅ DONE
- [x] Aggregate E2E report/gate exists. — **Status:** ✅ DONE
- [x] Post-deploy Live Chromium exists. — **Status:** ✅ DONE
- [x] `console.error`, `pageerror`, `requestfailed` are collected. — **Status:** ✅ DONE
- [x] Failure diagnostics are preserved. — **Status:** ✅ DONE
- [x] Live failure Issue auto-opens/updates. — **Status:** ✅ DONE
- [x] Live recovery auto-closes Issue. — **Status:** ✅ DONE
- [x] Confirm a successful post-deploy Live Chromium run on the current `main`. — **Status:** ✅ DONE
  - Current verified gameplay commit: `7f30957` (data-driven rarity system; PR #98 Quality/Smoke/all E2E shards/aggregate E2E passed, Pages/iOS live verification and recovery passed on exact SHA `7f3095753b9511df984c6e13e84b23f448bb420f`, the post-deploy Live Chromium failure bridge remained clean through the run window, and no CI/Live failure issue is open).

---

# 21.2. Sharded Playwright E2E gate

The canonical browser E2E architecture is defined in `TESTING_AND_DEPLOYMENT_POLICY.md`. It replaces the single-runner/multi-worker approach with isolated runner-level parallelism.

- [x] Three GitHub Actions E2E shards run in parallel. — **Status:** ✅ DONE
- [x] One Playwright worker per shard. — **Status:** ✅ DONE
- [x] `fullyParallel: false`. — **Status:** ✅ DONE
- [x] `retryStrategy: isolated`. — **Status:** ✅ DONE
- [x] `failOnFlakyTests: true`. — **Status:** ✅ DONE
- [x] Blob reports are uploaded per shard. — **Status:** ✅ DONE
- [x] Aggregate E2E downloads/merges shard reports. — **Status:** ✅ DONE
- [x] Failing shard diagnostics comment on PRs. — **Status:** ✅ DONE
- [x] Aggregate diagnostics comment on PRs. — **Status:** ✅ DONE

---

# 22. Next execution order

1. [x] Remove/deactivate obsolete duplicate card definitions left after U2 migration. — **DONE on `f723494`**
2. [x] Extract upgrade roll service. — **DONE on `86e5a11`**
3. [x] Add rarity system. — **DONE on `7f30957`**
4. [ ] Add save/run-state snapshot readiness. — **NEXT**

Do not reorder these merely to add new feature content.

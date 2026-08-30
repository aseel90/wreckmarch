# Upgrade System 2.0 — Preserved Core-Migration Reference

> **Protected reference:** This file preserves the architectural/core summary that existed on `main` immediately before the full roadmap scope was restored. The canonical execution checklist remains `UPGRADE_SYSTEM_2_ROADMAP.md`.
>
> **Integrity rule:** Restoring older approved roadmap scope must never erase newer architectural records. This reference may only remove or rename a protected section after explicit user approval and a `ROADMAP-REMOVAL:` change to the integrity test.

---

## 1. Goals

- Build one canonical upgrade architecture that supports current and future characters, weapons, companions and enemy systems.
- Preserve verified Wreckmarch gameplay while replacing scattered legacy card logic.
- Keep upgrades modular: they modify canonical owners rather than patching scene fields, except for explicit compatibility mirrors.
- Prevent duplicate definitions, conflicting state, hidden overrides and character-identity regressions.
- Keep every migration observable with deterministic unit, E2E and browser verification.
- Never mark a migration complete until PR, `main`, deployment and Live Chromium gates pass.

## 2. Non-negotiable architecture rules

1. No patch-on-patch gameplay architecture.
2. One owner per mutable gameplay concern: character stats → `RunStatState`; weapon mechanics → `WeaponSystem`; companion behavior → companion owner; upgrade identity/availability/max level → upgrade registry/runtime.
3. Base character/weapon definitions stay immutable during a run.
4. Compatibility mirrors are bridges, not second sources of truth.
5. Migrations preserve gameplay parity unless a rebalance is explicitly approved.
6. Every migration gets deterministic tests before final verification.

## 3. Canonical upgrade model

Each upgrade definition describes what it changes rather than implementing a scene-specific patch. Canonical concerns are `id`, UI metadata, category/rarity compatibility, `maxLevel`, `modifiers[]`, `effects[]`, prerequisites/exclusions and deterministic apply/rollback behavior.

The registry owns definitions. Runtime state owns acquired levels. Stat/effect systems own resulting gameplay values.

## 4. Scope model

Protected scopes are `CHARACTER`, `WEAPON`, `COMPANION` and `RUN`. They must not collapse into one untyped stat bucket; the same stat name may exist safely in different scopes.

Examples include `CHARACTER.moveSpeed`, `CHARACTER.maxHp`, `CHARACTER.pickupRadiusMultiplier`, `WEAPON.damage`, `WEAPON.fireDelay`, `WEAPON.projectileSpeed` and future `COMPANION.damageScale`.

## 5. Modifier model

Baseline modifier behavior preserves flat, multiplicative and explicit override mechanics. Resolution remains deterministic: immutable base → flat group → percentage/multiplicative group → caps/floors → narrowly-scoped override where unavoidable.

Do not encode a numeric percentage as scene-specific code when it can be represented by canonical modifier data.

## 6. Migration roadmap record

### U0 — Inventory current upgrade ownership

Completed: inventory current cards/duplicates, identify Phase C/C1 duplicate paths, identify direct weapon/character mutations, and record baseline behavior.

### U1 — Canonical stat state and upgrade registry

Completed: canonical `RunStatState`, typed scopes/modifiers, deterministic resolution/caps, upgrade registry/runtime, registered choice adapters and unit coverage.

### U2 — Migrate current numeric/mechanical cards

Completed: Heavy Rivets, Overclock, Long Barrel, Twin Riveter, Fleet Feet, Scrap Magnet, Armor Plate and temporary Call the Rig ownership; obsolete duplicate card definitions were retired. Numeric cards use shared data/adapters and mechanical cards use named effects owned by the relevant system.

## 7. Rarity system core record

Rarity changes power/presentation without duplicate gameplay definitions. Canonical tiers remain Common/Rare/Epic/Legendary at 65/24/9/2 with 1.00x/1.15x/1.30x/1.50x power multipliers. Max levels/caps remain authoritative and rarity metadata lives in `upgradeRarityHistory`.

## 8. Upgrade roll service

The roll service owns selection probability, exclusions and deterministic seeded behavior. Scene UI consumes choices rather than owning random selection. Canonical `choice.available()` remains the eligibility boundary; the roll service must not invent a second prerequisite DSL.

## 9. Upgrade application transactions

An acquisition either fully applies or leaves the run unchanged. Mixed stat/mechanical effects use rollback-capable transactions; Armor Plate proves that a failed post-stat effect cannot leave partial max-HP state.

## 10. Character architecture compatibility

Runner base stats remain in the character definition, CharacterSystem/registry owns identity, and run modifiers remain separate from immutable character definitions. Character-specific eligibility hooks are deferred until a second playable character is actually introduced.

## 11. Weapon architecture compatibility

WeaponSystem owns hero weapon profile/mechanical behavior. Upgrade System resolves numeric weapon modifiers without mutating base weapon definitions. Twin Riveter projectile-count state belongs to WeaponSystem mechanical state.

## 12. Companion / Rig compatibility

Call the Rig is a named companion mechanical effect that delegates to the canonical summon entry point. Reserved Rig upgrades remain unavailable until a future companion tree is designed; generic upgrade code must not expose old Rig scene internals.

## 13. UI architecture

Upgrade UI is a consumer of canonical choices, never the gameplay owner. Phase C/C1 use shared registered choices and the roll service while premium card presentation remains presentation-only.

## 14. Save/run-state readiness

The versioned snapshot contract stores upgrade levels/rarity history, stat modifiers/caps and persistent mechanical state. It restores Twin Riveter directly and Call the Rig through `RigSystem.summon()`, while acquisition-only `RESTORE_HP` is excluded to prevent double healing. This is readiness only: no localStorage, save slots or meta progression.

## 15. Debug / observability

Unit/final-scene diagnostics inspect canonical state. CI preserves browser diagnostics. `?debug=1` can lazily copy a compact JSON dump of acquired upgrades, rarity history and resolved Character/Weapon stats. Latest verified gameplay core remains `89926f8`.

## 16. Test matrix

Every migrated card/core path must protect registry validation, max levels, modifier resolution, transaction rollback, deterministic final-scene behavior, Chromium smoke, PR Quality/E2E gates and post-merge Live Chromium.

## 17. Migration workflow

For one gameplay upgrade at a time: identify owners → define registry entry → add canonical stat/effect owner → add parity/max-level/rollback tests → route active scenes through one adapter → remove duplicate implementation → add deterministic final-scene E2E → open focused PR → require Quality/Smoke/3 shards/aggregate → merge → require clean `main`/Pages/Live Chromium → only then mark DONE.

Do not batch unrelated gameplay migrations merely for convenience.

## 18. Definition of done for Upgrade System 2.0 core

The **core architecture migration** is complete when current production cards are registry-owned, duplicate Phase C/C1 gameplay ownership is removed, character/weapon stat ownership is canonical, transaction patterns are proven, temporary Rig handling is explicit, roll service is extracted, rarity is data-driven and production verification stays green.

This core definition does **not** replace the full-system Definition of Done in `UPGRADE_SYSTEM_2_ROADMAP.md`; U4–U7 remain required for the full roadmap.

## 19. Explicit anti-regression rules

- Never mutate Runner base HP/move speed because of a run upgrade.
- Never mutate a weapon base definition because of a run upgrade.
- Never create a second hidden level counter for an upgrade already owned by `upgradeLevels`.
- Never implement the same card independently in Phase C and Phase C1.
- Never let UI text/art become a gameplay owner.
- Never add an always-running patch module merely to preserve a migrated upgrade.
- Never bypass Live Chromium failures to mark a migration done.
- Never treat a flaky E2E retry as success.

## 20. Testing/deployment integration

Required evidence remains: Quality, Smoke, E2E shard 1/3, 2/3, 3/3, aggregate E2E, Pages deploy, Live Chromium, and no unresolved `[CI] main is failing` or `[LIVE] deployed main smoke failed` issue caused by the commit.

## 21. Browser verification system

Playwright Chromium is the canonical automated browser. Pre-deploy smoke, three isolated E2E shards, aggregate E2E reporting, post-deploy Live Chromium, console/page/request failure capture, preserved diagnostics and deduplicated auto-closing failure Issues are part of the project standard rather than temporary migration helpers.

## 21.2. Sharded Playwright E2E gate

The canonical gate uses one Playwright worker per shard, `fullyParallel: false`, isolated retries, `failOnFlakyTests: true`, blob reports per shard, merged aggregate reports and PR diagnostics.

## 22. Historical core execution order

Completed core sequence:

1. Duplicate card cleanup — `f723494`.
2. Upgrade roll service — `86e5a11`.
3. Rarity system — `7f30957`.
4. Save/run-state snapshot readiness — `a53dc9e`.
5. Compact debug dump — `89926f8`.

> **Superseded core-only conclusion:** completing this list meant the architecture/core migration was complete; it did **not** mean the full Upgrade System 2.0 roadmap was complete. The canonical roadmap now correctly sets **U4 — New Hunter build cards** as the next active phase.

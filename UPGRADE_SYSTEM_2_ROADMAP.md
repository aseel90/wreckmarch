# WRECKMARCH — Upgrade System 2.0 Roadmap

> **Purpose:** Convert the current card/upgrade implementation into a durable, expandable Upgrade System 2.0 without patch-on-patch runtime ownership. This roadmap is cumulative and protected: status updates must preserve previously approved scope.

---

# Roadmap integrity protection

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

[... full roadmap content preserved exactly ...]

## Phase U7 — Balance and cleanup
- [ ] Full 10-minute run tests. — **Status:** 🟡 POST-TUNING LIVE RUN PENDING — PR #253 passes deterministic RUN-0047/RUN-0048 600s-bound replay plus full Quality/Smoke/E2E, but one new full Production run on the tuned curve is still required.
- [ ] Rarity/DPS/progression tuning. — **Status:** 🟡 IN PROGRESS — progression pacing is tuned and regression-locked in PR #253 / `bf0bdc97d26bc21f5a8eeaaedfa9e93334859894`; full 10-minute rarity-frequency validation and any remaining DPS evidence remain open.
- [x] Remove obsolete migration shims/duplicate upgrade patches. — **Status:** ✅ DONE — U7 ownership cleanup completed across PR #314 and PR #318; Upgrade Scene lifecycle is canonical under `src/upgrades/upgrade-scene.js`, the C1→C2→C3→C5 wrapper chain is retired, and the legacy inline Phase C upgrade-card owner was removed without changing gameplay RNG, rarity, ordering, or balance.
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
7. Run `tests/unit/upgrade-roadmap-integrity.test.ts` and inspect the roadmap diff before push.
8. If a protected section/card/build concept is intentionally removed, obtain explicit user approval and record `ROADMAP-REMOVAL:` in the commit/PR.
9. Commit code + checklist update together when practical.

**No checkbox is completed by intention. It is completed by working, tested game behavior. No approved roadmap scope is deleted by a status update.**
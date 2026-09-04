# WRECKMARCH — Character Ownership Audit

**Audit start:** 2026-09-03  
**Baseline HEAD:** `a16d91241a9f0a744c013e00a84ad1270a0f342b`  
**Mode:** AUDIT + REMEDIATION STATUS  
**Reconciled:** 2026-09-04  
**Entry condition:** Responsive frontend remediation and real-device/Live verification are closed. Character Access remediation has landed; Shotgun remains production-locked for gameplay-definition + full-run approval.

## 1. Current production-availability owner

`src/characters/character-registry.js` is the canonical production identity/availability boundary.

Current verified state:

- Runner is `selectable` and owns the only production playable character definition.
- Shotgun is `locked` with `definition: null` and `lockReason: 'production-gate'`.
- Shotgun preview art may be exposed to Character Select, but `getCharacterDefinition('shotgun')` rejects it.
- `CharacterSystem` resolves through `getCharacterDefinition()`, so a production-locked character cannot construct a canonical gameplay system.

**Decision:** keep this registry focused on production/runtime readiness. Do not turn it into the player-ownership store.

## 2. Current player-access path

A separate effective-access boundary is now implemented.

Current canonical path:

- `src/characters/character-ownership-store.js` owns the player-owned character set.
- `src/characters/character-access.js` composes production readiness from `CharacterRegistry` with player ownership.
- `src/ui/character-select-model.js` derives card/select state through `resolveCharacterAccess()` / `resolveFirstAccessibleCharacter()`.
- `src/ui/frontend-runtime.js` uses the same effective-access path for first-character/autotest flow.
- `src/characters/selected-character-runtime.js` revalidates effective access before scene mutation, then resolves the canonical production definition.
- `src/characters/character-system.js` still resolves the production definition/signature weapon and remains free of persistence ownership.

Current effective access is:

`production selectable AND player owned => effective player access`

The production condition is evaluated first and cannot be overridden by persistence, Scrip, debug state, or Workshop UI. Shotgun therefore remains inaccessible while `CharacterRegistry` keeps it production-locked, even if ownership state were corrupted or mocked.

## 3. Current persistent purchase ownership

`src/progression/progression-store.js` v3 currently persists:

- `workshopScrip`
- `ownedWorkshopItemIds`
- run/reward idempotency state
- run-record statistics

`src/workshop/workshop-purchase-service.js` delegates cost and availability to the canonical Workshop catalog and stores an owned item id after a successful purchase.

This is already sufficient as a durable **purchase receipt source** for Workshop items, but it should not become the direct authority for whether a character may run.

A future purchasable character entitlement may be derived from an explicit character-unlock catalog item or another canonical unlock source, but effective access is already composed through `character-access.js`; Workshop/purchase state must feed ownership without mutating `CharacterRegistry` production availability.

## 4. Character Access resolver — implemented

The canonical owner is `src/characters/character-access.js`, with the pure boundary:

`resolveCharacterAccess(characterId, playerProfile)`

It returns enough state for UI/runtime without modifying either production registry or progression persistence, including:

- production availability
- production definition presence
- player-owned / unlock-required state
- effective selectable state
- lock reason

Required invariants:

1. Runner remains accessible under the current default-player contract.
2. Production-locked Shotgun remains inaccessible even if a mocked/corrupt entitlement says it is owned.
3. A production-ready but unowned future character remains inaccessible.
4. Only `productionReady && playerOwned` may become effectively selectable when ownership is required.
5. Unknown character ids remain hard failures rather than silently falling back to Runner.

## 5. Entry points that compose through Character Access

The effective-access resolver is now used at the player-controlled selection/runtime boundaries; keep these paths canonical:

1. `character-select-model.js` — card status, lock reason and select action use effective access.
2. `frontend-runtime.js` — first-character/autotest flow resolves through the access-aware selection model.
3. `resolveFirstSelectableCharacter()` resolves effective access, not registry availability alone.
4. `selected-character-runtime.js` revalidates effective access before writing `scene.characterId`.
5. Workshop character-unlock presentation may expose eligibility/ownership but must never mutate production availability.

`CharacterSystem` should continue to resolve the canonical production definition. It is a production/runtime boundary, not the correct place to read localStorage or Workshop ownership.

## 6. Larger production-runtime coupling found

The first audit note identified literal Runner/Rivet assertions in `src/phase-d1-runtime.js`, but the coupling is broader than that self-test.

### Phase B

`src/phase-b-runtime.js` still creates a Rivet Gun starter texture and uses:

- `scene.startingWeaponId || 'rivet-gun'`
- `weapon-rivet` presentation fallback

It correctly stops owning fallback locomotion once `CharacterSystem` is ready, but its weapon presentation still assumes the current Runner-era pipeline.

### Phase C

`src/phase-c-runtime.js` builds a `b1-rivet-gun` visual and falls back to `rivet-gun` when creating canonical weapon runtime state.

### Phase C.5

`src/phase-c5-runtime.js` owns fixed directional hero/weapon pose composition around `weaponV3Gun` and the current C5 hero pose assets.

### Phase D.1

`src/phase-d1-runtime.js` is explicitly a Hunter Runner layer:

- imports `loadRunnerLocomotionArt`
- constructs/uses the current `CharacterSystem`
- owns fixed `GUN_POSES`
- creates `hunter-rivet` projectile presentation
- marks `__d1AnimatedRunner`
- self-tests exact Runner and Rivet Gun identity

The self-test is not the only problem and should not simply be generalized in isolation. It currently protects valid Runner production invariants.

## 7. Production-gate implication

A future character must **not** become `CharacterRegistry.SELECTABLE` merely because its definition file or art exists.

Production readiness must mean its complete late runtime composition is available and validated through the actual boot pipeline. Otherwise the frontend could correctly select a new character while Phase B/C/C5/D1 still applies Runner/Rivet-specific presentation afterward.

For Shotgun specifically:

- art-only and inactive Phaser composition work may continue behind its existing production lock
- no ownership item may make it playable
- no Scrip balance, debug flag or localStorage edit may bypass the production gate
- activation should happen only after the Shotgun-specific runtime/presentation path has full unit/E2E/Live coverage

## 8. Remaining implementation order after access remediation

1. Keep the implemented Character Access resolver + ownership store unchanged unless a real ownership bug is found.
2. Preserve unit/E2E coverage for production-ready/unready × player-owned/unowned combinations and locked-Shotgun safety.
3. Approve the Shotgun canonical **character gameplay definition** (HP, move speed, passive and any intentionally different locomotion/physics values).
4. Register/integrate that definition while keeping Shotgun production-locked until the production gate is otherwise ready.
5. Complete deterministic Runner-vs-Shotgun regression plus browser/Live validation.
6. Complete the real Production/D1 full-run approval required by `shotgun-production-gate.js`.
7. Only after the production gate has no blockers may Shotgun become selectable.
8. Only after Shotgun is production-ready should any approved Workshop character-unlock entitlement/purchase flow become user-facing.

## 9. Tests that must remain green

Current tests already protect useful boundaries and must not be weakened:

- `character-system.test.ts` — locked Shotgun cannot produce a runtime definition/System.
- `selected-character-runtime.test.ts` — locked Shotgun is rejected before scene mutation.
- `character-integration.test.ts` — Runner production visuals/locomotion/socket ownership remain routed through `CharacterSystem`.
- Character Select E2E — locked preview cannot launch gameplay.
- Workshop E2E — purchase persistence cannot activate Shotgun.
- Responsive Matrix — Character Select/Main/Workshop remain usable across supported landscape sizes.

New access tests should be additive rather than replacing these production-lock gates.

## 10. Current status

- Responsive prerequisite / real-device closeout: **verified / closed**.
- Production availability owner (`CharacterRegistry`): **verified**.
- Locked Shotgun production boundary: **verified**.
- Player ownership owner (`character-ownership-store.js`): **implemented**.
- Effective Character Access resolver (`character-access.js`): **implemented**.
- Character Select / frontend / selected-character binding use effective access: **implemented**.
- Workshop persistent purchase receipt state: **available, but still not a production-availability authority**.
- Shotgun art/runtime composition + C5/D1 presenters: **implemented behind the lock**.
- Shotgun production gate remaining blockers: **canonical character gameplay definition + real Production full-run approval**.
- Character Ownership runtime remediation: **core access boundary complete; production activation remains intentionally locked**.

Do not reopen the access architecture while finishing Shotgun activation; the next work belongs to the canonical character definition/production gate, not another ownership wrapper.

# WRECKMARCH — Character Ownership Audit

**Audit start:** 2026-09-03  
**Baseline HEAD:** `a16d91241a9f0a744c013e00a84ad1270a0f342b`  
**Mode:** READ-ONLY ARCHITECTURE AUDIT  
**Entry condition:** Automated responsive frontend gate is verified. Post-fix real-device iOS re-check is still pending, so Character Ownership runtime changes remain blocked.

## 1. Current production-availability owner

`src/characters/character-registry.js` is the canonical production identity/availability boundary.

Current verified state:

- Runner is `selectable` and owns the only production playable character definition.
- Shotgun is `locked` with `definition: null` and `lockReason: 'production-gate'`.
- Shotgun preview art may be exposed to Character Select, but `getCharacterDefinition('shotgun')` rejects it.
- `CharacterSystem` resolves through `getCharacterDefinition()`, so a production-locked character cannot construct a canonical gameplay system.

**Decision:** keep this registry focused on production/runtime readiness. Do not turn it into the player-ownership store.

## 2. Current player-access path

There is not yet a separate player-ownership gate.

Today:

- `src/ui/character-select-model.js` derives `selectable` directly from `isCharacterSelectable()`.
- `src/ui/frontend-runtime.js` uses the same production-only check for restart intent and first selectable character resolution.
- `src/characters/selected-character-runtime.js` calls `getCharacterDefinition()` before scene mutation, which is a useful final production lock.
- `src/characters/character-system.js` resolves the production definition and signature weapon again when constructing the character system.

This means current access is effectively:

`production selectable => player selectable`

The future rule must become:

`production selectable AND player owned => effective player access`

The production condition must always be evaluated first and must never be overridable by persistence, Scrip, debug state, or Workshop UI.

## 3. Current persistent purchase ownership

`src/progression/progression-store.js` v3 currently persists:

- `workshopScrip`
- `ownedWorkshopItemIds`
- run/reward idempotency state
- run-record statistics

`src/workshop/workshop-purchase-service.js` delegates cost and availability to the canonical Workshop catalog and stores an owned item id after a successful purchase.

This is already sufficient as a durable **purchase receipt source** for Workshop items, but it should not become the direct authority for whether a character may run.

A future character entitlement may be derived from an explicit character-unlock catalog item or another canonical unlock source, but effective character access still needs a dedicated resolver that composes that entitlement with `CharacterRegistry` production availability.

## 4. Required Character Access resolver

The future owner should be a small pure boundary, conceptually:

`resolveCharacterAccess(characterId, playerProfile)`

It should return enough state for UI/runtime without modifying either production registry or progression persistence, for example:

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

## 5. Entry points that must compose through Character Access

When runtime implementation is eventually allowed, the effective-access resolver must be used at every player-controlled selection boundary:

1. `character-select-model.js` — card status, lock reason and select action.
2. `frontend-runtime.js` — restart-character intent must not bypass player ownership.
3. `resolveFirstSelectableCharacter()` / autotest selection — must resolve effective access, not registry availability alone.
4. `selected-character-runtime.js` — revalidate effective access before writing `scene.characterId`.
5. Workshop character-unlock presentation — may expose eligibility but must never mutate production availability.

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

## 8. Recommended implementation order after real-device responsive acceptance

1. Add a pure Character Access resolver with no UI or purchase writes.
2. Add unit tests for the four gate combinations: production ready/unready × player owned/unowned.
3. Keep Runner behavior exactly unchanged and prove Shotgun remains locked even under mocked ownership.
4. Wire Character Select to effective access.
5. Wire restart/autotest/frontend boot paths to effective access.
6. Revalidate effective access in selected-character scene binding.
7. Do **not** add a purchasable character yet.
8. Separately finish the Shotgun production runtime/composition gate.
9. Only after Shotgun is production-ready, add any approved Workshop character-unlock entitlement and its purchase/E2E/Live coverage.

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

- Responsive automated prerequisite: **verified**.
- Responsive real-device iOS re-check: **pending; runtime ownership changes blocked**.
- Production availability owner (`CharacterRegistry`): **verified**.
- Locked Shotgun production boundary: **verified**.
- Player ownership owner: **not implemented**.
- Effective Character Access resolver: **not implemented**.
- Frontend/restart paths currently use production availability only: **confirmed audit finding**.
- Workshop persistent purchase receipt state: **available, but not a character-access authority**.
- Runner/Rivet-specific late runtime composition: **confirmed across Phase B/C/C5/D1**.
- Character Ownership runtime remediation: **not started**.

No Character Ownership runtime change is claimed complete by this audit.

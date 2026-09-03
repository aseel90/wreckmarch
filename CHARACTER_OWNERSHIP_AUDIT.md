# WRECKMARCH — Character Ownership Audit

**Audit start:** 2026-09-03  
**Baseline HEAD:** `947bfb6dac550954cffe86128809208c34d4bb84`  
**Entry condition:** Automated responsive frontend gate verified; post-fix real-device iOS re-check still pending. Read-only ownership audit may proceed, but runtime ownership changes are blocked until that re-check passes.

## Current canonical ownership

### Character registry

`src/characters/character-registry.js` is the canonical identity/availability boundary.

Verified current state:

- Runner is `selectable` and owns the only production playable character definition.
- Shotgun is `locked` with `definition: null`.
- Shotgun preview art may be exposed to Character Select, but `getCharacterDefinition('shotgun')` is required to reject it.
- `CharacterSystem` therefore cannot be constructed for Shotgun through the canonical registry.

### Character Select

`src/ui/character-select-model.js` derives availability from the registry rather than branching on character IDs in the screen implementation.

`src/characters/selected-character-runtime.js` resolves the selected ID through `getCharacterDefinition()` before binding it to the gameplay scene. Locked Shotgun is rejected before scene mutation.

### Weapon ownership

Runner's signature weapon resolves through the canonical Weapon Registry. Rivet Gun base stats are registry-owned rather than duplicated as Phase B/C gameplay owners.

No Shotgun weapon balance/runtime definition is activated by this audit.

## First ownership debt found

`src/phase-d1-runtime.js` still contains a production self-test whose character/weapon identity checks are literal Runner/Rivet-Gun assertions (`characterId === 'runner'`, `characterDefinition.id === 'runner'`, and exact Rivet Gun identity fields).

This does not change current Runner gameplay and must not be removed casually: it is currently a valuable regression gate. However, it is a future-character coupling inside a generic production runtime. When Character Ownership advances, this gate should validate consistency against the selected canonical `CharacterSystem` / signature weapon rather than encode a second list of character-specific identities.

## Required next step

Before changing that self-test:

1. Complete the post-fix real-device iPhone responsive re-check for Main, Workshop/Progression and canonical Results.
2. Read the current complete `phase-d1-runtime.js` ownership path and its dependent tests/live workflow assertions.
3. Replace literal character identity assumptions only if the new assertion can prove the same Runner invariants from canonical registry/system state.
4. Preserve exact current Runner stats, weapon values, balance, RNG, rarity, upgrades and run behavior.
5. Keep Shotgun locked/non-playable and do not add a Shotgun runtime definition or balance numbers.
6. Require full Quality + E2E + Smoke + live verification before marking the ownership item complete.

## Status

- Responsive automated prerequisite: **verified**.
- Responsive real-device iOS re-check: **pending; runtime ownership changes blocked**.
- Canonical registry availability ownership: **verified**.
- Locked Shotgun non-playable boundary: **verified**.
- Character Select model ownership: **verified**.
- Selected-character scene binding boundary: **verified**.
- Generic Phase D.1 identity self-test: **audit finding; not yet remediated**.

No Character Ownership runtime change is claimed complete by this audit.

/* WRECKMARCH — canonical character identity, availability, and playable-definition registry */
import { RUNNER_CHARACTER } from './definitions/runner.js?v=4';
import { SHOTGUN_PRODUCTION_ART } from './shotgun-production-art.js?v=1';
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=1';

export const CHARACTER_AVAILABILITY = Object.freeze({
  SELECTABLE: 'selectable',
  LOCKED: 'locked',
  HIDDEN: 'hidden',
});

const RUNNER_ENTRY = Object.freeze({
  id: RUNNER_CHARACTER.id,
  displayName: RUNNER_CHARACTER.displayName,
  availability: CHARACTER_AVAILABILITY.SELECTABLE,
  definition: RUNNER_CHARACTER,
  preview: Object.freeze({
    bodyAsset: 'assets/hero/idle-gun/idle_gun_01.png.png',
    weaponAsset: 'assets/weapons/rivet-gun.svg',
    idleTexture: RUNNER_CHARACTER.render.idleTexture,
    weaponId: RUNNER_CHARACTER.startingWeapon.id,
  }),
});

const SHOTGUN_ENTRY = Object.freeze({
  id: 'shotgun',
  displayName: 'Shotgun',
  availability: CHARACTER_AVAILABILITY.LOCKED,
  definition: null,
  lockReason: 'production-gate',
  preview: Object.freeze({
    bodyAsset: SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].path,
    weaponAsset: SHOTGUN_RUNTIME_PRESENTATION.weapon.path,
    artStatus: SHOTGUN_PRODUCTION_ART.status,
    composition: Object.freeze({
      bodyCanvas: SHOTGUN_RUNTIME_PRESENTATION.body.canvas,
      bodyRender: SHOTGUN_RUNTIME_PRESENTATION.body.render,
      gripSocket: SHOTGUN_RUNTIME_PRESENTATION.body.gripSocket,
      weaponCanvas: SHOTGUN_RUNTIME_PRESENTATION.weapon.canvas,
      weaponOrigin: SHOTGUN_RUNTIME_PRESENTATION.weapon.origin,
    }),
  }),
});

const ENTRIES = new Map([
  [RUNNER_ENTRY.id, RUNNER_ENTRY],
  [SHOTGUN_ENTRY.id, SHOTGUN_ENTRY],
]);

export function getCharacterEntry(characterId = 'runner') {
  const entry = ENTRIES.get(characterId);
  if (!entry) throw Error(`Unknown character: ${characterId}`);
  return entry;
}

export function listCharacterEntries({ includeHidden = false } = {}) {
  const entries = [...ENTRIES.values()];
  return includeHidden ? entries : entries.filter(entry => entry.availability !== CHARACTER_AVAILABILITY.HIDDEN);
}

export function hasCharacterEntry(characterId) {
  return ENTRIES.has(characterId);
}

export function isCharacterSelectable(characterId) {
  const entry = ENTRIES.get(characterId);
  return Boolean(entry && entry.availability === CHARACTER_AVAILABILITY.SELECTABLE && entry.definition);
}

export function getCharacterDefinition(characterId = 'runner') {
  const entry = getCharacterEntry(characterId);
  if (!isCharacterSelectable(characterId)) throw Error(`Character is not selectable: ${characterId}`);
  return entry.definition;
}

export function listCharacterDefinitions() {
  return [...ENTRIES.values()]
    .filter(entry => entry.availability === CHARACTER_AVAILABILITY.SELECTABLE && entry.definition)
    .map(entry => entry.definition);
}

export function hasCharacterDefinition(characterId) {
  return isCharacterSelectable(characterId);
}

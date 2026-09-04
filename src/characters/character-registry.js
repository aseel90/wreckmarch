/* WRECKMARCH — canonical character identity, availability, and playable-definition registry */
import { RUNNER_CHARACTER } from './definitions/runner.js?v=4';
import { SHOTGUN_CHARACTER } from './definitions/shotgun.js?v=1';
import { SHOTGUN_PRODUCTION_ART } from './shotgun-production-art.js?v=1';

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
  id: SHOTGUN_CHARACTER.id,
  displayName: SHOTGUN_CHARACTER.displayName,
  availability: CHARACTER_AVAILABILITY.LOCKED,
  definition: SHOTGUN_CHARACTER,
  lockReason: 'production-gate',
  preview: Object.freeze({
    bodyAsset: SHOTGUN_PRODUCTION_ART.body.idle[0],
    weaponAsset: SHOTGUN_PRODUCTION_ART.weapon.path,
    idleTexture: SHOTGUN_CHARACTER.render.idleTexture,
    weaponId: SHOTGUN_CHARACTER.startingWeapon.id,
    artStatus: SHOTGUN_PRODUCTION_ART.status,
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
  const entry = ENTRIES.get(characterId);
  return Boolean(entry?.definition);
}

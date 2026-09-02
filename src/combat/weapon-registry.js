/* WRECKMARCH — canonical weapon definition registry + signature resolution */
import { RIVET_GUN_WEAPON } from './definitions/rivet-gun.js?v=1';

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function finiteNumber(value) {
  return Number.isFinite(Number(value));
}

function validateWeaponDefinition(definition) {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new TypeError('Weapon definition must be an object');
  }
  if (!nonEmptyString(definition.id)) throw new TypeError('Weapon definition id must be a non-empty string');
  if (!nonEmptyString(definition.displayName)) throw new TypeError(`Weapon displayName must be a non-empty string: ${definition.id}`);
  const stats = definition.stats;
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    throw new TypeError(`Weapon stats must be an object: ${definition.id}`);
  }
  for (const key of ['damage', 'fireDelay', 'projectileSpeed', 'range']) {
    if (!finiteNumber(stats[key]) || Number(stats[key]) <= 0) {
      throw new TypeError(`Weapon ${key} must be a positive number: ${definition.id}`);
    }
  }
  for (const key of ['pierceCount', 'ricochetCount', 'shrapnelCount']) {
    if (!finiteNumber(stats[key]) || Number(stats[key]) < 0) {
      throw new TypeError(`Weapon ${key} must be a non-negative number: ${definition.id}`);
    }
  }
  const runtime = definition.runtime ?? {};
  if (runtime.muzzleDistance != null && (!finiteNumber(runtime.muzzleDistance) || Number(runtime.muzzleDistance) < 0)) {
    throw new TypeError(`Weapon muzzleDistance must be a non-negative number: ${definition.id}`);
  }
  return definition;
}

export function createWeaponRegistry(definitions = []) {
  if (!Array.isArray(definitions)) throw new TypeError('Weapon definitions must be an array');
  const map = new Map();
  for (const definition of definitions) {
    validateWeaponDefinition(definition);
    if (map.has(definition.id)) throw new Error(`Duplicate weapon definition: ${definition.id}`);
    map.set(definition.id, definition);
  }
  return Object.freeze({
    get(weaponId) {
      const definition = map.get(weaponId);
      if (!definition) throw new Error(`Unknown weapon: ${weaponId}`);
      return definition;
    },
    has(weaponId) {
      return map.has(weaponId);
    },
    list() {
      return [...map.values()];
    }
  });
}

const WEAPON_REGISTRY = createWeaponRegistry([RIVET_GUN_WEAPON]);

export function getWeaponDefinition(weaponId = 'rivet-gun') {
  return WEAPON_REGISTRY.get(weaponId);
}

export function hasWeaponDefinition(weaponId) {
  return WEAPON_REGISTRY.has(weaponId);
}

export function listWeaponDefinitions() {
  return WEAPON_REGISTRY.list();
}

export function resolveCharacterSignatureWeapon(characterDefinition) {
  const weaponId = characterDefinition?.startingWeapon?.id;
  if (!nonEmptyString(weaponId)) {
    throw new Error(`Character ${characterDefinition?.id || 'unknown'} has no starting weapon id`);
  }
  return getWeaponDefinition(weaponId);
}

export function createWeaponRuntimeState(weaponOrId = 'rivet-gun') {
  const definition = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : validateWeaponDefinition(weaponOrId);
  return {
    id: definition.id,
    ...definition.stats,
    ...(definition.runtime || {})
  };
}

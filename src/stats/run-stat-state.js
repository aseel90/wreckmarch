import { resolveStatBlock } from './stat-resolver.js';

export const RUN_STAT_DOMAINS = Object.freeze({
  CHARACTER: 'character',
  WEAPON: 'weapon'
});

/**
 * @typedef {Object} StatModifier
 * @property {string=} id
 * @property {string} type
 * @property {number} value
 * @property {number=} priority
 */

/** @typedef {Record<string, StatModifier[]>} StatModifierMap */

function clonePlain(value) {
  return Object.fromEntries(Object.entries(value || {}).map(([key, item]) => [key, Number(item)]));
}

export function createRunStatState({ characterBase = {}, weaponBase = {}, caps = {} } = {}) {
  /** @type {StatModifierMap} */
  const characterModifiers = {};
  /** @type {StatModifierMap} */
  const weaponModifiers = {};

  const state = {
    base: {
      character: Object.freeze(clonePlain(characterBase)),
      weapon: Object.freeze(clonePlain(weaponBase))
    },
    modifiers: {
      character: characterModifiers,
      weapon: weaponModifiers
    },
    caps: {
      character: caps.character || {},
      weapon: caps.weapon || {}
    }
  };

  return {
    state,
    resolve() {
      return Object.freeze({
        character: resolveStatBlock(state.base.character, state.modifiers.character, state.caps.character),
        weapon: resolveStatBlock(state.base.weapon, state.modifiers.weapon, state.caps.weapon)
      });
    }
  };
}

export function mirrorResolvedRunStats(scene, resolved) {
  if (!scene || !resolved) return resolved;
  const character = resolved.character || {};
  const weapon = resolved.weapon || {};

  if (Number.isFinite(character.maxHp)) scene.heroMaxHp = character.maxHp;
  if (Number.isFinite(character.moveSpeed)) scene.heroSpeed = character.moveSpeed;
  scene.runCombatStats = Object.freeze({
    armor: Number(character.armor || 0),
    critChance: Number(character.critChance || 0),
    critDamageMultiplier: Number(character.critDamageMultiplier || 1),
    pickupRadiusMultiplier: Number(character.pickupRadiusMultiplier || 1)
  });

  if (scene.primaryWeapon) {
    for (const key of ['damage', 'fireDelay', 'projectileSpeed', 'range']) {
      if (Number.isFinite(weapon[key])) scene.primaryWeapon[key] = weapon[key];
    }
  }
  if (Number.isFinite(weapon.damage)) scene.damage = weapon.damage;
  if (Number.isFinite(weapon.fireDelay)) scene.fireDelay = weapon.fireDelay;

  scene.resolvedRunStats = resolved;
  return resolved;
}

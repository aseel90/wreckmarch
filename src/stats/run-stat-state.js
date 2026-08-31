import { resolveStatBlock } from './stat-resolver.js';

export const RUN_STAT_DOMAINS = Object.freeze({ CHARACTER: 'character', WEAPON: 'weapon' });

export function createRunStatState({ characterBase = {}, weaponBase = {}, caps = {} } = {}) {
  const characterModifiers = {};
  const weaponModifiers = {};
  const characterCaps = caps.character || {};
  const weaponCaps = caps.weapon || {};
  const state = { base: { character: Object.freeze({ ...characterBase }), weapon: Object.freeze({ ...weaponBase }) }, modifiers: { character: characterModifiers, weapon: weaponModifiers }, caps: { character: characterCaps, weapon: weaponCaps } };
  return { state, resolve() { return Object.freeze({ character: resolveStatBlock(state.base.character, state.modifiers.character, state.caps.character), weapon: resolveStatBlock(state.base.weapon, state.modifiers.weapon, state.caps.weapon) }); } };
}

export function mirrorResolvedRunStats(scene, resolved) {
  if (!scene || !resolved) return resolved;
  const character = resolved.character || {};
  const weapon = resolved.weapon || {};
  if (Number.isFinite(character.maxHp)) scene.heroMaxHp = character.maxHp;
  if (Number.isFinite(character.moveSpeed)) scene.heroSpeed = character.moveSpeed;
  scene.runCombatStats = Object.freeze({ armor: Number(character.armor || 0), critChance: Number(character.critChance || 0), critDamageMultiplier: Number(character.critDamageMultiplier || 1), pickupRadiusMultiplier: Number(character.pickupRadiusMultiplier || 1) });
  if (scene.primaryWeapon) {
    for (const key of ['damage', 'fireDelay', 'projectileSpeed', 'range']) if (Number.isFinite(weapon[key])) scene.primaryWeapon[key] = weapon[key];
    if (Number.isFinite(weapon.pierceCount)) scene.primaryWeapon.pierceCount = Math.max(0, Math.floor(weapon.pierceCount));
    if (Number.isFinite(weapon.ricochetCount)) scene.primaryWeapon.ricochetCount = Math.max(0, Math.floor(weapon.ricochetCount));
  }
  if (Number.isFinite(weapon.damage)) scene.damage = weapon.damage;
  if (Number.isFinite(weapon.fireDelay)) scene.fireDelay = weapon.fireDelay;
  scene.resolvedRunStats = resolved;
  return resolved;
}

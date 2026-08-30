export const UPGRADE_MECHANICAL_EFFECT_IDS = Object.freeze({
  TWIN_RIVETER: 'TWIN_RIVETER'
});

const HANDLERS = Object.freeze({
  [UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER]: ({ scene, definition, level, config }) => {
    const baseProjectileCount = Number.isInteger(config.baseProjectileCount) ? config.baseProjectileCount : 1;
    const maxProjectileCount = Number.isInteger(config.maxProjectileCount) ? config.maxProjectileCount : 3;
    const projectileCount = Math.min(maxProjectileCount, baseProjectileCount + level);

    if (!scene.upgradeMechanicalState || typeof scene.upgradeMechanicalState !== 'object') {
      scene.upgradeMechanicalState = {};
    }
    const state = Object.freeze({
      id: definition.id,
      effectId: UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER,
      level,
      projectileCount
    });
    scene.upgradeMechanicalState[definition.id] = state;

    // Compatibility mirror for the current WeaponSystem/runtime surface.
    scene.twinShots = projectileCount;
    return state;
  }
});

export function hasUpgradeMechanicalEffect(id) {
  return typeof HANDLERS[id] === 'function';
}

export function applyUpgradeMechanicalEffect(scene, definition, level) {
  if (!scene || typeof scene !== 'object') throw new TypeError('Upgrade mechanical effect requires a scene');
  if (!definition?.mechanicalEffect) throw new Error('Upgrade definition has no mechanicalEffect');
  if (!Number.isInteger(level) || level < 1 || level > definition.maxLevel) {
    throw new RangeError(`Invalid ${definition.id} level: ${level}`);
  }

  const effectId = definition.mechanicalEffect.id;
  const handler = HANDLERS[effectId];
  if (!handler) throw new Error(`Unknown upgrade mechanical effect: ${effectId}`);

  return handler({
    scene,
    definition,
    level,
    config: definition.mechanicalEffect.config || {}
  });
}

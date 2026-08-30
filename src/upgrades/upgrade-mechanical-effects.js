export const UPGRADE_MECHANICAL_EFFECT_IDS = Object.freeze({
  TWIN_RIVETER: 'TWIN_RIVETER',
  RESTORE_HP: 'RESTORE_HP',
  CALL_RIG: 'CALL_RIG'
});

const TRANSACTION_FACTORIES = Object.freeze({
  [UPGRADE_MECHANICAL_EFFECT_IDS.CALL_RIG]: ({ scene, definition, level }) => {
    const rigSystem = scene.rigSystem;
    if (!rigSystem || typeof rigSystem.summon !== 'function') {
      throw new Error('CALL_RIG requires scene.rigSystem.summon');
    }
    const previousLevel = scene.upgradeLevels?.[definition.id] ?? 0;
    return Object.freeze({
      apply() {
        const summoned = rigSystem.summon();
        if (!summoned) throw new Error('CALL_RIG summon was rejected');
        return Object.freeze({ id: definition.id, effectId: UPGRADE_MECHANICAL_EFFECT_IDS.CALL_RIG, level, summoned: true });
      },
      rollback() {
        if ((scene.upgradeLevels?.[definition.id] ?? 0) !== previousLevel) scene.upgradeLevels[definition.id] = previousLevel;
      }
    });
  },

  [UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER]: ({ scene, definition, level, config }) => {
    const baseProjectileCount = Number.isInteger(config.baseProjectileCount) ? config.baseProjectileCount : 1;
    const maxProjectileCount = Number.isInteger(config.maxProjectileCount) ? config.maxProjectileCount : 3;
    const projectileCount = Math.min(maxProjectileCount, baseProjectileCount + level);
    const previousContainer = scene.upgradeMechanicalState;
    const hadContainer = Boolean(previousContainer && typeof previousContainer === 'object');
    const hadState = hadContainer && Object.prototype.hasOwnProperty.call(previousContainer, definition.id);
    const previousState = hadState ? previousContainer[definition.id] : undefined;
    const hadTwinShots = Object.prototype.hasOwnProperty.call(scene, 'twinShots');
    const previousTwinShots = scene.twinShots;

    return Object.freeze({
      apply() {
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
      },
      rollback() {
        if (hadContainer) {
          scene.upgradeMechanicalState = previousContainer;
          if (hadState) previousContainer[definition.id] = previousState;
          else delete previousContainer[definition.id];
        } else {
          delete scene.upgradeMechanicalState;
        }
        if (hadTwinShots) scene.twinShots = previousTwinShots;
        else delete scene.twinShots;
      }
    });
  },

  [UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP]: ({ scene, definition, level, config }) => {
    const amount = Number(config.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new TypeError('RESTORE_HP amount must be a finite number >= 0');
    const previousHp = Number(scene.heroHp);
    if (!Number.isFinite(previousHp)) throw new TypeError('RESTORE_HP requires finite scene.heroHp');

    return Object.freeze({
      apply() {
        const maxHp = Number(scene.heroMaxHp);
        if (!Number.isFinite(maxHp)) throw new TypeError('RESTORE_HP requires finite scene.heroMaxHp');
        const nextHp = Math.min(maxHp, previousHp + amount);
        scene.heroHp = nextHp;
        return Object.freeze({
          id: definition.id,
          effectId: UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP,
          level,
          amount,
          previousHp,
          heroHp: nextHp,
          heroMaxHp: maxHp
        });
      },
      rollback() {
        scene.heroHp = previousHp;
      }
    });
  }
});

function requireMechanicalEffect(scene, definition, level) {
  if (!scene || typeof scene !== 'object') throw new TypeError('Upgrade mechanical effect requires a scene');
  if (!definition?.mechanicalEffect) throw new Error('Upgrade definition has no mechanicalEffect');
  if (!Number.isInteger(level) || level < 1 || level > definition.maxLevel) {
    throw new RangeError(`Invalid ${definition.id} level: ${level}`);
  }

  const effectId = definition.mechanicalEffect.id;
  const factory = TRANSACTION_FACTORIES[effectId];
  if (!factory) throw new Error(`Unknown upgrade mechanical effect: ${effectId}`);
  return { effectId, factory };
}

export function hasUpgradeMechanicalEffect(id) {
  return typeof TRANSACTION_FACTORIES[id] === 'function';
}

export function createUpgradeMechanicalTransaction(scene, definition, level) {
  const { factory } = requireMechanicalEffect(scene, definition, level);
  return factory({
    scene,
    definition,
    level,
    config: definition.mechanicalEffect.config || {}
  });
}

export function applyUpgradeMechanicalEffect(scene, definition, level) {
  const transaction = createUpgradeMechanicalTransaction(scene, definition, level);
  try {
    return transaction.apply();
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

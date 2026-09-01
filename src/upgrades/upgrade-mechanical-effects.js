export const UPGRADE_MECHANICAL_EFFECT_IDS = Object.freeze({
  TWIN_RIVETER: 'TWIN_RIVETER',
  EXPLOSIVE_RIVET: 'EXPLOSIVE_RIVET',
  RESTORE_HP: 'RESTORE_HP',
  GRANT_SHIELD: 'GRANT_SHIELD',
  SUMMON_RIG: 'SUMMON_RIG'
});

const TRANSACTION_FACTORIES = Object.freeze({
  [UPGRADE_MECHANICAL_EFFECT_IDS.EXPLOSIVE_RIVET]: ({ scene, definition, level, config, rarity }) => {
    const cadenceByLevel = Array.isArray(config.cadenceMsByLevel) ? config.cadenceMsByLevel : [5000, 4500, 4000];
    const radiusByLevel = Array.isArray(config.radiusByLevel) ? config.radiusByLevel : [90, 105, 120];
    const targetCapByLevel = Array.isArray(config.targetCapByLevel) ? config.targetCapByLevel : [3, 3, 4];
    const cadenceMs = Number(cadenceByLevel[level - 1]);
    const radius = Number(radiusByLevel[level - 1]);
    const targetCap = Math.floor(Number(targetCapByLevel[level - 1]));
    const damageCoefficient = Number(config.damageCoefficient ?? .33);
    if (!Number.isFinite(cadenceMs) || cadenceMs <= 0) throw new TypeError(`EXPLOSIVE_RIVET missing valid cadence for level ${level}`);
    if (!Number.isFinite(radius) || radius <= 0) throw new TypeError(`EXPLOSIVE_RIVET missing valid radius for level ${level}`);
    if (!Number.isInteger(targetCap) || targetCap <= 0) throw new TypeError(`EXPLOSIVE_RIVET missing valid target cap for level ${level}`);
    if (!Number.isFinite(damageCoefficient) || damageCoefficient <= 0) throw new TypeError('EXPLOSIVE_RIVET damageCoefficient must be > 0');
    const previousContainer = scene.upgradeMechanicalState;
    const hadContainer = Boolean(previousContainer && typeof previousContainer === 'object');
    const hadState = hadContainer && Object.prototype.hasOwnProperty.call(previousContainer, definition.id);
    const previousState = hadState ? previousContainer[definition.id] : undefined;

    return Object.freeze({
      apply() {
        if (!scene.upgradeMechanicalState || typeof scene.upgradeMechanicalState !== 'object') scene.upgradeMechanicalState = {};
        const state = Object.freeze({
          id: definition.id,
          effectId: UPGRADE_MECHANICAL_EFFECT_IDS.EXPLOSIVE_RIVET,
          level,
          rarity,
          cadenceMs,
          damageCoefficient,
          radius,
          targetCap
        });
        scene.upgradeMechanicalState[definition.id] = state;
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
      }
    });
  },

  [UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER]: ({ scene, definition, level, config, rarity }) => {
    const projectileCount = Number.isInteger(config.projectileCount) ? config.projectileCount : 2;
    const volleyDamageMultipliers = Array.isArray(config.volleyDamageMultipliers) ? config.volleyDamageMultipliers : [1.2, 1.4];
    if (projectileCount !== 2) throw new RangeError('TWIN_RIVETER requires exactly two projectiles');
    const volleyDamageMultiplier = Number(volleyDamageMultipliers[level - 1]);
    if (!Number.isFinite(volleyDamageMultiplier) || volleyDamageMultiplier <= 0) {
      throw new TypeError(`TWIN_RIVETER missing valid volley damage multiplier for level ${level}`);
    }
    const projectileDamageScale = volleyDamageMultiplier / projectileCount;
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
          rarity,
          projectileCount,
          volleyDamageMultiplier,
          projectileDamageScale
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

  [UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP]: ({ scene, definition, level, config, rarity, powerMultiplier }) => {
    const flatAmount = config.amount == null ? null : Number(config.amount);
    const percentMaxHp = config.percentMaxHp == null ? null : Number(config.percentMaxHp);
    if (flatAmount == null && percentMaxHp == null) throw new TypeError('RESTORE_HP requires amount or percentMaxHp');
    if (flatAmount != null && (!Number.isFinite(flatAmount) || flatAmount < 0)) throw new TypeError('RESTORE_HP amount must be a finite number >= 0');
    if (percentMaxHp != null && (!Number.isFinite(percentMaxHp) || percentMaxHp < 0)) throw new TypeError('RESTORE_HP percentMaxHp must be a finite number >= 0');
    const previousHp = Number(scene.heroHp);
    if (!Number.isFinite(previousHp)) throw new TypeError('RESTORE_HP requires finite scene.heroHp');

    return Object.freeze({
      apply() {
        const maxHp = Number(scene.heroMaxHp);
        if (!Number.isFinite(maxHp)) throw new TypeError('RESTORE_HP requires finite scene.heroMaxHp');
        const baseAmount = flatAmount != null ? flatAmount : maxHp * percentMaxHp;
        const amount = baseAmount * powerMultiplier;
        if (!Number.isFinite(amount) || amount < 0) throw new TypeError('RESTORE_HP scaled amount must be a finite number >= 0');
        const nextHp = Math.min(maxHp, previousHp + amount);
        scene.heroHp = nextHp;
        return Object.freeze({
          id: definition.id,
          effectId: UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP,
          level,
          rarity,
          amount,
          healed: Math.max(0, nextHp - previousHp),
          previousHp,
          heroHp: nextHp,
          heroMaxHp: maxHp
        });
      },
      rollback() {
        scene.heroHp = previousHp;
      }
    });
  },

  [UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD]: ({ scene, definition, level, config, rarity }) => {
    const charges = Math.max(1, Math.floor(Number(config.charges) || 1));
    const maxCharges = Math.max(charges, Math.floor(Number(config.maxCharges) || 2));
    const previousCharges = Math.max(0, Math.floor(Number(scene.heroShieldCharges) || 0));
    return Object.freeze({
      apply() {
        const nextCharges = Math.min(maxCharges, previousCharges + charges);
        scene.heroShieldCharges = nextCharges;
        return Object.freeze({
          id: definition.id,
          effectId: UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD,
          level,
          rarity,
          chargesGranted: nextCharges - previousCharges,
          heroShieldCharges: nextCharges,
          maxCharges
        });
      },
      rollback() {
        scene.heroShieldCharges = previousCharges;
      }
    });
  },

  [UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG]: ({ scene, definition, level, rarity }) => {
    return Object.freeze({
      apply() {
        if (!scene.rigSystem || typeof scene.rigSystem.summon !== 'function') {
          throw new Error('SUMMON_RIG requires scene.rigSystem.summon()');
        }
        const summoned = scene.rigSystem.summon();
        if (summoned !== true) throw new Error('SUMMON_RIG could not summon the companion');
        return Object.freeze({
          id: definition.id,
          effectId: UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG,
          level,
          rarity,
          summoned: true
        });
      },
      rollback() {}
    });
  }
});

const EFFECT_AVAILABILITY = Object.freeze({
  [UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP]: (scene, definition) => {
    const config = definition?.mechanicalEffect?.config || {};
    if (!config.requireMissingHp) return true;
    const hp = Number(scene?.heroHp);
    const maxHp = Number(scene?.heroMaxHp);
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return false;
    const missingFraction = Math.max(0, (maxHp - hp) / maxHp);
    return missingFraction >= Math.max(0, Number(config.minMissingFraction) || 0);
  },
  [UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD]: (scene, definition) => {
    const maxCharges = Math.max(1, Math.floor(Number(definition?.mechanicalEffect?.config?.maxCharges) || 2));
    return Math.max(0, Math.floor(Number(scene?.heroShieldCharges) || 0)) < maxCharges;
  },
  [UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG]: (scene) => Boolean(
    scene?.rigSystem &&
    typeof scene.rigSystem.summon === 'function' &&
    !scene.rigSummoned &&
    scene.cart &&
    scene.hero
  )
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

export function canApplyUpgradeMechanicalEffect(scene, definition) {
  if (!definition?.mechanicalEffect) return true;
  const predicate = EFFECT_AVAILABILITY[definition.mechanicalEffect.id];
  return predicate ? predicate(scene, definition) : true;
}

export function createUpgradeMechanicalTransaction(scene, definition, level, { rarity = 'COMMON', powerMultiplier = 1 } = {}) {
  const { factory } = requireMechanicalEffect(scene, definition, level);
  if (!Number.isFinite(powerMultiplier) || powerMultiplier <= 0) {
    throw new TypeError('Upgrade mechanical effect powerMultiplier must be finite and > 0');
  }
  return factory({
    scene,
    definition,
    level,
    rarity,
    powerMultiplier,
    config: definition.mechanicalEffect.config || {}
  });
}

export function applyUpgradeMechanicalEffect(scene, definition, level, options = {}) {
  const transaction = createUpgradeMechanicalTransaction(scene, definition, level, options);
  try {
    return transaction.apply();
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

import { mirrorResolvedRunStats } from '../stats/run-stat-state.js';
import { getUpgradeDefinition } from './upgrade-catalog.js?v=7';
import { applyUpgradeMechanicalEffect, canApplyUpgradeMechanicalEffect, createUpgradeMechanicalTransaction, hasUpgradeMechanicalEffect } from './upgrade-mechanical-effects.js?v=4';
import { UPGRADE_RARITIES, getUpgradeRarityRule, resolveUpgradeRarityForDefinition, scaleUpgradeModifierValue } from './upgrade-rarity.js?v=1';

function mergeModifierCaps(existing = {}, modifier) {
  if (modifier.min == null && modifier.max == null) return null;
  const existingMin = existing.min == null ? -Infinity : Number(existing.min);
  const existingMax = existing.max == null ? Infinity : Number(existing.max);
  const nextMin = modifier.min == null ? existingMin : Math.max(existingMin, Number(modifier.min));
  const nextMax = modifier.max == null ? existingMax : Math.min(existingMax, Number(modifier.max));
  if (nextMin > nextMax) throw new RangeError(`Conflicting stat caps for ${modifier.domain}.${modifier.stat}`);
  return {
    ...(Number.isFinite(nextMin) ? { min: nextMin } : {}),
    ...(Number.isFinite(nextMax) ? { max: nextMax } : {})
  };
}

function getModifierBucket(runStatState, domain, stat) {
  const domainModifiers = runStatState?.state?.modifiers?.[domain];
  if (!domainModifiers) throw new Error(`Missing run stat modifier domain: ${domain}`);
  if (!Array.isArray(domainModifiers[stat])) domainModifiers[stat] = [];
  return domainModifiers[stat];
}

export function applyUpgradeStatModifiers(scene, definition, level, { rarity = UPGRADE_RARITIES.COMMON } = {}) {
  if (!scene?.runStatState?.state || typeof scene.runStatState.resolve !== 'function') {
    throw new Error('Upgrade stat modifiers require scene.runStatState');
  }
  if (!definition || !Array.isArray(definition.modifiers) || definition.modifiers.length === 0) {
    throw new Error('Upgrade definition has no stat modifiers');
  }
  if (!Number.isInteger(level) || level < 1 || level > definition.maxLevel) {
    throw new RangeError(`Invalid ${definition.id} level: ${level}`);
  }
  const resolvedRarity = resolveUpgradeRarityForDefinition(definition, rarity);

  const capPlans = new Map();
  const planned = definition.modifiers.map((modifier, index) => {
    const bucket = getModifierBucket(scene.runStatState, modifier.domain, modifier.stat);
    const id = `${definition.id}@${level}:${index}`;
    if (bucket.some(existing => existing?.id === id)) {
      throw new Error(`Upgrade modifier already applied: ${id}`);
    }

    if (modifier.min != null || modifier.max != null) {
      const domainCaps = scene.runStatState?.state?.caps?.[modifier.domain];
      if (!domainCaps) throw new Error(`Missing run stat cap domain: ${modifier.domain}`);
      const key = `${modifier.domain}:${modifier.stat}`;
      const existing = capPlans.get(key)?.value || domainCaps[modifier.stat] || {};
      capPlans.set(key, {
        domainCaps,
        stat: modifier.stat,
        value: mergeModifierCaps(existing, modifier)
      });
    }

    return { bucket, id, modifier, scaledValue: scaleUpgradeModifierValue(modifier, resolvedRarity) };
  });

  for (const { bucket, id, modifier, scaledValue } of planned) {
    bucket.push({
      id,
      type: modifier.type,
      value: scaledValue,
      ...(modifier.priority == null ? {} : { priority: modifier.priority })
    });
  }
  for (const { domainCaps, stat, value } of capPlans.values()) domainCaps[stat] = value;

  const resolved = scene.runStatState.resolve();
  mirrorResolvedRunStats(scene, resolved);
  return resolved;
}

function requireRegisteredUpgrade(id) {
  const definition = getUpgradeDefinition(id);
  if (!definition) throw new Error(`Unknown upgrade definition: ${id}`);
  return definition;
}

export function getSceneUpgradeLevel(scene, id) {
  const level = scene?.upgradeLevels?.[id] ?? 0;
  if (!Number.isInteger(level) || level < 0) {
    throw new TypeError(`Invalid scene upgrade level for ${id}: ${String(level)}`);
  }
  return level;
}

function requireSupportedRegisteredUpgrade(definition) {
  const hasModifiers = Array.isArray(definition.modifiers) && definition.modifiers.length > 0;
  const hasMechanicalEffect = Boolean(definition.mechanicalEffect);

  if (hasMechanicalEffect && !hasUpgradeMechanicalEffect(definition.mechanicalEffect.id)) {
    throw new Error(`Unknown upgrade mechanical effect: ${definition.mechanicalEffect.id}`);
  }
  if (!hasModifiers && !hasMechanicalEffect) {
    throw new Error(`Upgrade definition has no applicable effect: ${definition.id}`);
  }
  return { hasModifiers, hasMechanicalEffect };
}

function cloneModifierRecord(record = {}) {
  return Object.fromEntries(Object.entries(record).map(([stat, modifiers]) => [
    stat,
    Array.isArray(modifiers) ? modifiers.map(modifier => ({ ...modifier })) : []
  ]));
}

function cloneCapRecord(record = {}) {
  return Object.fromEntries(Object.entries(record).map(([stat, cap]) => [stat, { ...cap }]));
}

function snapshotRunStatMutationState(scene) {
  const state = scene?.runStatState?.state;
  if (!state) throw new Error('Mixed upgrade requires scene.runStatState');
  return {
    modifiers: {
      character: cloneModifierRecord(state.modifiers.character),
      weapon: cloneModifierRecord(state.modifiers.weapon)
    },
    caps: {
      character: cloneCapRecord(state.caps.character),
      weapon: cloneCapRecord(state.caps.weapon)
    }
  };
}

function restoreRecord(target, snapshot, cloneValue) {
  for (const key of Object.keys(target)) delete target[key];
  for (const [key, value] of Object.entries(snapshot)) target[key] = cloneValue(value);
}

function restoreRunStatMutationState(scene, snapshot) {
  const state = scene.runStatState.state;
  restoreRecord(state.modifiers.character, snapshot.modifiers.character, value => value.map(modifier => ({ ...modifier })));
  restoreRecord(state.modifiers.weapon, snapshot.modifiers.weapon, value => value.map(modifier => ({ ...modifier })));
  restoreRecord(state.caps.character, snapshot.caps.character, value => ({ ...value }));
  restoreRecord(state.caps.weapon, snapshot.caps.weapon, value => ({ ...value }));
  const resolved = scene.runStatState.resolve();
  mirrorResolvedRunStats(scene, resolved);
  return resolved;
}

function applyMixedRegisteredUpgrade(scene, definition, level, rarity) {
  const statSnapshot = snapshotRunStatMutationState(scene);
  const powerMultiplier = getUpgradeRarityRule(rarity).powerMultiplier;
  const mechanicalTransaction = createUpgradeMechanicalTransaction(scene, definition, level, { rarity, powerMultiplier });
  try {
    const resolved = applyUpgradeStatModifiers(scene, definition, level, { rarity });
    const mechanicalEffect = mechanicalTransaction.apply();
    return Object.freeze({ resolved, mechanicalEffect });
  } catch (error) {
    let rollbackError = null;
    try {
      mechanicalTransaction.rollback();
    } catch (candidate) {
      rollbackError = candidate;
    }
    try {
      restoreRunStatMutationState(scene, statSnapshot);
    } catch (candidate) {
      rollbackError ||= candidate;
    }
    if (rollbackError) throw new AggregateError([error, rollbackError], `Failed to roll back mixed upgrade ${definition.id}`);
    throw error;
  }
}

function meetsOfferRules(scene, definition) {
  const minRunLevel = definition.offerRules?.minRunLevel;
  if (minRunLevel != null) {
    if (!Number.isInteger(minRunLevel) || minRunLevel < 1) {
      throw new TypeError(`Invalid minRunLevel for ${definition.id}: ${String(minRunLevel)}`);
    }
    if (!Number.isInteger(scene?.level) || scene.level < minRunLevel) return false;
  }
  return true;
}

export function canApplyRegisteredUpgrade(scene, id) {
  const definition = requireRegisteredUpgrade(id);
  const { hasMechanicalEffect } = requireSupportedRegisteredUpgrade(definition);
  if (getSceneUpgradeLevel(scene, id) >= definition.maxLevel) return false;
  if (!meetsOfferRules(scene, definition)) return false;
  if (hasMechanicalEffect && !canApplyUpgradeMechanicalEffect(scene, definition)) return false;
  return true;
}

function planUpgradeRarityHistory(scene, definition, currentLevel, rarity) {
  const container = scene?.upgradeRarityHistory;
  if (container != null && (typeof container !== 'object' || Array.isArray(container))) {
    throw new TypeError('scene.upgradeRarityHistory must be an object when present');
  }
  const existing = container?.[definition.id];
  if (existing != null && !Array.isArray(existing)) {
    throw new TypeError(`Invalid rarity history for ${definition.id}`);
  }
  const history = existing ? [...existing] : [];
  if (history.length > currentLevel) throw new Error(`Rarity history exceeds upgrade level for ${definition.id}`);
  while (history.length < currentLevel) history.push(UPGRADE_RARITIES.COMMON);
  history.push(rarity);
  return Object.freeze(history);
}

function commitUpgradeRarityHistory(scene, definition, history) {
  if (!scene.upgradeRarityHistory || typeof scene.upgradeRarityHistory !== 'object' || Array.isArray(scene.upgradeRarityHistory)) {
    scene.upgradeRarityHistory = {};
  }
  scene.upgradeRarityHistory[definition.id] = history;
}

export function applyRegisteredUpgrade(scene, id, { rarity = null } = {}) {
  const definition = requireRegisteredUpgrade(id);
  const currentLevel = getSceneUpgradeLevel(scene, id);
  const nextLevel = currentLevel + 1;
  if (nextLevel > definition.maxLevel) {
    throw new RangeError(`${definition.id} is already at max level ${definition.maxLevel}`);
  }
  const resolvedRarity = resolveUpgradeRarityForDefinition(definition, rarity);
  const rarityHistory = planUpgradeRarityHistory(scene, definition, currentLevel, resolvedRarity);
  const powerMultiplier = getUpgradeRarityRule(resolvedRarity).powerMultiplier;

  const { hasModifiers, hasMechanicalEffect } = requireSupportedRegisteredUpgrade(definition);
  const result = hasModifiers && hasMechanicalEffect
    ? applyMixedRegisteredUpgrade(scene, definition, nextLevel, resolvedRarity)
    : hasModifiers
      ? applyUpgradeStatModifiers(scene, definition, nextLevel, { rarity: resolvedRarity })
      : applyUpgradeMechanicalEffect(scene, definition, nextLevel, { rarity: resolvedRarity, powerMultiplier });

  scene.upgradeLevels[definition.id] = nextLevel;
  commitUpgradeRarityHistory(scene, definition, rarityHistory);
  return result;
}

export function createRegisteredUpgradeChoice(scene, id, { category = 'HERO' } = {}) {
  const definition = requireRegisteredUpgrade(id);
  requireSupportedRegisteredUpgrade(definition);
  return {
    id: definition.id,
    category,
    title: definition.name,
    desc: definition.description,
    weight: definition.weight,
    rarityConstraint: definition.rarity,
    available: () => canApplyRegisteredUpgrade(scene, definition.id),
    apply: (rarity = null) => applyRegisteredUpgrade(scene, definition.id, { rarity })
  };
}

export function canApplyRegisteredStatUpgrade(scene, id) {
  const definition = requireRegisteredUpgrade(id);
  if (!definition.modifiers?.length || definition.mechanicalEffect) {
    throw new Error(`Registered stat upgrade expected: ${definition.id}`);
  }
  return canApplyRegisteredUpgrade(scene, definition.id);
}

export function applyRegisteredStatUpgrade(scene, id, options = {}) {
  const definition = requireRegisteredUpgrade(id);
  if (!definition.modifiers?.length || definition.mechanicalEffect) {
    throw new Error(`Registered stat upgrade expected: ${definition.id}`);
  }
  return applyRegisteredUpgrade(scene, definition.id, options);
}

export function createRegisteredStatUpgradeChoice(scene, id, options = {}) {
  const definition = requireRegisteredUpgrade(id);
  if (!definition.modifiers?.length || definition.mechanicalEffect) {
    throw new Error(`Registered stat upgrade expected: ${definition.id}`);
  }
  return createRegisteredUpgradeChoice(scene, definition.id, options);
}

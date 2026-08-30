import { mirrorResolvedRunStats } from '../stats/run-stat-state.js';
import { getUpgradeDefinition } from './upgrade-catalog.js?v=3';

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

export function applyUpgradeStatModifiers(scene, definition, level) {
  if (!scene?.runStatState?.state || typeof scene.runStatState.resolve !== 'function') {
    throw new Error('Upgrade stat modifiers require scene.runStatState');
  }
  if (!definition || !Array.isArray(definition.modifiers) || definition.modifiers.length === 0) {
    throw new Error('Upgrade definition has no stat modifiers');
  }
  if (!Number.isInteger(level) || level < 1 || level > definition.maxLevel) {
    throw new RangeError(`Invalid ${definition.id} level: ${level}`);
  }

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

    return { bucket, id, modifier };
  });

  for (const { bucket, id, modifier } of planned) {
    bucket.push({
      id,
      type: modifier.type,
      value: modifier.value,
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

export function canApplyRegisteredStatUpgrade(scene, id) {
  const definition = requireRegisteredUpgrade(id);
  return getSceneUpgradeLevel(scene, id) < definition.maxLevel;
}

export function applyRegisteredStatUpgrade(scene, id) {
  const definition = requireRegisteredUpgrade(id);
  const currentLevel = getSceneUpgradeLevel(scene, id);
  const nextLevel = currentLevel + 1;
  if (nextLevel > definition.maxLevel) {
    throw new RangeError(`${definition.id} is already at max level ${definition.maxLevel}`);
  }

  const resolved = applyUpgradeStatModifiers(scene, definition, nextLevel);
  scene.upgradeLevels[definition.id] = nextLevel;
  return resolved;
}

export function createRegisteredStatUpgradeChoice(scene, id, { category = 'HERO' } = {}) {
  const definition = requireRegisteredUpgrade(id);
  return {
    id: definition.id,
    category,
    title: definition.name,
    desc: definition.description,
    weight: definition.weight,
    available: () => canApplyRegisteredStatUpgrade(scene, definition.id),
    apply: () => applyRegisteredStatUpgrade(scene, definition.id)
  };
}

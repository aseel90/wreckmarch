import { mirrorResolvedRunStats } from '../stats/run-stat-state.js';

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

  const planned = definition.modifiers.map((modifier, index) => {
    const bucket = getModifierBucket(scene.runStatState, modifier.domain, modifier.stat);
    const id = `${definition.id}@${level}:${index}`;
    if (bucket.some(existing => existing?.id === id)) {
      throw new Error(`Upgrade modifier already applied: ${id}`);
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

  const resolved = scene.runStatState.resolve();
  mirrorResolvedRunStats(scene, resolved);
  return resolved;
}

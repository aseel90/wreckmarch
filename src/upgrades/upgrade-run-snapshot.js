import { STAT_MODIFIER_TYPES } from '../stats/stat-resolver.js';
import { mirrorResolvedRunStats } from '../stats/run-stat-state.js';
import { getUpgradeDefinition } from './upgrade-catalog.js?v=7';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from './upgrade-mechanical-effects.js?v=4';
import { resolveUpgradeRarityForDefinition } from './upgrade-rarity.js?v=1';

export const UPGRADE_RUN_SNAPSHOT_SCHEMA = 'wreckmarch.upgrade-run-state';
export const UPGRADE_RUN_SNAPSHOT_VERSION = 1;

const VALID_MODIFIER_TYPES = new Set(Object.values(STAT_MODIFIER_TYPES));
const STAT_DOMAINS = Object.freeze(['character', 'weapon']);
const PERSISTENT_MECHANICAL_EFFECTS = new Set([
  UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER,
  UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG
]);

function requirePlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  return value;
}

function requireFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number`);
  return number;
}

function requireUpgradeDefinition(id) {
  const definition = getUpgradeDefinition(id);
  if (!definition) throw new Error(`Unknown upgrade definition in snapshot: ${id}`);
  return definition;
}

function cloneModifier(modifier, label) {
  requirePlainObject(modifier, label);
  if (!VALID_MODIFIER_TYPES.has(modifier.type)) {
    throw new TypeError(`${label}.type is invalid: ${String(modifier.type)}`);
  }
  const id = String(modifier.id ?? '').trim();
  if (!id) throw new TypeError(`${label}.id must be a non-empty string`);
  return {
    id,
    type: modifier.type,
    value: requireFiniteNumber(modifier.value, `${label}.value`),
    ...(modifier.priority == null ? {} : { priority: requireFiniteNumber(modifier.priority, `${label}.priority`) })
  };
}

function cloneModifierDomain(domain, label) {
  requirePlainObject(domain, label);
  return Object.fromEntries(Object.entries(domain).map(([stat, modifiers]) => {
    if (!Array.isArray(modifiers)) throw new TypeError(`${label}.${stat} must be an array`);
    return [stat, modifiers.map((modifier, index) => cloneModifier(modifier, `${label}.${stat}[${index}]`))];
  }));
}

function cloneCap(cap, label) {
  requirePlainObject(cap, label);
  const min = cap.min == null ? null : requireFiniteNumber(cap.min, `${label}.min`);
  const max = cap.max == null ? null : requireFiniteNumber(cap.max, `${label}.max`);
  if (min != null && max != null && min > max) throw new RangeError(`${label}.min cannot exceed max`);
  return {
    ...(min == null ? {} : { min }),
    ...(max == null ? {} : { max })
  };
}

function cloneCapDomain(domain, label) {
  requirePlainObject(domain, label);
  return Object.fromEntries(Object.entries(domain).map(([stat, cap]) => [stat, cloneCap(cap, `${label}.${stat}`)]));
}

function deepFreezeSnapshot(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreezeSnapshot(nested);
  return value;
}

function normalizeUpgradeLevelSnapshot(snapshot) {
  requirePlainObject(snapshot, 'upgrade snapshot');
  const levelsInput = requirePlainObject(snapshot.levels, 'upgrade snapshot.levels');
  const rarityInput = requirePlainObject(snapshot.rarityHistory, 'upgrade snapshot.rarityHistory');
  const levels = {};
  const rarityHistory = {};

  for (const [id, rawLevel] of Object.entries(levelsInput)) {
    const definition = requireUpgradeDefinition(id);
    const level = Number(rawLevel);
    if (!Number.isInteger(level) || level < 0 || level > definition.maxLevel) {
      throw new RangeError(`Invalid snapshot level for ${id}: ${String(rawLevel)}`);
    }
    if (level === 0) continue;
    levels[id] = level;

    const history = rarityInput[id];
    if (!Array.isArray(history) || history.length !== level) {
      throw new RangeError(`Rarity history length must match level for ${id}`);
    }
    rarityHistory[id] = history.map((rarity, index) => {
      try {
        return resolveUpgradeRarityForDefinition(definition, rarity);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TypeError(`Invalid rarity history for ${id} at level ${index + 1}: ${message}`);
      }
    });
  }

  for (const id of Object.keys(rarityInput)) {
    if (!(id in levels)) {
      const history = rarityInput[id];
      if (!Array.isArray(history) || history.length !== 0) {
        throw new RangeError(`Rarity history exists without an acquired level for ${id}`);
      }
    }
  }

  return { levels, rarityHistory };
}

function normalizeRunStatSnapshot(snapshot) {
  requirePlainObject(snapshot, 'stat snapshot');
  const modifiersInput = requirePlainObject(snapshot.modifiers, 'stat snapshot.modifiers');
  const capsInput = requirePlainObject(snapshot.caps, 'stat snapshot.caps');
  const modifiers = {};
  const caps = {};

  for (const domain of STAT_DOMAINS) {
    modifiers[domain] = cloneModifierDomain(modifiersInput[domain] ?? {}, `stat snapshot.modifiers.${domain}`);
    caps[domain] = cloneCapDomain(capsInput[domain] ?? {}, `stat snapshot.caps.${domain}`);
  }
  return { modifiers, caps };
}

function lastRarity(upgradeSnapshot, id) {
  const history = upgradeSnapshot.rarityHistory[id] || [];
  return history[history.length - 1] || 'COMMON';
}

function normalizeTwinRiveterState(id, state, upgradeSnapshot) {
  requirePlainObject(state, `mechanical snapshot.effects.${id}`);
  const level = upgradeSnapshot.levels[id] || 0;
  if (!level) throw new Error(`${id} mechanical state exists without an acquired level`);
  if (state.effectId !== UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER) {
    throw new TypeError(`${id} mechanical effect must be ${UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER}`);
  }
  const stateLevel = Number(state.level);
  const projectileCount = Number(state.projectileCount);
  if (stateLevel !== level) throw new RangeError(`${id} mechanical level does not match upgrade level`);
  if (!Number.isInteger(projectileCount) || projectileCount < 2 || projectileCount > 3) {
    throw new RangeError(`${id} projectileCount must be 2 or 3`);
  }
  const definition = requireUpgradeDefinition(id);
  const rarity = resolveUpgradeRarityForDefinition(definition, state.rarity ?? lastRarity(upgradeSnapshot, id));
  if (rarity !== lastRarity(upgradeSnapshot, id)) throw new Error(`${id} mechanical rarity does not match rarity history`);
  return { id, effectId: state.effectId, level, rarity, projectileCount };
}

function normalizeCallRigState(id, state, upgradeSnapshot) {
  requirePlainObject(state, `mechanical snapshot.effects.${id}`);
  const level = upgradeSnapshot.levels[id] || 0;
  if (level !== 1) throw new Error(`${id} summon state requires acquired level 1`);
  if (state.effectId !== UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG) {
    throw new TypeError(`${id} mechanical effect must be ${UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG}`);
  }
  if (state.summoned !== true) throw new Error(`${id} acquired snapshot must preserve summoned=true`);
  const definition = requireUpgradeDefinition(id);
  const rarity = resolveUpgradeRarityForDefinition(definition, state.rarity ?? lastRarity(upgradeSnapshot, id));
  if (rarity !== lastRarity(upgradeSnapshot, id)) throw new Error(`${id} summon rarity does not match rarity history`);
  return { id, effectId: state.effectId, level, rarity, summoned: true };
}

function normalizeMechanicalSnapshot(snapshot, upgradeSnapshot) {
  requirePlainObject(snapshot, 'mechanical snapshot');
  const effectsInput = requirePlainObject(snapshot.effects, 'mechanical snapshot.effects');
  const effects = {};

  for (const [id, state] of Object.entries(effectsInput)) {
    const effectId = state?.effectId;
    if (!PERSISTENT_MECHANICAL_EFFECTS.has(effectId)) {
      throw new TypeError(`Unsupported persistent mechanical effect in snapshot: ${String(effectId)}`);
    }
    effects[id] = effectId === UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER
      ? normalizeTwinRiveterState(id, state, upgradeSnapshot)
      : normalizeCallRigState(id, state, upgradeSnapshot);
  }

  const twinLevel = upgradeSnapshot.levels['twin-riveter'] || 0;
  if (twinLevel > 0 && !effects['twin-riveter']) throw new Error('Twin Riveter snapshot is missing persistent mechanical state');
  const rigLevel = upgradeSnapshot.levels['call-rig'] || 0;
  if (rigLevel > 0 && !effects['call-rig']) throw new Error('Call the Rig snapshot is missing persistent summon state');

  return { effects };
}

function normalizeFullSnapshot(snapshot) {
  requirePlainObject(snapshot, 'upgrade run snapshot');
  if (snapshot.schema !== UPGRADE_RUN_SNAPSHOT_SCHEMA) {
    throw new TypeError(`Unsupported upgrade run snapshot schema: ${String(snapshot.schema)}`);
  }
  if (snapshot.version !== UPGRADE_RUN_SNAPSHOT_VERSION) {
    throw new RangeError(`Unsupported upgrade run snapshot version: ${String(snapshot.version)}`);
  }
  const upgrades = normalizeUpgradeLevelSnapshot(snapshot.upgrades);
  const stats = normalizeRunStatSnapshot(snapshot.stats);
  const mechanical = normalizeMechanicalSnapshot(snapshot.mechanical, upgrades);
  return { schema: UPGRADE_RUN_SNAPSHOT_SCHEMA, version: UPGRADE_RUN_SNAPSHOT_VERSION, upgrades, stats, mechanical };
}

function requireCleanRestoreTarget(scene) {
  if (!scene || typeof scene !== 'object') throw new TypeError('Upgrade snapshot restore requires a scene');
  if (!scene.runStatState?.state || typeof scene.runStatState.resolve !== 'function') {
    throw new Error('Upgrade snapshot restore requires initialized scene.runStatState');
  }
  const levels = scene.upgradeLevels ?? {};
  requirePlainObject(levels, 'scene.upgradeLevels');
  if (Object.values(levels).some(level => Number(level) !== 0)) {
    throw new Error('Upgrade snapshot restore target must not already contain acquired upgrades');
  }
  const history = scene.upgradeRarityHistory ?? {};
  requirePlainObject(history, 'scene.upgradeRarityHistory');
  if (Object.keys(history).length) throw new Error('Upgrade snapshot restore target must not contain rarity history');
  const mechanicalState = scene.upgradeMechanicalState ?? {};
  requirePlainObject(mechanicalState, 'scene.upgradeMechanicalState');
  if (Object.keys(mechanicalState).length) throw new Error('Upgrade snapshot restore target must not contain mechanical upgrade state');
  if (scene.rigSummoned === true) throw new Error('Upgrade snapshot restore target must not already have the Rig summoned');
}

function replaceRecord(target, source, cloneValue) {
  for (const key of Object.keys(target)) delete target[key];
  for (const [key, value] of Object.entries(source)) target[key] = cloneValue(value);
}

function restoreStats(scene, stats) {
  const state = scene.runStatState.state;
  for (const domain of STAT_DOMAINS) {
    if (!state.modifiers?.[domain] || !state.caps?.[domain]) {
      throw new Error(`Upgrade snapshot restore is missing run stat domain: ${domain}`);
    }
    replaceRecord(state.modifiers[domain], stats.modifiers[domain], value => value.map(modifier => ({ ...modifier })));
    replaceRecord(state.caps[domain], stats.caps[domain], value => ({ ...value }));
  }
  const resolved = scene.runStatState.resolve();
  mirrorResolvedRunStats(scene, resolved);
  return resolved;
}

function prepareRigRestore(scene, mechanical) {
  const rigState = mechanical.effects['call-rig'];
  if (!rigState?.summoned) return null;
  if (!scene.rigSystem || typeof scene.rigSystem.summon !== 'function') {
    throw new Error('Call the Rig snapshot restore requires scene.rigSystem.summon()');
  }
  if (!scene.cart || !scene.hero) throw new Error('Call the Rig snapshot restore requires scene.cart and scene.hero');
  return () => {
    if (scene.rigSystem.summon() !== true) throw new Error('Call the Rig snapshot restore could not restore the summoned companion');
  };
}

function restoreMechanical(scene, mechanical) {
  scene.upgradeMechanicalState = {};
  const twin = mechanical.effects['twin-riveter'];
  if (twin) {
    const state = Object.freeze({ ...twin });
    scene.upgradeMechanicalState['twin-riveter'] = state;
    scene.twinShots = twin.projectileCount;
  }
}

export function createUpgradeLevelSnapshot(scene) {
  const raw = {
    levels: { ...(scene?.upgradeLevels || {}) },
    rarityHistory: Object.fromEntries(Object.entries(scene?.upgradeRarityHistory || {}).map(([id, history]) => [
      id,
      Array.isArray(history) ? [...history] : history
    ]))
  };
  return deepFreezeSnapshot(normalizeUpgradeLevelSnapshot(raw));
}

export function createRunStatModifierSnapshot(scene) {
  const state = scene?.runStatState?.state;
  if (!state) throw new Error('Stat snapshot requires scene.runStatState');
  const raw = {
    modifiers: Object.fromEntries(STAT_DOMAINS.map(domain => [domain, state.modifiers?.[domain] || {}])),
    caps: Object.fromEntries(STAT_DOMAINS.map(domain => [domain, state.caps?.[domain] || {}]))
  };
  return deepFreezeSnapshot(normalizeRunStatSnapshot(raw));
}

export function createUpgradeMechanicalSnapshot(scene, upgradeSnapshot = createUpgradeLevelSnapshot(scene)) {
  const effects = {};
  for (const [id, state] of Object.entries(scene?.upgradeMechanicalState || {})) {
    if (state?.effectId === UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER) effects[id] = { ...state };
    else throw new TypeError(`Unsupported upgrade mechanical state for snapshot: ${id}`);
  }
  if ((upgradeSnapshot.levels['call-rig'] || 0) > 0) {
    effects['call-rig'] = {
      id: 'call-rig',
      effectId: UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG,
      level: upgradeSnapshot.levels['call-rig'],
      rarity: lastRarity(upgradeSnapshot, 'call-rig'),
      summoned: scene?.rigSummoned === true
    };
  }
  return deepFreezeSnapshot(normalizeMechanicalSnapshot({ effects }, upgradeSnapshot));
}

export function createUpgradeRunSnapshot(scene) {
  const upgrades = createUpgradeLevelSnapshot(scene);
  const snapshot = {
    schema: UPGRADE_RUN_SNAPSHOT_SCHEMA,
    version: UPGRADE_RUN_SNAPSHOT_VERSION,
    upgrades,
    stats: createRunStatModifierSnapshot(scene),
    mechanical: createUpgradeMechanicalSnapshot(scene, upgrades)
  };
  return deepFreezeSnapshot(snapshot);
}

export function restoreUpgradeRunSnapshot(scene, snapshot) {
  requireCleanRestoreTarget(scene);
  const normalized = normalizeFullSnapshot(snapshot);
  const restoreRig = prepareRigRestore(scene, normalized.mechanical);

  // Restore persistent owner state, not acquisition transactions. RESTORE_HP is intentionally absent.
  restoreRig?.();
  scene.upgradeLevels = { ...normalized.upgrades.levels };
  scene.upgradeRarityHistory = Object.fromEntries(Object.entries(normalized.upgrades.rarityHistory).map(([id, history]) => [id, Object.freeze([...history])]));
  const resolved = restoreStats(scene, normalized.stats);
  restoreMechanical(scene, normalized.mechanical);

  return Object.freeze({
    schema: normalized.schema,
    version: normalized.version,
    resolved,
    restoredUpgradeIds: Object.freeze(Object.keys(normalized.upgrades.levels))
  });
}

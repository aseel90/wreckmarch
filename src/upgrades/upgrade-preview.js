import { createRunStatState } from '../stats/run-stat-state.js?v=4';
import { getUpgradeDefinition } from './upgrade-catalog.js?v=14';
import { createUpgradeMechanicalTransaction, UPGRADE_MECHANICAL_EFFECT_IDS } from './upgrade-mechanical-effects.js?v=7';
import { getUpgradeRarityRule, UPGRADE_RARITIES } from './upgrade-rarity.js?v=1';
import { applyUpgradeStatModifiers } from './upgrade-runtime.js?v=14';

export const UPGRADE_PREVIEW_VERSION = 'u5-before-after-v1';

const STAT_LABELS = Object.freeze({
  damage: 'DAMAGE',
  fireDelay: 'FIRE DELAY',
  projectileSpeed: 'PROJECTILE SPD',
  range: 'RANGE',
  pierceCount: 'PIERCE',
  ricochetCount: 'RICOCHET',
  shrapnelCount: 'SHRAPNEL',
  maxHp: 'MAX HP',
  moveSpeed: 'MOVE SPD',
  armor: 'ARMOR',
  critChance: 'CRIT CHANCE',
  critDamageMultiplier: 'CRIT DAMAGE',
  pickupRadiusMultiplier: 'PICKUP RADIUS'
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function compactNumber(value) {
  const number = finite(value);
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatStatValue(stat, value) {
  const number = finite(value);
  if (stat === 'critChance') return `${compactNumber(number * 100)}%`;
  if (stat === 'critDamageMultiplier' || stat === 'pickupRadiusMultiplier') return `${compactNumber(number)}x`;
  if (stat === 'fireDelay') return `${Math.round(number)}ms`;
  if (stat.endsWith('Count')) return String(Math.max(0, Math.round(number)));
  return compactNumber(number);
}

function statLabel(stat) {
  return STAT_LABELS[stat] || String(stat || 'STAT').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
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

function cloneRunStatState(runStatState) {
  const source = runStatState?.state;
  if (!source || typeof runStatState.resolve !== 'function') throw new Error('Upgrade preview requires scene.runStatState');
  const clone = createRunStatState({
    characterBase: source.base.character,
    weaponBase: source.base.weapon,
    caps: {
      character: cloneCapRecord(source.caps.character),
      weapon: cloneCapRecord(source.caps.weapon)
    }
  });
  clone.state.modifiers.character = cloneModifierRecord(source.modifiers.character);
  clone.state.modifiers.weapon = cloneModifierRecord(source.modifiers.weapon);
  return clone;
}

function cloneMechanicalState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return {};
  return Object.fromEntries(Object.entries(state).map(([id, value]) => [id, value && typeof value === 'object' ? { ...value } : value]));
}

function createPreviewScene(scene) {
  const primaryWeapon = scene?.primaryWeapon && typeof scene.primaryWeapon === 'object'
    ? { ...scene.primaryWeapon, fireProfile: scene.primaryWeapon.fireProfile ? { ...scene.primaryWeapon.fireProfile } : undefined }
    : null;
  return {
    runStatState: cloneRunStatState(scene?.runStatState),
    primaryWeapon,
    damage: finite(scene?.damage),
    fireDelay: finite(scene?.fireDelay),
    heroHp: finite(scene?.heroHp),
    heroMaxHp: finite(scene?.heroMaxHp),
    heroShieldCharges: Math.max(0, Math.floor(finite(scene?.heroShieldCharges))),
    twinShots: scene?.twinShots,
    upgradeMechanicalState: cloneMechanicalState(scene?.upgradeMechanicalState),
    rigSummoned: Boolean(scene?.rigSummoned),
    cart: scene?.cart ? {} : null,
    hero: scene?.hero ? {} : null,
    rigSystem: { summon: () => true }
  };
}

function row({ id, label, before, after, beforeText, afterText, source }) {
  return Object.freeze({
    id,
    label,
    before,
    after,
    beforeText: beforeText ?? compactNumber(before),
    afterText: afterText ?? compactNumber(after),
    source
  });
}

function buildStatRows(definition, beforeResolved, afterResolved) {
  const seen = new Set();
  const rows = [];
  for (const modifier of definition.modifiers || []) {
    const key = `${modifier.domain}:${modifier.stat}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const before = beforeResolved?.[modifier.domain]?.[modifier.stat];
    const after = afterResolved?.[modifier.domain]?.[modifier.stat];
    if (!Number.isFinite(Number(before)) || !Number.isFinite(Number(after))) {
      throw new Error(`Upgrade preview cannot resolve ${key} for ${definition.id}`);
    }
    rows.push(row({
      id: key,
      label: statLabel(modifier.stat),
      before: Number(before),
      after: Number(after),
      beforeText: formatStatValue(modifier.stat, before),
      afterText: formatStatValue(modifier.stat, after),
      source: 'STAT'
    }));
  }
  return rows;
}

function projectileBaseline(scene, effectId, definitionId) {
  const direct = scene.upgradeMechanicalState?.[definitionId];
  const inherited = effectId === UPGRADE_MECHANICAL_EFFECT_IDS.TRIPLE_RIVETER
    ? scene.upgradeMechanicalState?.['twin-riveter']
    : null;
  const state = direct || inherited || {};
  const fireProfile = scene.primaryWeapon?.fireProfile || {};
  return {
    projectileCount: Math.max(1, Math.round(finite(state.projectileCount ?? fireProfile.projectileCount ?? scene.twinShots, 1))),
    volleyDamageMultiplier: finite(state.volleyDamageMultiplier ?? fireProfile.volleyDamageMultiplier, 1)
  };
}

function buildMechanicalRows(sceneBefore, definition, result) {
  if (!result) return [];
  switch (result.effectId) {
    case UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER:
    case UPGRADE_MECHANICAL_EFFECT_IDS.TRIPLE_RIVETER: {
      const before = projectileBaseline(sceneBefore, result.effectId, definition.id);
      return [
        row({ id: 'mechanical:projectileCount', label: 'RIVETS', before: before.projectileCount, after: result.projectileCount, beforeText: String(before.projectileCount), afterText: String(result.projectileCount), source: 'MECHANICAL' }),
        row({ id: 'mechanical:volleyDamageMultiplier', label: 'VOLLEY', before: before.volleyDamageMultiplier, after: result.volleyDamageMultiplier, beforeText: `${compactNumber(before.volleyDamageMultiplier)}x`, afterText: `${compactNumber(result.volleyDamageMultiplier)}x`, source: 'MECHANICAL' })
      ];
    }
    case UPGRADE_MECHANICAL_EFFECT_IDS.EXPLOSIVE_RIVET: {
      const before = sceneBefore.upgradeMechanicalState?.[definition.id] || null;
      return [
        row({ id: 'mechanical:cadenceMs', label: 'BLAST', before: before?.cadenceMs ?? null, after: result.cadenceMs, beforeText: before ? `${compactNumber(before.cadenceMs / 1000)}s` : 'OFF', afterText: `${compactNumber(result.cadenceMs / 1000)}s`, source: 'MECHANICAL' }),
        row({ id: 'mechanical:radius', label: 'RADIUS', before: before?.radius ?? null, after: result.radius, beforeText: before ? compactNumber(before.radius) : '—', afterText: compactNumber(result.radius), source: 'MECHANICAL' })
      ];
    }
    case UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP:
      return [row({
        id: 'mechanical:heroHp',
        label: 'HP',
        before: result.previousHp,
        after: result.heroHp,
        beforeText: `${compactNumber(result.previousHp)}/${compactNumber(sceneBefore.heroMaxHp)}`,
        afterText: `${compactNumber(result.heroHp)}/${compactNumber(result.heroMaxHp)}`,
        source: 'MECHANICAL'
      })];
    case UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD: {
      const beforeCharges = Math.max(0, Math.floor(finite(sceneBefore.heroShieldCharges)));
      return [row({
        id: 'mechanical:shieldCharges',
        label: 'SHIELD',
        before: beforeCharges,
        after: result.heroShieldCharges,
        beforeText: `${beforeCharges}/${result.maxCharges}`,
        afterText: `${result.heroShieldCharges}/${result.maxCharges}`,
        source: 'MECHANICAL'
      })];
    }
    case UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG:
      return [row({ id: 'mechanical:rig', label: 'RIG', before: sceneBefore.rigSummoned ? 1 : 0, after: 1, beforeText: sceneBefore.rigSummoned ? 'ON' : 'OFF', afterText: 'ON', source: 'MECHANICAL' })];
    default:
      throw new Error(`Unsupported upgrade preview mechanical effect: ${String(result.effectId)}`);
  }
}

export function getUpgradeBeforeAfterPreview(scene, upgrade) {
  const id = typeof upgrade === 'string' ? upgrade : upgrade?.id;
  const definition = getUpgradeDefinition(id);
  if (!definition) throw new Error(`Unknown upgrade definition: ${String(id)}`);
  const currentLevel = Math.max(0, Math.floor(finite(scene?.upgradeLevels?.[id])));
  const nextLevel = currentLevel + 1;
  if (nextLevel > definition.maxLevel) throw new RangeError(`${definition.id} is already at max level ${definition.maxLevel}`);
  const rarity = typeof upgrade === 'object' && upgrade?.rarity
    ? upgrade.rarity
    : definition.rarity || UPGRADE_RARITIES.COMMON;
  const powerMultiplier = getUpgradeRarityRule(rarity).powerMultiplier;
  const beforeResolved = scene.runStatState.resolve();
  const previewScene = createPreviewScene(scene);
  let afterResolved = beforeResolved;
  let mechanicalResult = null;

  if (definition.modifiers?.length) {
    afterResolved = applyUpgradeStatModifiers(previewScene, definition, nextLevel, { rarity });
  }
  if (definition.mechanicalEffect) {
    const transaction = createUpgradeMechanicalTransaction(previewScene, definition, nextLevel, { rarity, powerMultiplier });
    mechanicalResult = transaction.apply();
  }

  const rows = [
    ...buildStatRows(definition, beforeResolved, afterResolved),
    ...buildMechanicalRows(createPreviewScene(scene), definition, mechanicalResult)
  ];
  if (!rows.length) throw new Error(`Upgrade preview produced no rows for ${definition.id}`);

  return Object.freeze({
    version: UPGRADE_PREVIEW_VERSION,
    id: definition.id,
    rarity,
    currentLevel,
    nextLevel,
    maxLevel: definition.maxLevel,
    rows: Object.freeze(rows)
  });
}

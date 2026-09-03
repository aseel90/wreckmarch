/* WRECKMARCH U6 — canonical read-only run build snapshot. */
import { getUpgradeDefinition } from './upgrade-catalog.js?v=14';

export const RUN_BUILD_SNAPSHOT_VERSION = 'u6-run-build-snapshot-v1';

function requireScene(scene) {
  if (!scene || typeof scene !== 'object') throw new TypeError('Run build snapshot requires a scene');
  if (!scene.runStatState || typeof scene.runStatState.resolve !== 'function') {
    throw new Error('Run build snapshot requires initialized scene.runStatState');
  }
  return scene;
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function freezeRecord(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) freezeRecord(nested);
  return value;
}

function compactStats(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return {};
  return Object.fromEntries(
    Object.keys(block)
      .sort()
      .map(key => [key, Number(block[key])])
  );
}

function acquiredUpgrades(scene) {
  const levels = scene.upgradeLevels && typeof scene.upgradeLevels === 'object' && !Array.isArray(scene.upgradeLevels)
    ? scene.upgradeLevels
    : {};
  const rarityHistory = scene.upgradeRarityHistory && typeof scene.upgradeRarityHistory === 'object' && !Array.isArray(scene.upgradeRarityHistory)
    ? scene.upgradeRarityHistory
    : {};

  return Object.entries(levels)
    .filter(([, rawLevel]) => Number.isInteger(Number(rawLevel)) && Number(rawLevel) > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, rawLevel]) => {
      const level = Number(rawLevel);
      const definition = getUpgradeDefinition(id);
      const history = Array.isArray(rarityHistory[id]) ? rarityHistory[id].slice(0, level).map(String) : [];
      return {
        id,
        title: definition?.title || id,
        level,
        maxLevel: Number(definition?.maxLevel || level),
        rarities: history,
        latestRarity: history[history.length - 1] || null,
      };
    });
}

function fallbackVolley(scene) {
  const fireProfile = scene.primaryWeapon?.fireProfile || scene.weaponDefinition?.fireProfile || {};
  const projectileCount = Math.max(1, Math.floor(finite(fireProfile.projectileCount, 1)));
  const volleyDamageMultiplier = finite(fireProfile.volleyDamageMultiplier, 1) > 0
    ? finite(fireProfile.volleyDamageMultiplier, 1)
    : 1;
  return {
    source: 'weapon',
    projectileCount,
    halfSpreadRadians: Math.max(0, finite(fireProfile.halfSpreadRadians, 0)),
    volleyDamageMultiplier,
    projectileDamageScale: volleyDamageMultiplier / projectileCount,
  };
}

export function createRunBuildSnapshot(scene) {
  requireScene(scene);
  const resolved = scene.runStatState.resolve();
  const characterStats = compactStats(resolved?.character);
  const weaponStats = compactStats(resolved?.weapon);
  const volley = scene.weaponSystem?.heroVolleyProfile?.() || fallbackVolley(scene);
  const fireDelay = finite(weaponStats.fireDelay, finite(scene.primaryWeapon?.fireDelay, 0));
  const characterDefinition = scene.characterDefinition || {};
  const weaponDefinition = scene.weaponDefinition || {};

  return freezeRecord({
    version: RUN_BUILD_SNAPSHOT_VERSION,
    character: {
      id: String(characterDefinition.id || scene.characterId || 'unknown'),
      displayName: String(characterDefinition.displayName || characterDefinition.id || scene.characterId || 'SURVIVOR'),
      hp: {
        current: finite(scene.heroHp, finite(characterStats.maxHp, 0)),
        max: finite(characterStats.maxHp, 0),
      },
      stats: characterStats,
    },
    weapon: {
      id: String(weaponDefinition.id || scene.activeWeaponId || scene.startingWeaponId || 'unknown'),
      displayName: String(weaponDefinition.displayName || weaponDefinition.id || scene.activeWeaponId || 'WEAPON'),
      stats: weaponStats,
      fireRatePerSecond: fireDelay > 0 ? 1000 / fireDelay : 0,
      volley: {
        source: String(volley.source || 'weapon'),
        projectileCount: Math.max(1, Math.floor(finite(volley.projectileCount, 1))),
        halfSpreadRadians: Math.max(0, finite(volley.halfSpreadRadians, 0)),
        volleyDamageMultiplier: Math.max(0, finite(volley.volleyDamageMultiplier, 1)),
        projectileDamageScale: Math.max(0, finite(volley.projectileDamageScale, 1)),
      },
    },
    upgrades: acquiredUpgrades(scene),
  });
}

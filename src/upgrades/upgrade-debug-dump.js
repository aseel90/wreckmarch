export const UPGRADE_DEBUG_DUMP_VERSION = 1;

function requireScene(scene) {
  if (!scene || typeof scene !== 'object') throw new TypeError('Upgrade debug dump requires a scene');
  if (!scene.runStatState || typeof scene.runStatState.resolve !== 'function') {
    throw new Error('Upgrade debug dump requires initialized scene.runStatState');
  }
  return scene;
}

function debugNumber(value) {
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  return value;
}

function compactStatBlock(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return {};
  return Object.fromEntries(
    Object.keys(block)
      .sort()
      .map(key => [key, debugNumber(block[key])])
  );
}

function compactUpgradeList(scene) {
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
      const history = Array.isArray(rarityHistory[id])
        ? rarityHistory[id].slice(0, level).map(value => String(value))
        : [];
      return Object.freeze({ id, level, rarities: Object.freeze(history) });
    });
}

export function createUpgradeDebugDump(scene) {
  requireScene(scene);
  const resolved = scene.runStatState.resolve();
  return Object.freeze({
    version: UPGRADE_DEBUG_DUMP_VERSION,
    upgrades: Object.freeze(compactUpgradeList(scene)),
    stats: Object.freeze({
      character: Object.freeze(compactStatBlock(resolved?.character)),
      weapon: Object.freeze(compactStatBlock(resolved?.weapon))
    })
  });
}

export function stringifyUpgradeDebugDump(scene) {
  return JSON.stringify(createUpgradeDebugDump(scene));
}

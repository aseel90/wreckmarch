import { createRunBuildSnapshot } from './run-build-snapshot.js?v=1';

export const UPGRADE_DEBUG_DUMP_VERSION = 1;

function debugNumber(value) {
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  return value;
}

function debugStatBlock(block) {
  return Object.freeze(Object.fromEntries(
    Object.keys(block || {}).sort().map(key => [key, debugNumber(block[key])])
  ));
}

export function createUpgradeDebugDump(scene) {
  const snapshot = createRunBuildSnapshot(scene);
  const upgrades = Object.freeze(snapshot.upgrades.map(upgrade => Object.freeze({
    id: upgrade.id,
    level: upgrade.level,
    rarities: Object.freeze([...upgrade.rarities])
  })));
  return Object.freeze({
    version: UPGRADE_DEBUG_DUMP_VERSION,
    upgrades,
    stats: Object.freeze({
      character: debugStatBlock(snapshot.character.stats),
      weapon: debugStatBlock(snapshot.weapon.stats)
    })
  });
}

export function stringifyUpgradeDebugDump(scene) {
  return JSON.stringify(createUpgradeDebugDump(scene));
}

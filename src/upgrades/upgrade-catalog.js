import { createUpgradeRegistry } from './upgrade-registry.js?v=2';
import { HEAVY_RIVETS_UPGRADE } from './definitions/heavy-rivets.js';
import { OVERCLOCK_UPGRADE } from './definitions/overclock.js';

const DEFAULT_UPGRADE_REGISTRY = createUpgradeRegistry([
  HEAVY_RIVETS_UPGRADE,
  OVERCLOCK_UPGRADE
]);

export function getUpgradeDefinition(id) {
  return DEFAULT_UPGRADE_REGISTRY.get(id);
}

export function listUpgradeDefinitions() {
  return DEFAULT_UPGRADE_REGISTRY.list();
}

export function hasUpgradeDefinition(id) {
  return DEFAULT_UPGRADE_REGISTRY.has(id);
}

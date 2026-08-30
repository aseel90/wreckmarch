import { createUpgradeRegistry } from './upgrade-registry.js?v=2';
import { HEAVY_RIVETS_UPGRADE } from './definitions/heavy-rivets.js';
import { OVERCLOCK_UPGRADE } from './definitions/overclock.js';
import { LONG_BARREL_UPGRADE } from './definitions/long-barrel.js';
import { TWIN_RIVETER_UPGRADE } from './definitions/twin-riveter.js';
import { FLEET_FEET_UPGRADE } from './definitions/fleet-feet.js';
import { SCRAP_MAGNET_UPGRADE } from './definitions/scrap-magnet.js';

const DEFAULT_UPGRADE_REGISTRY = createUpgradeRegistry([
  HEAVY_RIVETS_UPGRADE,
  OVERCLOCK_UPGRADE,
  LONG_BARREL_UPGRADE,
  TWIN_RIVETER_UPGRADE,
  FLEET_FEET_UPGRADE,
  SCRAP_MAGNET_UPGRADE
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

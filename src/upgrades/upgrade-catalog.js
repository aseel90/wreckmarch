import { createUpgradeRegistry } from './upgrade-registry.js?v=3';
import { HEAVY_RIVETS_UPGRADE } from './definitions/heavy-rivets.js';
import { OVERCLOCK_UPGRADE } from './definitions/overclock.js';
import { LONG_BARREL_UPGRADE } from './definitions/long-barrel.js';
import { TWIN_RIVETER_UPGRADE } from './definitions/twin-riveter.js?v=3';
import { TRIPLE_RIVETER_UPGRADE } from './definitions/triple-riveter.js?v=1';
import { EXPLOSIVE_RIVET_UPGRADE } from './definitions/explosive-rivet.js?v=2';
import { PIERCING_RIVETS_UPGRADE } from './definitions/piercing-rivets.js';
import { RICOCHET_UPGRADE } from './definitions/ricochet.js';
import { SHRAPNEL_IMPACT_UPGRADE } from './definitions/shrapnel-impact.js';
import { CRITICAL_RIVET_UPGRADE } from './definitions/critical-rivet.js';
import { FLEET_FEET_UPGRADE } from './definitions/fleet-feet.js';
import { SCRAP_MAGNET_UPGRADE } from './definitions/scrap-magnet.js';
import { ARMOR_PLATE_UPGRADE } from './definitions/armor-plate.js';
import { FIELD_REPAIR_UPGRADE } from './definitions/field-repair.js?v=1';
import { IMPACT_SHIELD_UPGRADE } from './definitions/impact-shield.js?v=1';
import { CALL_RIG_UPGRADE } from './definitions/call-rig.js?v=2';

const DEFAULT_UPGRADE_REGISTRY = createUpgradeRegistry([
  HEAVY_RIVETS_UPGRADE,
  OVERCLOCK_UPGRADE,
  LONG_BARREL_UPGRADE,
  TWIN_RIVETER_UPGRADE,
  TRIPLE_RIVETER_UPGRADE,
  EXPLOSIVE_RIVET_UPGRADE,
  PIERCING_RIVETS_UPGRADE,
  RICOCHET_UPGRADE,
  SHRAPNEL_IMPACT_UPGRADE,
  CRITICAL_RIVET_UPGRADE,
  FLEET_FEET_UPGRADE,
  SCRAP_MAGNET_UPGRADE,
  ARMOR_PLATE_UPGRADE,
  FIELD_REPAIR_UPGRADE,
  IMPACT_SHIELD_UPGRADE,
  CALL_RIG_UPGRADE
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

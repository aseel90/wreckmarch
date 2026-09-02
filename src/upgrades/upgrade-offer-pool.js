import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from './upgrade-runtime.js?v=14';

export const UPGRADE_OFFER_POOL_GROUPS = Object.freeze({
  HUNTER_INITIAL: 'HUNTER_INITIAL',
  HUNTER_ADVANCED: 'HUNTER_ADVANCED',
  SURVIVABILITY_AUXILIARY: 'SURVIVABILITY_AUXILIARY',
  COMPANION_AUXILIARY: 'COMPANION_AUXILIARY'
});

export const UPGRADE_OFFER_CHOICE_KINDS = Object.freeze({
  STAT: 'STAT',
  REGISTERED: 'REGISTERED'
});

function offer(id, category, kind, group) {
  return Object.freeze({ id, category, kind, group });
}

// Keep this sequence stable. Weighted seeded rolls depend on candidate ordering.
// U4 finalizes a 12-card Hunter core while preserving the already-live advanced,
// survivability and companion choices as separately-classified auxiliary offers.
// Classification is descriptive only: active offers, weights and canonical requirements stay unchanged.
const ACTIVE_UPGRADE_OFFER_DESCRIPTORS = Object.freeze([
  offer('heavy-rivets', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('overclock', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('long-barrel', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('piercing-rivets', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('ricochet', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('shrapnel-impact', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('critical-rivet', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('twin-riveter', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('triple-riveter', 'EVOLUTION', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.HUNTER_ADVANCED),
  offer('explosive-rivet', 'HERO', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('fleet-feet', 'UTILITY', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('scrap-magnet', 'UTILITY', UPGRADE_OFFER_CHOICE_KINDS.STAT, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('armor-plate', 'UTILITY', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL),
  offer('field-repair', 'UTILITY', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.SURVIVABILITY_AUXILIARY),
  offer('impact-shield', 'UTILITY', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.SURVIVABILITY_AUXILIARY),
  offer('call-rig', 'FORTRESS', UPGRADE_OFFER_CHOICE_KINDS.REGISTERED, UPGRADE_OFFER_POOL_GROUPS.COMPANION_AUXILIARY)
]);

function byGroup(group) {
  return Object.freeze(ACTIVE_UPGRADE_OFFER_DESCRIPTORS.filter(descriptor => descriptor.group === group));
}

const HUNTER_INITIAL_OFFER_DESCRIPTORS = byGroup(UPGRADE_OFFER_POOL_GROUPS.HUNTER_INITIAL);
const HUNTER_ADVANCED_OFFER_DESCRIPTORS = byGroup(UPGRADE_OFFER_POOL_GROUPS.HUNTER_ADVANCED);
const SURVIVABILITY_AUXILIARY_OFFER_DESCRIPTORS = byGroup(UPGRADE_OFFER_POOL_GROUPS.SURVIVABILITY_AUXILIARY);
const COMPANION_AUXILIARY_OFFER_DESCRIPTORS = byGroup(UPGRADE_OFFER_POOL_GROUPS.COMPANION_AUXILIARY);

export function listActiveUpgradeOfferDescriptors() {
  return ACTIVE_UPGRADE_OFFER_DESCRIPTORS;
}

export function listHunterInitialOfferDescriptors() {
  return HUNTER_INITIAL_OFFER_DESCRIPTORS;
}

export function listHunterAdvancedOfferDescriptors() {
  return HUNTER_ADVANCED_OFFER_DESCRIPTORS;
}

export function listSurvivabilityAuxiliaryOfferDescriptors() {
  return SURVIVABILITY_AUXILIARY_OFFER_DESCRIPTORS;
}

export function listCompanionAuxiliaryOfferDescriptors() {
  return COMPANION_AUXILIARY_OFFER_DESCRIPTORS;
}

export function createActiveUpgradeOfferChoices(scene) {
  return ACTIVE_UPGRADE_OFFER_DESCRIPTORS.map(descriptor => {
    const options = { category: descriptor.category };
    return descriptor.kind === UPGRADE_OFFER_CHOICE_KINDS.STAT
      ? createRegisteredStatUpgradeChoice(scene, descriptor.id, options)
      : createRegisteredUpgradeChoice(scene, descriptor.id, options);
  });
}

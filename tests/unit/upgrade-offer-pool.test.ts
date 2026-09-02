import { describe, expect, it } from 'vitest';
import {
  UPGRADE_OFFER_CHOICE_KINDS,
  UPGRADE_OFFER_POOL_GROUPS,
  listActiveUpgradeOfferDescriptors,
  listCompanionAuxiliaryOfferDescriptors,
  listHunterAdvancedOfferDescriptors,
  listHunterInitialOfferDescriptors,
  listSurvivabilityAuxiliaryOfferDescriptors
} from '../../src/upgrades/upgrade-offer-pool.js';

const ids = (items: readonly { id: string }[]) => items.map(item => item.id);

describe('U4 canonical upgrade offer pool', () => {
  it('locks the initial Hunter core to the approved 12 cards', () => {
    expect(ids(listHunterInitialOfferDescriptors())).toEqual([
      'heavy-rivets',
      'overclock',
      'long-barrel',
      'piercing-rivets',
      'ricochet',
      'shrapnel-impact',
      'critical-rivet',
      'twin-riveter',
      'explosive-rivet',
      'fleet-feet',
      'scrap-magnet',
      'armor-plate'
    ]);
    expect(listHunterInitialOfferDescriptors()).toHaveLength(12);
  });

  it('keeps Triple as an advanced prerequisite-based Hunter unlock outside the initial 12', () => {
    expect(ids(listHunterAdvancedOfferDescriptors())).toEqual(['triple-riveter']);
    expect(ids(listHunterInitialOfferDescriptors())).not.toContain('triple-riveter');
  });

  it('preserves deliberate survivability and companion choices as auxiliary pools', () => {
    expect(ids(listSurvivabilityAuxiliaryOfferDescriptors())).toEqual(['field-repair', 'impact-shield']);
    expect(ids(listCompanionAuxiliaryOfferDescriptors())).toEqual(['call-rig']);
  });

  it('preserves the production offer ordering and cardinality so seeded weighted RNG does not shift', () => {
    const active = listActiveUpgradeOfferDescriptors();
    expect(active).toHaveLength(16);
    expect(ids(active)).toEqual([
      'heavy-rivets',
      'overclock',
      'long-barrel',
      'piercing-rivets',
      'ricochet',
      'shrapnel-impact',
      'critical-rivet',
      'twin-riveter',
      'triple-riveter',
      'explosive-rivet',
      'fleet-feet',
      'scrap-magnet',
      'armor-plate',
      'field-repair',
      'impact-shield',
      'call-rig'
    ]);
  });

  it('keeps every active id unique and every descriptor classified', () => {
    const active = listActiveUpgradeOfferDescriptors();
    expect(new Set(ids(active)).size).toBe(active.length);
    expect(new Set(active.map(item => item.group))).toEqual(new Set(Object.values(UPGRADE_OFFER_POOL_GROUPS)));
    expect(new Set(active.map(item => item.kind))).toEqual(new Set(Object.values(UPGRADE_OFFER_CHOICE_KINDS)));
  });
});

import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';

export const SCRAP_MAGNET_UPGRADE = Object.freeze({
  id: 'scrap-magnet',
  name: 'SCRAP MAGNET',
  description: 'Increase Scrap pickup radius by 25%.',
  rarity: null,
  maxLevel: 4,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['PICKUP_RADIUS', 'UTILITY'],
  requirements: [],
  weight: 1,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.CHARACTER,
    stat: 'pickupRadiusMultiplier',
    type: T.MULTIPLICATIVE_PERCENT,
    value: .25
  })]),
  mechanicalEffect: null,
  artId: 'scrap-magnet'
});

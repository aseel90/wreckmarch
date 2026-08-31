import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js';

export const RICOCHET_UPGRADE = Object.freeze({
  id: 'ricochet',
  name: 'RICOCHET',
  description: 'Rivets bounce to +1 nearby enemy after impact.',
  rarity: 'RARE',
  maxLevel: 2,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['PROJECTILE', 'RICOCHET', 'RIVET'],
  requirements: [],
  weight: 0.58,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.WEAPON,
    stat: 'ricochetCount',
    type: T.FLAT,
    value: 1,
    min: 0,
    max: 2
  })]),
  mechanicalEffect: null,
  artId: 'ricochet'
});

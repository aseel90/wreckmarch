import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js';

export const PIERCING_RIVETS_UPGRADE = Object.freeze({
  id: 'piercing-rivets',
  name: 'PIERCING RIVETS',
  description: 'Rivets pierce +1 additional enemy.',
  rarity: 'COMMON',
  maxLevel: 3,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['PROJECTILE', 'PIERCE', 'RIVET'],
  requirements: [],
  weight: 0.82,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.WEAPON,
    stat: 'pierceCount',
    type: T.FLAT,
    value: 1,
    min: 0,
    max: 3
  })]),
  mechanicalEffect: null,
  artId: 'piercing-rivets'
});

import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js';

export const HEAVY_RIVETS_UPGRADE = Object.freeze({
  id: 'heavy-rivets',
  name: 'HEAVY RIVETS',
  description: '+12% active weapon damage.',
  rarity: null,
  maxLevel: 5,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['DAMAGE', 'RIVET'],
  requirements: [],
  weight: 1.25,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.WEAPON,
    stat: 'damage',
    type: T.ADDITIVE_PERCENT,
    value: 0.12
  })]),
  mechanicalEffect: null,
  artId: 'heavy-rivets'
});

import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js';

export const SHRAPNEL_IMPACT_UPGRADE = Object.freeze({
  id: 'shrapnel-impact',
  name: 'SHRAPNEL IMPACT',
  description: 'Rivet impacts release +2 short-range damaging fragments.',
  rarity: 'COMMON',
  maxLevel: 2,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['PROJECTILE', 'RIVET', 'SHRAPNEL'],
  requirements: [],
  weight: 0.7,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.WEAPON,
    stat: 'shrapnelCount',
    type: T.FLAT,
    value: 2,
    min: 0,
    max: 4
  })]),
  mechanicalEffect: null,
  artId: 'shrapnel-impact'
});

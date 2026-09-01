import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';

export const OVERCLOCK_UPGRADE = Object.freeze({
  id: 'overclock',
  name: 'OVERCLOCK',
  description: '12% faster fire rate.',
  rarity: null,
  maxLevel: 5,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['FIRE_RATE', 'RIVET'],
  requirements: [],
  weight: 1.2,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.WEAPON,
    stat: 'fireDelay',
    type: T.INVERSE_ADDITIVE_PERCENT,
    value: 0.12,
    min: 145
  })]),
  mechanicalEffect: null,
  artId: 'overclock'
});

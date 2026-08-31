import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js';

export const CRITICAL_RIVET_UPGRADE = Object.freeze({
  id: 'critical-rivet',
  name: 'CRITICAL RIVET',
  description: '+5% critical chance for Hero rivets. Critical hits deal x1.5 base combat damage.',
  rarity: null,
  maxLevel: 4,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['CRITICAL', 'PRECISION', 'RIVET'],
  requirements: [],
  weight: 0.85,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.CHARACTER,
    stat: 'critChance',
    type: T.FLAT,
    value: 0.05,
    min: 0,
    max: 0.35
  })]),
  mechanicalEffect: null,
  artId: 'critical-rivet'
});

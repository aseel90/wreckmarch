import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=2';

export const ARMOR_PLATE_UPGRADE = Object.freeze({
  id: 'armor-plate',
  name: 'ARMOR PLATE',
  description: '+15 max HP and restore 15 HP.',
  rarity: null,
  maxLevel: 4,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['MAX_HP', 'HEAL', 'UTILITY'],
  requirements: [],
  weight: .95,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.CHARACTER,
    stat: 'maxHp',
    type: T.FLAT,
    value: 15
  })]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP,
    config: Object.freeze({ amount: 15 })
  }),
  artId: 'armor-plate'
});

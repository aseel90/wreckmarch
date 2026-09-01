import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=5';

export const FIELD_REPAIR_UPGRADE = Object.freeze({
  id: 'field-repair',
  name: 'FIELD REPAIR',
  description: 'Restore 25% max HP.',
  rarity: null,
  maxLevel: 3,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['HEAL', 'SURVIVABILITY', 'UTILITY'],
  requirements: [],
  weight: .78,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP,
    config: Object.freeze({ percentMaxHp: .25, requireMissingHp: true, minMissingFraction: .12 })
  }),
  artId: 'field-repair'
});

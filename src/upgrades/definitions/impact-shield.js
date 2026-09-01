import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=5';

export const IMPACT_SHIELD_UPGRADE = Object.freeze({
  id: 'impact-shield',
  name: 'IMPACT SHIELD',
  description: 'Gain 1 shield charge. Absorbs the next hit. Max 2 charges.',
  rarity: 'COMMON',
  maxLevel: 2,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['SHIELD', 'SURVIVABILITY', 'UTILITY'],
  requirements: [],
  weight: .72,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD,
    config: Object.freeze({ charges: 1, maxCharges: 2 })
  }),
  artId: 'impact-shield'
});

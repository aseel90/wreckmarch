import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=3';

export const CALL_RIG_UPGRADE = Object.freeze({
  id: 'call-rig',
  name: 'CALL THE RIG',
  description: 'Summon the moving Fortress companion.',
  rarity: null,
  maxLevel: 1,
  scope: UPGRADE_SCOPES.COMPANION,
  tags: ['COMPANION', 'SUMMON'],
  requirements: [],
  weight: 0.7,
  offerRules: Object.freeze({ minSceneLevel: 2, requireSceneFlagFalse: 'rigSummoned' }),
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({ id: UPGRADE_MECHANICAL_EFFECT_IDS.CALL_RIG, config: Object.freeze({}) }),
  artId: 'call-rig'
});

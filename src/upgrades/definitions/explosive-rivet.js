import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=6';

export const EXPLOSIVE_RIVET_UPGRADE = Object.freeze({
  id: 'explosive-rivet',
  name: 'EXPLOSIVE RIVET',
  description: 'Periodically arm one rivet to burst on its first valid impact.',
  rarity: 'COMMON',
  maxLevel: 3,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['EXPLOSION', 'RIVET', 'CROWD'],
  requirements: [],
  weight: 0.62,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.EXPLOSIVE_RIVET,
    config: Object.freeze({
      cadenceMsByLevel: Object.freeze([5000, 4500, 4000]),
      damageCoefficient: 0.33,
      radiusByLevel: Object.freeze([90, 105, 120]),
      targetCapByLevel: Object.freeze([3, 3, 4])
    })
  }),
  artId: null
});

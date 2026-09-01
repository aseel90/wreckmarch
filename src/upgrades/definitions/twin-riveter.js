import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=1';

export const TWIN_RIVETER_UPGRADE = Object.freeze({
  id: 'twin-riveter',
  name: 'TWIN RIVETER',
  description: 'Fire two rivets; repeated level strengthens their shared volley.',
  rarity: 'COMMON',
  maxLevel: 2,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['PROJECTILE_COUNT', 'RIVET'],
  requirements: [],
  weight: 0.72,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.TWIN_RIVETER,
    config: Object.freeze({
      projectileCount: 2,
      volleyDamageMultipliers: Object.freeze([1.2, 1.4])
    })
  }),
  artId: 'twin-riveter'
});

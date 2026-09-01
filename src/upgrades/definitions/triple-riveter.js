import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=4';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=7';

export const TRIPLE_RIVETER_UPGRADE = Object.freeze({
  id: 'triple-riveter',
  name: 'TRIPLE RIVETER',
  description: 'Evolve Twin Riveter into three rivets sharing a 1.60x volley budget.',
  rarity: 'RARE',
  maxLevel: 1,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['PROJECTILE_COUNT', 'RIVET', 'EVOLUTION'],
  compatibility: Object.freeze({ weaponIds: Object.freeze(['rivet-gun']) }),
  requirements: Object.freeze([
    Object.freeze({ type: 'upgrade-level', id: 'twin-riveter', level: 2 })
  ]),
  weight: 0.38,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.TRIPLE_RIVETER,
    config: Object.freeze({ projectileCount: 3, volleyDamageMultiplier: 1.6 })
  }),
  artId: 'triple-riveter'
});

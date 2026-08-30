import { UPGRADE_SCOPES } from '../upgrade-schema.js';

export const CALL_RIG_UPGRADE = Object.freeze({
  id: 'call-rig',
  name: 'CALL THE RIG',
  description: 'Summon the moving Fortress companion.',
  rarity: 'COMMON',
  maxLevel: 1,
  scope: UPGRADE_SCOPES.COMPANION,
  tags: Object.freeze(['companion', 'summon']),
  requirements: Object.freeze([]),
  weight: 0.7,
  offerRules: Object.freeze({ minRunLevel: 2 }),
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: 'SUMMON_RIG',
    config: Object.freeze({})
  }),
  artId: 'call-rig'
});

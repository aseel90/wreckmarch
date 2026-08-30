import { RUN_BALANCE } from '../../balance/run-balance.js?v=6';
import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';

export const FLEET_FEET_UPGRADE = Object.freeze({
  id: 'fleet-feet',
  name: 'FLEET FEET',
  description: '+3% movement speed.',
  rarity: null,
  maxLevel: RUN_BALANCE.player.fleetFeetMaxLevel,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['MOVE_SPEED', 'UTILITY'],
  requirements: [],
  weight: 1.05,
  offerRules: {},
  modifiers: Object.freeze([Object.freeze({
    domain: D.CHARACTER,
    stat: 'moveSpeed',
    type: T.MULTIPLICATIVE_PERCENT,
    value: RUN_BALANCE.player.fleetFeetPercent,
    max: RUN_BALANCE.player.moveSpeedHardCap
  })]),
  mechanicalEffect: null,
  artId: 'fleet-feet'
});

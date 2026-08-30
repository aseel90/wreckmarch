import { STAT_MODIFIER_TYPES as T } from '../../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../stats/run-stat-state.js';
import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';

export const LONG_BARREL_UPGRADE = Object.freeze({
  id: 'long-barrel',
  name: 'LONG BARREL',
  description: '+18% projectile speed and +10% range.',
  rarity: null,
  maxLevel: 4,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['PROJECTILE_SPEED', 'RANGE', 'RIVET'],
  requirements: [],
  weight: 1,
  offerRules: {},
  modifiers: Object.freeze([
    Object.freeze({
      domain: D.WEAPON,
      stat: 'projectileSpeed',
      type: T.MULTIPLICATIVE_PERCENT,
      value: 0.18
    }),
    Object.freeze({
      domain: D.WEAPON,
      stat: 'range',
      type: T.MULTIPLICATIVE_PERCENT,
      value: 0.10
    })
  ]),
  mechanicalEffect: null,
  artId: 'long-barrel'
});

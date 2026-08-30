import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import {
  UPGRADE_DEBUG_DUMP_VERSION,
  createUpgradeDebugDump,
  stringifyUpgradeDebugDump
} from '../../src/upgrades/upgrade-debug-dump.js';

function makeScene() {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255, armor: 0 },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720 }
  });
  runStatState.state.modifiers.character.maxHp = [{ id: 'armor-plate@1:0', type: 'FLAT', value: 15 }];
  runStatState.state.modifiers.weapon.damage = [{
    id: 'heavy-rivets@1:0',
    type: 'MULTIPLICATIVE_PERCENT',
    value: 0.12
  }];
  return {
    runStatState,
    upgradeLevels: { 'twin-riveter': 2, 'heavy-rivets': 1, unused: 0 },
    upgradeRarityHistory: {
      'heavy-rivets': ['RARE'],
      'twin-riveter': ['COMMON', 'COMMON']
    }
  } as any;
}

describe('Upgrade System compact debug dump', () => {
  it('returns deterministic acquired upgrades and resolved stats', () => {
    const dump = createUpgradeDebugDump(makeScene());

    expect(dump.version).toBe(UPGRADE_DEBUG_DUMP_VERSION);
    expect(dump.upgrades).toEqual([
      { id: 'heavy-rivets', level: 1, rarities: ['RARE'] },
      { id: 'twin-riveter', level: 2, rarities: ['COMMON', 'COMMON'] }
    ]);
    expect(dump.stats.character).toEqual({ armor: 0, maxHp: 115, moveSpeed: 255 });
    expect(dump.stats.weapon.fireDelay).toBe(390);
    expect(dump.stats.weapon.projectileSpeed).toBe(720);
    expect(dump.stats.weapon.damage).toBeCloseTo(26.88);
    expect(Object.isFrozen(dump)).toBe(true);
    expect(Object.isFrozen(dump.upgrades)).toBe(true);
    expect(Object.isFrozen(dump.stats.character)).toBe(true);
  });

  it('serializes as compact one-line JSON suitable for debug logs and clipboard', () => {
    const text = stringifyUpgradeDebugDump(makeScene());
    expect(text).not.toContain('\n');
    expect(JSON.parse(text)).toEqual(createUpgradeDebugDump(makeScene()));
  });

  it('preserves non-finite stat failures as readable JSON-safe diagnostic values', () => {
    const scene = makeScene();
    scene.runStatState.resolve = () => ({
      character: { maxHp: Number.NaN, moveSpeed: Infinity },
      weapon: { damage: -Infinity }
    });
    expect(createUpgradeDebugDump(scene).stats).toEqual({
      character: { maxHp: 'NaN', moveSpeed: 'Infinity' },
      weapon: { damage: '-Infinity' }
    });
  });

  it('fails clearly before canonical run stat state is initialized', () => {
    expect(() => createUpgradeDebugDump({} as any)).toThrow(/initialized scene\.runStatState/i);
  });
});

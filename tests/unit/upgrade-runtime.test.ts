import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import {
  applyRegisteredStatUpgrade,
  canApplyRegisteredStatUpgrade,
  createRegisteredStatUpgradeChoice
} from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  return {
    upgradeLevels: {} as Record<string, number>,
    damage: 24,
    fireDelay: 390,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 },
    runStatState: createRunStatState({
      characterBase: { maxHp: 100, moveSpeed: 255 },
      weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
    })
  };
}

describe('registered upgrade runtime', () => {
  it('adapts Heavy Rivets once for every presentation layer', () => {
    const scene = makeScene();
    const choice = createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' });

    expect(choice).toMatchObject({
      id: 'heavy-rivets',
      category: 'HERO',
      title: 'HEAVY RIVETS',
      desc: '+12% active weapon damage.',
      weight: 1.25
    });
    expect(choice.available()).toBe(true);

    choice.apply();
    expect(scene.upgradeLevels['heavy-rivets']).toBe(1);
    expect(scene.primaryWeapon.damage).toBeCloseTo(26.88);
    expect(scene.damage).toBeCloseTo(26.88);
    expect(scene.runStatState.state.base.weapon.damage).toBe(24);
  });

  it('preserves five-level Heavy Rivets parity without direct weapon mutation ownership', () => {
    const scene = makeScene();

    for (let i = 0; i < 5; i++) {
      expect(canApplyRegisteredStatUpgrade(scene, 'heavy-rivets')).toBe(true);
      applyRegisteredStatUpgrade(scene, 'heavy-rivets');
    }

    expect(scene.primaryWeapon.damage).toBeCloseTo(38.4);
    expect(scene.damage).toBeCloseTo(38.4);
    expect(canApplyRegisteredStatUpgrade(scene, 'heavy-rivets')).toBe(false);
    expect(() => applyRegisteredStatUpgrade(scene, 'heavy-rivets')).toThrow(/max level/);
    expect(scene.upgradeLevels['heavy-rivets']).toBe(5);
  });

  it('does not commit upgrade levels when stat application fails', () => {
    const scene = makeScene();
    delete (scene as any).runStatState;
    expect(() => applyRegisteredStatUpgrade(scene, 'heavy-rivets')).toThrow(/runStatState/);
    expect(scene.upgradeLevels['heavy-rivets']).toBeUndefined();
  });
});

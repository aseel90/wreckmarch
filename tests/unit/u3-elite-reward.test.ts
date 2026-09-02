import { describe, expect, it, vi } from 'vitest';
import { RunDirector } from '../../src/balance/run-director.js';
import { createEliteRewardOfferOptions } from '../../src/upgrades/elite-reward-system.js';

function fakeEnemies(activeThreat = 0) {
  const active = activeThreat > 0 ? [{ active: true, threatValue: activeThreat }] : [];
  return {
    countActive: () => active.length,
    children: { iterate: (callback: (enemy: any) => void) => active.forEach(callback) }
  };
}

describe('U3 elite reward guarantees', () => {
  it('keeps the reward contract at three Rare+ choices', () => {
    expect(createEliteRewardOfferOptions({ choices: 3, minimumRarity: 'RARE' })).toMatchObject({
      source: 'elite',
      count: 3,
      minimumRarity: 'RARE',
      eyebrow: 'WRECK CRATE',
      heading: 'ELITE REWARD'
    });
  });

  it('spawns guaranteed elites only after their configured times and advances only on success', () => {
    const spawned: any[] = [];
    const scene: any = {
      runTime: 0,
      gameOver: false,
      enemies: fakeEnemies(),
      spawnEnemy: vi.fn((elite: boolean) => {
        const enemy = { active: true, elite };
        spawned.push(enemy);
        return enemy;
      }),
      showBanner: vi.fn()
    };
    const director = new RunDirector(scene, { random: () => 0 });

    expect(director.getNextGuaranteedEliteSecond()).toBe(270);
    expect(director.trySpawnGuaranteedElite(269.99)).toBeNull();
    const first = director.trySpawnGuaranteedElite(270);
    expect(first?.elite).toBe(true);
    expect(first?.__u3GuaranteedEliteDueSecond).toBe(270);
    expect(director.getNextGuaranteedEliteSecond()).toBe(450);

    expect(director.trySpawnGuaranteedElite(449.99)).toBeNull();
    const second = director.trySpawnGuaranteedElite(450);
    expect(second?.__u3GuaranteedEliteDueSecond).toBe(450);
    expect(director.getNextGuaranteedEliteSecond()).toBeNull();
    expect(scene.spawnEnemy).toHaveBeenCalledTimes(2);
  });

  it('retries a due elite instead of bypassing the Threat Budget', () => {
    const scene: any = {
      runTime: 270,
      gameOver: false,
      enemies: fakeEnemies(999),
      spawnEnemy: vi.fn(() => ({ active: true, elite: true })),
      showBanner: vi.fn()
    };
    const director = new RunDirector(scene, { random: () => 0 });
    expect(director.trySpawnGuaranteedElite(270)).toBeNull();
    expect(director.getNextGuaranteedEliteSecond()).toBe(270);
    expect(scene.spawnEnemy).not.toHaveBeenCalled();
  });
});

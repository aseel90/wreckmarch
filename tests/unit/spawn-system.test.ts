import { describe, expect, it } from 'vitest';
import { SpawnSystem } from '../../src/enemies/spawn-system.js';

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++];
}

describe('SpawnSystem', () => {
  it('preserves the current four edge spawn bands', () => {
    const scene: any = { runTime: 0, gameOver: false };
    const factory: any = { create: () => null };
    expect(new SpawnSystem(scene, { factory, randomBetween: sequence([0, 123]) as any }).getEdgeSpawnPoint()).toEqual({ x: 123, y: 105 });
    expect(new SpawnSystem(scene, { factory, randomBetween: sequence([1, 456]) as any }).getEdgeSpawnPoint()).toEqual({ x: 520, y: 456 });
    expect(new SpawnSystem(scene, { factory, randomBetween: sequence([2, 321]) as any }).getEdgeSpawnPoint()).toEqual({ x: 321, y: 795 });
    expect(new SpawnSystem(scene, { factory, randomBetween: sequence([3, 654]) as any }).getEdgeSpawnPoint()).toEqual({ x: 20, y: 654 });
  });

  it('routes spawning through EnemyFactory with the live run time', () => {
    const calls: any[] = [];
    const scene: any = { runTime: 12.5, gameOver: false };
    const factory: any = { create: (...args: any[]) => { calls.push(args); return { ok: true }; } };
    const spawn = new SpawnSystem(scene, { factory, randomBetween: sequence([0, 100]) as any });
    expect(spawn.spawn('scrap-rat', { elite: true })).toEqual({ ok: true });
    expect(calls).toEqual([['scrap-rat', { elite: true, x: 100, y: 105, runTime: 12.5 }]]);
  });

  it('does not spawn after game over', () => {
    const scene: any = { runTime: 0, gameOver: true };
    const factory: any = { create: () => { throw new Error('should not spawn'); } };
    expect(new SpawnSystem(scene, { factory }).spawn()).toBeNull();
  });
});

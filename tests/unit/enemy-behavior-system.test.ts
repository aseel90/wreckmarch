import { describe, expect, it } from 'vitest';
import { getEnemyBehavior, listEnemyBehaviorKeys } from '../../src/enemies/enemy-behavior-registry.js';
import { EnemyBehaviorSystem } from '../../src/enemies/enemy-behavior-system.js';

function fakeEnemy(x: number, y: number, speed = 100) {
  return {
    active: true,
    x,
    y,
    speed,
    behaviorKey: 'chase',
    velocity: [0, 0] as [number, number],
    flipX: false,
    setVelocity(vx: number, vy: number) { this.velocity = [vx, vy]; return this; },
    setFlipX(value: boolean) { this.flipX = value; return this; }
  };
}

describe('EnemyBehaviorSystem', () => {
  it('registers chase as the first canonical behavior', () => {
    expect(listEnemyBehaviorKeys()).toEqual(['chase']);
    expect(typeof getEnemyBehavior('chase')).toBe('function');
    expect(() => getEnemyBehavior('missing')).toThrow('Unknown enemy behavior: missing');
  });

  it('preserves the current direct chase velocity and facing', () => {
    const dust: any[] = [];
    const scene: any = { hero: { x: 100, y: 20 }, spawnDust: (...args: any[]) => dust.push(args) };
    const enemy: any = fakeEnemy(0, 20, 100);
    new EnemyBehaviorSystem(scene, { random: () => 1 }).updateEnemy(enemy);
    expect(enemy.velocity[0]).toBeCloseTo(100, 6);
    expect(enemy.velocity[1]).toBeCloseTo(0, 6);
    expect(enemy.flipX).toBe(false);
    expect(dust).toHaveLength(0);

    scene.hero.x = -100;
    new EnemyBehaviorSystem(scene, { random: () => 1 }).updateEnemy(enemy);
    expect(enemy.velocity[0]).toBeCloseTo(-100, 6);
    expect(enemy.flipX).toBe(true);
  });

  it('preserves the legacy dust probability hook', () => {
    const dust: any[] = [];
    const scene: any = { hero: { x: 100, y: 0 }, spawnDust: (...args: any[]) => dust.push(args) };
    const enemy: any = fakeEnemy(0, 0, 88);
    new EnemyBehaviorSystem(scene, { random: () => .011 }).updateEnemy(enemy);
    expect(dust).toEqual([[0, 22, .38]]);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { CombatSystem } from '../../src/combat/combat-system.js';
import { ProjectileSystem } from '../../src/combat/projectile-system.js';

describe('Shrapnel Impact projectile ownership', () => {
  it('spawns bounded short-range secondary fragments through ProjectileSystem only', () => {
    const system = new ProjectileSystem({} as any);
    const spawned: any[] = [];
    system.spawn = vi.fn((options: any) => {
      const fragment: any = {
        ...options,
        hitEnemies: new Set(),
        setRotation(angle: number) { this.rotation = angle; return this; }
      };
      spawned.push(fragment);
      return fragment;
    }) as any;

    const first = { id: 'first' };
    const prior = { id: 'prior' };
    const fragments = system.spawnImpactShrapnel({
      x: 100,
      y: 50,
      angle: 0,
      speed: 780,
      damage: 24,
      count: 2,
      texture: 'hunter-rivet',
      excludedEnemies: new Set([first, prior]) as any
    });

    expect(fragments).toHaveLength(2);
    expect(spawned).toHaveLength(2);
    spawned.forEach(fragment => expect(fragment.damage).toBeCloseTo(8.4, 6));
    expect(spawned.every(fragment => fragment.lifeMs === 260)).toBe(true);
    expect(spawned.every(fragment => fragment.texture === 'hunter-rivet')).toBe(true);
    expect(fragments.every(fragment => fragment.isSecondaryProjectile === true)).toBe(true);
    expect(fragments.every(fragment => fragment.projectileKind === 'shrapnel')).toBe(true);
    expect(fragments.every(fragment => fragment.hitEnemies.has(first) && fragment.hitEnemies.has(prior))).toBe(true);
    expect(Math.abs(spawned[0].angle)).toBeCloseTo(.55, 6);
    expect(Math.abs(spawned[1].angle)).toBeCloseTo(.55, 6);
    expect(Math.sign(spawned[0].angle)).toBe(-Math.sign(spawned[1].angle));
  });

  it('hard-caps fragment creation at four even if malformed state exceeds the upgrade cap', () => {
    const system = new ProjectileSystem({} as any);
    system.spawn = vi.fn((options: any) => ({ ...options, hitEnemies: new Set(), setRotation() { return this; } })) as any;
    const fragments = system.spawnImpactShrapnel({ x: 0, y: 0, angle: 0, speed: 800, damage: 24, count: 99 });
    expect(fragments).toHaveLength(4);
    expect(system.spawn).toHaveBeenCalledTimes(4);
  });

  it('CombatSystem emits shrapnel after every primary impact without taking movement ownership', () => {
    const spawnImpactShrapnel = vi.fn();
    const scene: any = { damage: 24, projectileSystem: { spawnImpactShrapnel } };
    const combat = new CombatSystem(scene);
    combat.enemy.hitByProjectile = vi.fn((bullet: any, enemy: any) => {
      bullet.hitEnemies.add(enemy);
      if (bullet.pierceRemaining > 0) bullet.pierceRemaining -= 1;
      return { nextHp: 76, killed: false };
    });

    const enemy = { active: true, x: 80, y: 20 };
    const bullet: any = {
      active: true,
      damage: 24,
      shrapnelCount: 2,
      pierceRemaining: 1,
      ricochetRemaining: 0,
      hitEnemies: new Set(),
      texture: { key: 'hunter-rivet' },
      body: { velocity: { x: 800, y: 0 } }
    };

    combat.hitEnemyByProjectile(bullet, enemy);

    expect(spawnImpactShrapnel).toHaveBeenCalledTimes(1);
    expect(spawnImpactShrapnel).toHaveBeenCalledWith(expect.objectContaining({
      x: 80,
      y: 20,
      angle: 0,
      speed: 800,
      damage: 24,
      count: 2,
      texture: 'hunter-rivet'
    }));
    const excluded = spawnImpactShrapnel.mock.calls[0][0].excludedEnemies;
    expect(excluded.has(enemy)).toBe(true);
  });

  it('secondary shrapnel can never recursively create more shrapnel', () => {
    const spawnImpactShrapnel = vi.fn();
    const scene: any = { damage: 24, projectileSystem: { spawnImpactShrapnel } };
    const combat = new CombatSystem(scene);
    combat.enemy.hitByProjectile = vi.fn(() => ({ nextHp: 92, killed: false }));
    const bullet: any = {
      active: true,
      isSecondaryProjectile: true,
      shrapnelCount: 4,
      pierceRemaining: 0,
      ricochetRemaining: 0,
      hitEnemies: new Set(),
      body: { velocity: { x: 500, y: 0 } }
    };
    combat.hitEnemyByProjectile(bullet, { active: true, x: 50, y: 0 });
    expect(spawnImpactShrapnel).not.toHaveBeenCalled();
  });
});

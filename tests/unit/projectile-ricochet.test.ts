import { describe, expect, it, vi } from 'vitest';
import { ProjectileSystem } from '../../src/combat/projectile-system.js';

function iterableGroup(items: any[]) {
  return { children: { iterate: (fn: (item: any) => void) => items.forEach(fn) } };
}

function makeBullet(overrides: Record<string, any> = {}) {
  return {
    active: true, x: 100, y: 0, prevX: 0, prevY: 0, life: 1000,
    damage: 24, primaryDamage: 24, pierceRemaining: 0, ricochetRemaining: 1, ricochetRange: 360,
    ricochetDamageScale: .5, ricochetTargetMode: 'random',
    hitEnemies: new Set(),
    body: { velocity: { x: 100, y: 0, setToPolar(angle: number, speed: number) { this.x = Math.cos(angle) * speed; this.y = Math.sin(angle) * speed; } } },
    destroy() { this.active = false; },
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; },
    ...overrides
  } as any;
}

describe('ProjectileSystem ricochet', () => {
  it('redirects after the final non-piercing impact and never reuses an already-hit enemy', () => {
    const first = { id: 'first', active: true, hp: 100, x: 45, y: -1, hitRadius: 7 };
    const target = { id: 'target', active: true, hp: 100, x: 80, y: 80, hitRadius: 7 };
    const bullet = makeBullet();
    const hitEnemyByProjectile = vi.fn((shot: any, enemy: any) => { shot.hitEnemies.add(enemy); });
    const scene: any = { bullets: iterableGroup([bullet]), enemies: iterableGroup([first, target]), combatSystem: { hitEnemyByProjectile } };
    new ProjectileSystem(scene).update(16);
    expect(hitEnemyByProjectile).toHaveBeenCalledWith(bullet, first);
    expect(bullet.hitEnemies.has(first)).toBe(true);
    expect(bullet.ricochetRemaining).toBe(0);
    expect(bullet.active).toBe(true);
    expect(bullet.prevX).toBe(first.x);
    expect(bullet.prevY).toBe(first.y);
    expect(bullet.body.velocity.y).toBeGreaterThan(0);
    expect(bullet.damage).toBeCloseTo(12, 6);
  });

  it('lets pierce continue straight before ricochet becomes eligible', () => {
    const first = { id: 'first', active: true, hp: 100, x: 30, y: -1, hitRadius: 7 };
    const second = { id: 'second', active: true, hp: 100, x: 70, y: -1, hitRadius: 7 };
    const side = { id: 'side', active: true, hp: 100, x: 70, y: 80, hitRadius: 7 };
    const bullet = makeBullet({ pierceRemaining: 1 });
    const hitEnemyByProjectile = vi.fn((shot: any, enemy: any) => {
      shot.hitEnemies.add(enemy);
      if (shot.pierceRemaining > 0) shot.pierceRemaining -= 1;
    });
    const scene: any = { bullets: iterableGroup([bullet]), enemies: iterableGroup([first, second, side]), combatSystem: { hitEnemyByProjectile } };
    new ProjectileSystem(scene).update(16);
    expect(hitEnemyByProjectile.mock.calls.map((call: any[]) => call[1].id)).toEqual(['first', 'second']);
    expect(bullet.hitEnemies.size).toBe(2);
    expect(bullet.ricochetRemaining).toBe(0);
    expect(bullet.prevX).toBe(second.x);
    expect(bullet.prevY).toBe(second.y);
  });

  it('consumes a ricochet queued by the physics overlap path', () => {
    const alreadyHit = { id: 'first', active: true, hp: 100, x: 45, y: 0, hitRadius: 7 };
    const target = { id: 'target', active: true, hp: 100, x: 45, y: 90, hitRadius: 7 };
    const bullet = makeBullet({
      x: 45,
      y: 0,
      prevX: 45,
      prevY: 0,
      hitEnemies: new Set([alreadyHit]),
      ricochetPending: { x: 45, y: 0 }
    });
    const hitEnemyByProjectile = vi.fn();
    const scene: any = { bullets: iterableGroup([bullet]), enemies: iterableGroup([alreadyHit, target]), combatSystem: { hitEnemyByProjectile } };
    new ProjectileSystem(scene).update(16);
    expect(bullet.ricochetPending).toBeNull();
    expect(bullet.ricochetRemaining).toBe(0);
    expect(bullet.active).toBe(true);
    expect(bullet.body.velocity.y).toBeGreaterThan(0);
    expect(hitEnemyByProjectile).not.toHaveBeenCalled();
  });

  it('uses deterministic RNG to choose among valid random ricochet targets', () => {
    const first = { id: 'first', active: true, hp: 100, x: 40, y: 0, hitRadius: 7 };
    const near = { id: 'near', active: true, hp: 100, x: 60, y: 30, hitRadius: 7 };
    const far = { id: 'far', active: true, hp: 100, x: 120, y: 70, hitRadius: 7 };
    const bullet = makeBullet({ hitEnemies: new Set([first]) });
    const scene: any = { enemies: iterableGroup([near, far]) };
    const system = new ProjectileSystem(scene).setRandomSource(() => .99);
    expect(system.findRicochetTarget(bullet, first.x, first.y)).toBe(far);
  });

  it('destroys the projectile if no valid ricochet target exists', () => {
    const first = { active: true, hp: 100, x: 45, y: -1, hitRadius: 7 };
    const bullet = makeBullet();
    const hitEnemyByProjectile = vi.fn((shot: any, enemy: any) => { shot.hitEnemies.add(enemy); });
    const scene: any = { bullets: iterableGroup([bullet]), enemies: iterableGroup([first]), combatSystem: { hitEnemyByProjectile } };
    new ProjectileSystem(scene).update(16);
    expect(bullet.active).toBe(false);
  });
});

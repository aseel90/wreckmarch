import { describe, expect, it, vi } from 'vitest';
import { ProjectileSystem } from '../../src/combat/projectile-system.js';

function iterableGroup(items: any[]) { return { children: { iterate: (fn: (item: any) => void) => items.forEach(fn) } }; }

describe('ProjectileSystem ricochet', () => {
  it('redirects to the nearest valid unhit enemy and consumes one bounce', () => {
    const first = { id: 'first', active: true, hp: 100, x: 50, y: 0, hitRadius: 8 };
    const near = { id: 'near', active: true, hp: 100, x: 90, y: 40, hitRadius: 8 };
    const far = { id: 'far', active: true, hp: 100, x: 240, y: 0, hitRadius: 8 };
    const velocity = { x: 100, y: 0, setToPolar: vi.fn(function(angle: number, speed: number) { this.x = Math.cos(angle) * speed; this.y = Math.sin(angle) * speed; }) };
    const bullet: any = { active: true, x: 100, y: 0, prevX: 0, prevY: 0, life: 1000, pierceRemaining: 0, ricochetRemaining: 1, ricochetRange: 200, ricochetPending: false, hitEnemies: new Set(), body: { velocity }, setPosition(x: number, y: number) { this.x = x; this.y = y; }, destroy() { this.active = false; } };
    const hitEnemyByProjectile = vi.fn((shot: any, enemy: any) => { shot.hitEnemies.add(enemy); shot.ricochetPending = true; });
    const scene: any = { bullets: iterableGroup([bullet]), enemies: iterableGroup([far, near, first]), combatSystem: { hitEnemyByProjectile } };
    new ProjectileSystem(scene).update(16);
    expect(hitEnemyByProjectile).toHaveBeenCalledTimes(1);
    expect(hitEnemyByProjectile).toHaveBeenCalledWith(bullet, first);
    expect(bullet.ricochetRemaining).toBe(0);
    expect(bullet.ricochetPending).toBe(false);
    expect(bullet.x).toBe(first.x);
    expect(bullet.y).toBe(first.y);
    expect(velocity.setToPolar).toHaveBeenCalledTimes(1);
    const [angle] = velocity.setToPolar.mock.calls[0];
    expect(angle).toBeCloseTo(Math.atan2(near.y - first.y, near.x - first.x));
  });
  it('destroys the projectile when no valid ricochet target exists', () => {
    const first = { active: true, hp: 100, x: 50, y: 0, hitRadius: 8 };
    const bullet: any = { active: true, x: 100, y: 0, prevX: 0, prevY: 0, life: 1000, pierceRemaining: 0, ricochetRemaining: 1, ricochetRange: 100, ricochetPending: false, hitEnemies: new Set(), body: { velocity: { x: 100, y: 0 } }, destroy() { this.active = false; } };
    const scene: any = { bullets: iterableGroup([bullet]), enemies: iterableGroup([first]), combatSystem: { hitEnemyByProjectile: (shot: any, enemy: any) => { shot.hitEnemies.add(enemy); shot.ricochetPending = true; } } };
    new ProjectileSystem(scene).update(16);
    expect(bullet.active).toBe(false);
  });
});

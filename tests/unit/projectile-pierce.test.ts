import { describe, expect, it, vi } from 'vitest';
import { ProjectileSystem } from '../../src/combat/projectile-system.js';

function iterableGroup(items: any[]) {
  return { children: { iterate: (fn: (item: any) => void) => items.forEach(fn) } };
}

describe('ProjectileSystem pierce chains', () => {
  it('processes multiple enemies in segment order until pierce is exhausted', () => {
    const first = { id: 'first', active: true, hp: 100, x: 30, y: -1, hitRadius: 5 };
    const second = { id: 'second', active: true, hp: 100, x: 70, y: -1, hitRadius: 5 };
    const bullet: any = {
      active: true,
      x: 100,
      y: 0,
      prevX: 0,
      prevY: 0,
      life: 1000,
      pierceRemaining: 1,
      hitEnemies: new Set(),
      destroy() { this.active = false; }
    };
    const hits: string[] = [];
    const hitEnemyByProjectile = vi.fn((shot: any, enemy: any) => {
      shot.hitEnemies.add(enemy);
      hits.push(enemy.id);
      if (shot.pierceRemaining > 0) shot.pierceRemaining -= 1;
      else shot.destroy();
    });
    const scene: any = {
      bullets: iterableGroup([bullet]),
      enemies: iterableGroup([second, first]),
      combatSystem: { hitEnemyByProjectile }
    };

    new ProjectileSystem(scene).update(16);

    expect(hits).toEqual(['first', 'second']);
    expect(hitEnemyByProjectile).toHaveBeenCalledTimes(2);
    expect(bullet.hitEnemies.size).toBe(2);
    expect(bullet.pierceRemaining).toBe(0);
    expect(bullet.active).toBe(false);
  });

  it('never re-hits an enemy already recorded on the projectile', () => {
    const enemy = { active: true, hp: 100, x: 50, y: -1, hitRadius: 8 };
    const bullet: any = {
      active: true,
      x: 100,
      y: 0,
      prevX: 0,
      prevY: 0,
      life: 1000,
      pierceRemaining: 2,
      hitEnemies: new Set([enemy]),
      destroy() { this.active = false; }
    };
    const hitEnemyByProjectile = vi.fn();
    const scene: any = {
      bullets: iterableGroup([bullet]),
      enemies: iterableGroup([enemy]),
      combatSystem: { hitEnemyByProjectile }
    };

    new ProjectileSystem(scene).update(16);

    expect(hitEnemyByProjectile).not.toHaveBeenCalled();
    expect(bullet.active).toBe(true);
    expect(bullet.prevX).toBe(100);
  });

  it('WeaponSystem consumes canonical resolved pierce instead of relying on a mirrored field', async () => {
    const { WeaponSystem } = await import('../../src/combat/weapon-system.js');
    const spawn = vi.fn((options: any) => ({ active: true, ...options }));
    const scene: any = {
      enemies: iterableGroup([]),
      primaryWeapon: { damage: 24, projectileSpeed: 760, range: 570, fireDelay: 390, pierceCount: 0 },
      runStatState: { resolve: () => ({ weapon: { pierceCount: 2 } }) },
      weaponAim: 0,
      hero: { x: 0, y: 0 }
    };
    const system = new WeaponSystem(scene, { projectileSystem: { spawn } as any });
    system.setMuzzleResolver(() => ({ x: 10, y: 20 }));
    system.fireHeroProjectile(0, 1);

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn.mock.calls[0][0].pierceCount).toBe(2);
  });
});

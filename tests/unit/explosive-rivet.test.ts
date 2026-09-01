import { afterEach, describe, expect, it, vi } from 'vitest';
import { POWER_BUDGET } from '../../src/balance/power-budget.js';
import { CombatSystem } from '../../src/combat/combat-system.js';
import { resolveProjectileSecondaryDamageBudget } from '../../src/combat/projectile-system.js';
import { WeaponSystem } from '../../src/combat/weapon-system.js';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade } from '../../src/upgrades/upgrade-runtime.js';

function group(children: any[]) {
  return { children: { iterate: (fn: (item: any) => void) => children.forEach(fn) } };
}

function upgradeScene() {
  return { upgradeLevels: {}, upgradeMechanicalState: {} } as any;
}

afterEach(() => {
  delete (globalThis as any).Phaser;
});

describe('Explosive Rivet Workstream 9', () => {
  it('registers the approved 5s / 4.5s / 4s cadence and bounded crowd profile', () => {
    const definition = getUpgradeDefinition('explosive-rivet');
    expect(definition).toMatchObject({
      name: 'EXPLOSIVE RIVET',
      maxLevel: 3,
      mechanicalEffect: {
        id: 'EXPLOSIVE_RIVET',
        config: {
          cadenceMsByLevel: [5000, 4500, 4000],
          damageCoefficient: 0.33,
          radiusByLevel: [90, 105, 120],
          targetCapByLevel: [3, 3, 4]
        }
      }
    });

    const scene = upgradeScene();
    expect((applyRegisteredUpgrade(scene, 'explosive-rivet') as any).cadenceMs).toBe(5000);
    expect((applyRegisteredUpgrade(scene, 'explosive-rivet') as any).cadenceMs).toBe(4500);
    expect((applyRegisteredUpgrade(scene, 'explosive-rivet') as any).cadenceMs).toBe(4000);
  });

  it('arms one charge only and restarts cadence only after that charge is fired', () => {
    const scene = upgradeScene();
    const state = applyRegisteredUpgrade(scene, 'explosive-rivet') as any;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });

    expect(state.cadenceMs).toBe(5000);
    system.syncExplosiveRivet(0);
    expect(system.explosiveRivetRuntime).toMatchObject({ armed: false, nextArmAt: 5000 });
    system.syncExplosiveRivet(5000);
    expect(system.explosiveRivetRuntime.armed).toBe(true);
    system.syncExplosiveRivet(15000);
    expect(system.explosiveRivetRuntime).toMatchObject({ armed: true, nextArmAt: 5000 });

    expect(system.consumeExplosiveRivet(15000)).toBe(true);
    expect(system.explosiveRivetRuntime).toMatchObject({ armed: false, nextArmAt: 20000 });
  });

  it('does not let Overclock/fireDelay changes alter the Explosive Rivet cadence', () => {
    const scene = upgradeScene();
    applyRegisteredUpgrade(scene, 'explosive-rivet');
    scene.fireDelay = 120;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });
    system.syncExplosiveRivet(1000);
    expect(system.explosiveRivetRuntime.nextArmAt).toBe(6000);
    scene.fireDelay = 40;
    system.syncExplosiveRivet(5999);
    expect(system.explosiveRivetRuntime.armed).toBe(false);
    system.syncExplosiveRivet(6000);
    expect(system.explosiveRivetRuntime.armed).toBe(true);
  });

  it('arms exactly one projectile in a Twin volley and keeps Twin projectile damage redistribution', () => {
    (globalThis as any).Phaser = {
      Math: {
        Angle: { Between: () => 0, RotateTo: (_from: number, to: number) => to }
      }
    };
    const spawn = vi.fn((options: any) => ({
      ...options,
      active: true,
      setTint: vi.fn()
    }));
    const enemy = { active: true, hp: 100, x: 100, y: 0 };
    const scene: any = {
      enemies: group([enemy]),
      hero: { active: true, x: 0, y: 0 },
      primaryWeapon: { damage: 24, projectileSpeed: 780, range: 570, fireDelay: 390 },
      runCombatStats: { critChance: 0, critDamageMultiplier: 1.5 },
      upgradeMechanicalState: {
        'twin-riveter': { projectileCount: 2, projectileDamageScale: 0.7 },
        'explosive-rivet': { level: 1, cadenceMs: 5000, damageCoefficient: 0.33, radius: 90, targetCap: 3 }
      },
      twinShots: 2,
      weaponAim: 0,
      lastShot: -1000,
      fireDelay: 390,
      gameOver: false,
      updateWeaponPose: vi.fn()
    };
    const system = new WeaponSystem(scene, { projectileSystem: { spawn } as any });
    system.setMuzzleResolver(() => ({ x: 0, y: 0 }));

    system.update(0);
    spawn.mockClear();
    system.update(5000);

    expect(spawn).toHaveBeenCalledTimes(2);
    const shots = spawn.mock.calls.map(call => call[0]);
    expect(shots.filter(shot => shot.explosiveRivetArmed)).toHaveLength(1);
    expect(shots.every(shot => shot.damage === 24 * 0.7)).toBe(true);
    expect(system.explosiveRivetRuntime.nextArmAt).toBe(10000);
  });

  it('uses resolved Heavy damage as the pre-Crit explosion reference', () => {
    const spawn = vi.fn((options: any) => ({ ...options, setTint: vi.fn() }));
    const scene: any = {
      enemies: group([]),
      hero: { x: 0, y: 0 },
      weaponAim: 0,
      primaryWeapon: { damage: 38.4, projectileSpeed: 780 },
      runCombatStats: { critChance: 1, critDamageMultiplier: 2 },
      runStatState: { resolve: () => ({ weapon: {} }) }
    };
    const system = new WeaponSystem(scene, { projectileSystem: { spawn } as any });
    system.setMuzzleResolver(() => ({ x: 0, y: 0 }));
    system.setRandomSource(() => 0);
    const shot = system.fireHeroProjectile(0, 1, {
      explosiveRivet: { level: 1, radius: 90, damageCoefficient: 0.33 }
    }) as any;

    expect(shot.bullet.baseDamage).toBeCloseTo(38.4);
    expect(spawn.mock.calls[0][0].damage).toBeCloseTo(76.8);
    const budget = resolveProjectileSecondaryDamageBudget({ explosionLevel: 1 });
    expect(38.4 * budget.explosionDamageScale).toBeCloseTo(12.672);
  });

  it('triggers exactly one explosion for the projectile lifetime even across Pierce/Ricochet follow-up impacts', () => {
    const recordExplosion = vi.fn();
    const scene: any = {
      damage: 24,
      projectileSystem: {
        findExplosionTargets: vi.fn(() => []),
        spawnImpactExplosionFx: vi.fn(),
        spawnImpactShrapnel: vi.fn()
      },
      runTelemetry: { recordExplosion }
    };
    const combat = new CombatSystem(scene);
    combat.enemy.hitByProjectile = vi.fn((bullet: any, enemy: any) => {
      bullet.hitEnemies.add(enemy);
      if (bullet.pierceRemaining > 0) bullet.pierceRemaining -= 1;
      return { nextHp: 80, killed: false };
    });
    const bullet: any = {
      active: true,
      damage: 24,
      primaryDamage: 24,
      explosiveRivetArmed: true,
      explosionTriggered: false,
      explosionDamageScale: 0.2,
      explosionTargetCap: 3,
      explosionRadius: 90,
      pierceRemaining: 1,
      pierceDamageScale: 0.2,
      ricochetRemaining: 1,
      shrapnelCount: 0,
      hitEnemies: new Set(),
      body: { velocity: { x: 760, y: 0 } }
    };

    combat.hitEnemyByProjectile(bullet, { active: true, x: 10, y: 0 });
    combat.hitEnemyByProjectile(bullet, { active: true, x: 20, y: 0 });
    combat.hitEnemyByProjectile(bullet, { active: true, x: 30, y: 0 });

    expect(bullet.explosionTriggered).toBe(true);
    expect(recordExplosion).toHaveBeenCalledTimes(1);
  });

  it('creates proc-isolated explosion damage: no Crit, Pierce, Ricochet, Shrapnel, or recursive Explosion', () => {
    const targets = [{ active: true, hp: 100, x: 0, y: 0 }, { active: true, hp: 100, x: 10, y: 0 }];
    const scene: any = {
      projectileSystem: {
        findExplosionTargets: vi.fn(() => targets),
        spawnImpactExplosionFx: vi.fn()
      },
      runTelemetry: { recordExplosion: vi.fn() }
    };
    const combat = new CombatSystem(scene);
    const synthetic: any[] = [];
    combat.enemy.hitByProjectile = vi.fn((bullet: any) => {
      synthetic.push(bullet);
      return { nextHp: 90, killed: false };
    });
    const source: any = {
      explosiveRivetArmed: true,
      explosionTriggered: false,
      primaryDamage: 30,
      explosionDamageScale: 0.33,
      explosionTargetCap: 3,
      explosionRadius: 90
    };

    combat.applyExplosiveRivetImpact(source, targets[0]);
    expect(synthetic).toHaveLength(2);
    for (const hit of synthetic) {
      expect(hit).toMatchObject({
        projectileKind: 'explosion',
        isSecondaryProjectile: true,
        isCritical: false,
        pierceRemaining: 0,
        ricochetRemaining: 0,
        shrapnelCount: 0,
        explosiveRivetArmed: false,
        explosionTriggered: true
      });
    }
  });

  it('keeps Explosion inside the shared PB1 secondary/chained damage budget', () => {
    const standalone = resolveProjectileSecondaryDamageBudget({ explosionLevel: 3 });
    expect(standalone.explosionAddedDamage).toBeCloseTo(1.32, 8);
    expect(standalone.explosionDamageScale).toBeCloseTo(0.33, 8);

    const combined = resolveProjectileSecondaryDamageBudget({
      pierceCount: 3,
      ricochetCount: 2,
      shrapnelCount: 4,
      explosionLevel: 3
    });
    expect(combined.requestedCombinedAddedDamage).toBeCloseTo(3.67, 8);
    expect(combined.combinedAddedDamage).toBeCloseTo(POWER_BUDGET.chainedMechanics.combinedAddedDamageSoftCap, 8);
    expect(combined.explosionDamageScale).toBeLessThan(0.33);
  });

  it('telemetry reports explosion count, hits, and effective explosion damage separately', () => {
    const scene: any = { heroHp: 100, upgradeLevels: {}, runTime: 0 };
    const telemetry = new RunTelemetry(scene, { reportIdFactory: () => 'wm-explosion-test', now: () => 0 });
    telemetry.recordExplosion({ hits: 2 });
    const projectile = { projectileKind: 'explosion', isSecondaryProjectile: true, isCritical: false };
    telemetry.recordProjectileDamage(projectile, { appliedDamage: 12, currentHp: 100 });
    telemetry.recordProjectileDamage(projectile, { appliedDamage: 12, currentHp: 5 });
    const report = telemetry.getReport();

    expect(report.projectiles.explosions).toBe(1);
    expect(report.projectiles.explosionHits).toBe(2);
    expect(report.combat.explosionDamageDealt).toBe(17);
    expect(report.combat.damageByProjectilePath.explosion).toBe(17);
    expect(report.combat.criticalDamageDealt).toBe(0);
  });
});

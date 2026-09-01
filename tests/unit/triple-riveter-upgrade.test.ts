import { afterEach, describe, expect, it, vi } from 'vitest';
import { POWER_BUDGET } from '../../src/balance/power-budget.js';
import { WeaponSystem } from '../../src/combat/weapon-system.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade, createRegisteredUpgradeChoice } from '../../src/upgrades/upgrade-runtime.js';

function group(children: any[]) {
  return { children: { iterate: (fn: (item: any) => void) => children.forEach(fn) } };
}

afterEach(() => {
  delete (globalThis as any).Phaser;
});

function makeScene() {
  return {
    upgradeLevels: {} as Record<string, number>,
    twinShots: 1,
    upgradeMechanicalState: {} as Record<string, any>
  } as any;
}

describe('Triple Riveter advanced multishot', () => {
  it('publishes a one-level Twin L2 evolution with a bounded 1.60x volley budget', () => {
    const definition = getUpgradeDefinition('triple-riveter');
    if (!definition) throw new Error('Triple Riveter definition missing');
    expect(definition).toMatchObject({
      id: 'triple-riveter',
      name: 'TRIPLE RIVETER',
      rarity: 'RARE',
      maxLevel: 1,
      weight: 0.38,
      requirements: [{ type: 'upgrade-level', id: 'twin-riveter', level: 2 }]
    });
    expect(definition.mechanicalEffect).toMatchObject({
      id: 'TRIPLE_RIVETER',
      config: { projectileCount: 3, volleyDamageMultiplier: 1.6 }
    });
    expect(POWER_BUDGET.volley.tripleSingleTargetMultiplier).toBe(1.6);
    expect(POWER_BUDGET.volley.triplePerProjectileDamageScale).toBeCloseTo(1.6 / 3);
  });

  it('cannot be applied before Twin L2 and then installs exactly three budgeted projectiles', () => {
    const scene = makeScene();
    const choice = createRegisteredUpgradeChoice(scene, 'triple-riveter', { category: 'EVOLUTION' });
    expect(choice.available()).toBe(false);

    applyRegisteredUpgrade(scene, 'twin-riveter');
    expect(choice.available()).toBe(false);
    applyRegisteredUpgrade(scene, 'twin-riveter');
    expect(choice.available()).toBe(true);

    const triple = applyRegisteredUpgrade(scene, 'triple-riveter', { rarity: 'RARE' }) as any;
    expect(triple).toMatchObject({ projectileCount: 3, volleyDamageMultiplier: 1.6, rarity: 'RARE' });
    expect(triple.projectileDamageScale).toBeCloseTo(1.6 / 3);
    expect(scene.upgradeLevels['triple-riveter']).toBe(1);
    expect(canApplyRegisteredUpgrade(scene, 'triple-riveter')).toBe(false);
  });

  it('arms only the center projectile when Triple and Explosive Rivet share a volley', () => {
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
        'triple-riveter': { projectileCount: 3, projectileDamageScale: 1.6 / 3 },
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

    expect(spawn).toHaveBeenCalledTimes(3);
    const shots = spawn.mock.calls.map(call => call[0]);
    expect(shots.map(shot => Boolean(shot.explosiveRivetArmed))).toEqual([false, true, false]);
    expect(shots.every(shot => Math.abs(shot.damage - 24 * (1.6 / 3)) < 1e-9)).toBe(true);
    expect(system.explosiveRivetRuntime.nextArmAt).toBe(10000);
  });

  it('lets WeaponSystem prefer Triple over the retained Twin state', () => {
    const scene = makeScene();
    scene.twinShots = 2;
    scene.upgradeMechanicalState['twin-riveter'] = { projectileCount: 2, projectileDamageScale: .7 };
    scene.upgradeMechanicalState['triple-riveter'] = { projectileCount: 3, projectileDamageScale: 1.6 / 3 };
    const weapon = new WeaponSystem(scene, { projectileSystem: {} as any });
    expect(weapon.heroSpreads()).toEqual([-0.085, 0, 0.085]);
    expect((weapon.heroProjectileDamageScale as any)(3)).toBeCloseTo(1.6 / 3);
  });
});

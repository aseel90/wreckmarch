import { describe, expect, it, vi } from 'vitest';
import { FORTRESS_RIG_COMBAT_PROFILE, fortressRigNominalDps } from '../../src/rig/fortress-rig-profile.js';
import { RigSystem } from '../../src/rig/rig-system.js';

function wheel() {
  return {
    rotation: 0,
    setRotation(value: number) {
      this.rotation = value;
      return this;
    }
  };
}

function createScene() {
  const cart = {
    x: 640,
    y: 640,
    rotation: 0,
    visible: true,
    active: true,
    alpha: 1,
    scale: 1,
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; },
    setVisible(value: boolean) { this.visible = value; return this; },
    setActive(value: boolean) { this.active = value; return this; },
    setAlpha(value: number) { this.alpha = value; return this; },
    setScale(value: number) { this.scale = value; return this; }
  };
  return {
    hero: { x: 1000, y: 1000 },
    move: { x: 1, y: 0 },
    cart,
    cartWheels: [wheel(), wheel(), wheel(), wheel()],
    cartBody: { y: -5 },
    __c3Turret: { y: -31, rotation: 0 },
    __c3RigBaseBodyY: -5,
    __c3RigBaseTurretY: -31,
    __c4RigState: null as any,
    rigSummoned: true,
    rigFireDelay: 920,
    rigDamage: 13.92,
    rigShots: 1,
    lastRigShot: 0,
    primaryWeapon: { damage: 20 },
    weaponSystem: {
      acquireTarget: vi.fn(() => null as null | { x: number, y: number }),
      fireSupportVolley: vi.fn()
    },
    tweens: { add: vi.fn() },
    cameras: { main: { flash: vi.fn() } },
    playTone: vi.fn()
  };
}

describe('RigSystem', () => {
  it('publishes one canonical support-combat budget independent of hero weapon semantics', () => {
    expect(FORTRESS_RIG_COMBAT_PROFILE).toEqual({
      fireDelayMs: 920,
      projectileCount: 1,
      projectileDamage: 13.92,
      projectileSpeed: 680,
      targetRange: 560,
      muzzleDistance: 61,
      projectileLifeMs: 1100,
      projectileScale: .66
    });
    expect(Object.isFrozen(FORTRESS_RIG_COMBAT_PROFILE)).toBe(true);
    expect(fortressRigNominalDps()).toBeCloseTo(15.1304347826, 8);
  });

  it('does not inherit Heavy/Shotgun/Twin damage semantics from primaryWeapon', () => {
    const scene = createScene();
    scene.move.x = 0;
    scene.cart.setPosition(scene.hero.x - 176, scene.hero.y + 64);
    scene.__c3Turret.rotation = .79;
    scene.primaryWeapon = { damage: 999, fireProfile: { projectileCount: 5, volleyDamageMultiplier: 1.75 } };
    scene.upgradeMechanicalState = { 'twin-riveter': { projectileCount: 2, projectileDamageScale: .75 } };
    scene.weaponSystem.acquireTarget.mockImplementation(() => ({ x: scene.cart.x + 120, y: scene.cart.y - 25 }));
    const system = new RigSystem(scene);
    system.setState(system.createState(scene.cart.x, scene.cart.y, 1, 0, 1));

    system.update(1000, 16);

    expect(scene.weaponSystem.fireSupportVolley).toHaveBeenCalledTimes(1);
    expect(scene.weaponSystem.fireSupportVolley).toHaveBeenCalledWith(expect.objectContaining({
      damage: 13.92,
      spreads: [0]
    }));
  });

  it('owns the spring follow state and wheel travel without phase-local vectors', () => {
    const scene = createScene();
    const system = new RigSystem(scene);
    const startDistance = Math.hypot(scene.cart.x - scene.hero.x, scene.cart.y - scene.hero.y);
    let lastX = scene.cart.x;
    let lastY = scene.cart.y;
    const steps: number[] = [];

    for (let i = 0; i < 45; i++) {
      system.update(1000 + i * 16, 16);
      steps.push(Math.hypot(scene.cart.x - lastX, scene.cart.y - lastY));
      lastX = scene.cart.x;
      lastY = scene.cart.y;
    }

    const endDistance = Math.hypot(scene.cart.x - scene.hero.x, scene.cart.y - scene.hero.y);
    expect(endDistance).toBeLessThan(startDistance);
    expect(Math.max(...steps)).toBeLessThan(8);
    expect(scene.cartWheels.some(item => Math.abs(item.rotation) > .05)).toBe(true);
    expect(scene.__c4RigState).toBe(system.state);
  });

  it('owns the production summon defaults and spawn placement', () => {
    const scene = createScene();
    scene.rigSummoned = false;
    const system = new RigSystem(scene);

    expect(system.summon()).toBe(true);

    expect(scene.rigSummoned).toBe(true);
    expect(scene.rigFireDelay).toBe(920);
    expect(scene.rigDamage).toBe(13.92);
    expect(scene.rigShots).toBe(1);
    expect(scene.cart.x).toBe(scene.hero.x - 145);
    expect(scene.cart.y).toBe(scene.hero.y + 105);
    expect(scene.tweens.add).toHaveBeenCalledTimes(1);
    expect(scene.cameras.main.flash).toHaveBeenCalledTimes(1);
  });

  it('routes an aligned Fortress shot through WeaponSystem with current balance values', () => {
    const scene = createScene();
    scene.move.x = 0;
    scene.cart.setPosition(scene.hero.x - 176, scene.hero.y + 64);
    scene.__c3Turret.rotation = .79;
    scene.weaponSystem.acquireTarget.mockImplementation(() => ({ x: scene.cart.x + 120, y: scene.cart.y - 25 }));
    const system = new RigSystem(scene);
    system.setState(system.createState(scene.cart.x, scene.cart.y, 1, 0, 1));

    system.update(1000, 16);

    expect(scene.weaponSystem.fireSupportVolley).toHaveBeenCalledTimes(1);
    expect(scene.weaponSystem.fireSupportVolley).toHaveBeenCalledWith(expect.objectContaining({
      speed: 680,
      damage: 13.92,
      lifeMs: 1100,
      scale: .66,
      spreads: [0]
    }));
    expect(scene.lastRigShot).toBe(1000);
    expect(scene.playTone).toHaveBeenCalledTimes(1);
  });
});

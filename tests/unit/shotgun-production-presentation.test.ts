import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWeaponRuntimeState, getWeaponDefinition } from '../../src/combat/weapon-registry.js';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';
import { resolveShotgunLayeredMotion } from '../../src/characters/shotgun-layered-locomotion.js';
import {
  installShotgunC5Presentation,
  installShotgunD1Presentation,
  resolveShotgunPresentationPose
} from '../../src/characters/shotgun-production-presentation.js';

class Vector2 {
  x: number;
  y: number;
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x: number, y: number) { this.x = x; this.y = y; return this; }
  copy(value: { x: number; y: number }) { this.x = value.x; this.y = value.y; return this; }
}

class DisplayObject {
  texture = { key: 'legacy' };
  visible = true;
  depth = 30;
  x = 100;
  y = 80;
  flipX = false;
  flipY = true;
  cropped = true;
  rotation = 0;
  scaleX = 1;
  scaleY = 1;
  alpha = 1;
  setVisible(value: boolean) { this.visible = value; return this; }
  setTexture(key: string) { this.texture = { key }; return this; }
  setCrop() { this.cropped = false; return this; }
  setOrigin() { return this; }
  setScale(x = 1, y = x) { this.scaleX = x; this.scaleY = y; return this; }
  setFlipX(value: boolean) { this.flipX = value; return this; }
  setFlipY(value: boolean) { this.flipY = value; return this; }
  clearTint() { return this; }
  stop() { return this; }
  setRotation(value = 0) { this.rotation = value; return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  setDepth(value: number) { this.depth = value; return this; }
  setAlpha(value = 1) { this.alpha = value; return this; }
  setTint() { return this; }
  destroy() {}
}

const LEGACY_PARTS = [
  'weaponV3ArmA',
  'weaponV3ArmB',
  'weaponV3HandA',
  'weaponV3HandB',
  'weaponArm',
  'weaponRig',
  'aimPose'
] as const;

function createScene() {
  const hero = new DisplayObject();
  const weaponV3Gun = new DisplayObject();
  let muzzleResolver: ((spread: number) => Vector2) | null = null;
  let fireFeedback: ((payload: any) => void) | null = null;
  const scene: any = {
    textures: { exists: () => true },
    hero,
    weaponV3Gun,
    weaponAim: 0,
    move: { x: 0, y: 0, lengthSq() { return this.x * this.x + this.y * this.y; } },
    heroSpeed: 255,
    weaponSystem: {
      setMuzzleResolver(fn: (spread: number) => Vector2) { muzzleResolver = fn; return this; },
      setFireFeedback(fn: (payload: any) => void) { fireFeedback = fn; return this; }
    },
    add: { image: (x: number, y: number, key: string) => Object.assign(new DisplayObject(), { x, y, texture: { key } }) },
    tweens: { add: vi.fn() },
    cameras: { main: { shake: vi.fn() } },
    playTone: vi.fn()
  };
  for (const key of LEGACY_PARTS) scene[key] = new DisplayObject();
  return {
    scene,
    hero,
    weaponV3Gun,
    getMuzzleResolver: () => muzzleResolver,
    getFireFeedback: () => fireFeedback
  };
}

beforeEach(() => {
  (globalThis as any).Phaser = { Math: { Vector2 } };
});

describe('locked Shotgun production presentation adapters', () => {
  it('derives bidirectional grip and muzzle geometry from the canonical art contract', () => {
    const right = resolveShotgunPresentationPose(100, 80, 0);
    const left = resolveShotgunPresentationPose(100, 80, Math.PI);
    expect(right.facing).toBe('right');
    expect(left.facing).toBe('left');
    expect(right.grip.x).toBeGreaterThan(100);
    expect(left.grip.x).toBeLessThan(100);
    expect(right.muzzle.x).toBeGreaterThan(right.grip.x);
    expect(left.muzzle.x).toBeLessThan(left.grip.x);
  });

  it('keeps the approved four-step leg cycle subtle while adding body weight', () => {
    const first = resolveShotgunLayeredMotion({ moving: true, move: { x: 1, y: 0 }, bodyClockMs: 35, stepClockMs: 10, speedRatio: 1 });
    const opposite = resolveShotgunLayeredMotion({ moving: true, move: { x: 1, y: 0 }, bodyClockMs: 265, stepClockMs: 240, speedRatio: 1 });
    const idle = resolveShotgunLayeredMotion({ moving: false, bodyClockMs: 225 });
    expect(first.leftX).toBeLessThan(first.rightX);
    expect(opposite.leftX).toBeGreaterThan(opposite.rightX);
    expect(Math.abs(first.bodyBob)).toBeLessThan(1.5);
    expect(Math.abs(first.bodyRotation)).toBeLessThan(.04);
    expect(Math.abs(idle.bodyBob)).toBeLessThanOrEqual(.65);
  });

  it('installs C5 body/weapon ownership without inherited atlas state', async () => {
    const fixture = createScene();
    const result = await installShotgunC5Presentation(fixture.scene);
    expect(Object.values(result.checks).every(Boolean)).toBe(true);
    expect(fixture.hero.texture.key).toBe(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    expect(fixture.hero.visible).toBe(false);
    expect(fixture.scene.__shotgunLayeredLocomotion?.torso.texture.key).toBe(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    expect(fixture.weaponV3Gun.texture.key).toBe(SHOTGUN_RUNTIME_PRESENTATION.weapon.key);
    expect(fixture.weaponV3Gun.cropped).toBe(false);
    expect(fixture.weaponV3Gun.flipY).toBe(false);
    expect(LEGACY_PARTS.every(key => fixture.scene[key].visible === false)).toBe(true);
    const muzzle = fixture.getMuzzleResolver()?.(0);
    expect(muzzle?.x).toBeGreaterThan(fixture.hero.x);
    expect(fixture.getFireFeedback()).toBeTypeOf('function');
  });

  it('installs D1 locomotion and preserves the canonical Shotgun weapon identity', async () => {
    const fixture = createScene();
    const weaponDefinition = getWeaponDefinition('shotgun');
    const definition = {
      id: 'shotgun',
      render: { idleTexture: SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key },
      animations: {
        idle: { frames: SHOTGUN_RUNTIME_PRESENTATION.body.idle.map(frame => frame.key) },
        run: { frames: SHOTGUN_RUNTIME_PRESENTATION.body.run.map(frame => frame.key) }
      }
    } as any;
    const updateLocomotionVisuals = vi.fn();
    const installProductionVisuals = vi.fn(() => { fixture.scene.__characterSystemReady = true; });
    fixture.scene.characterId = 'shotgun';
    fixture.scene.characterDefinition = definition;
    fixture.scene.startingWeaponId = 'shotgun';
    fixture.scene.activeWeaponId = 'shotgun';
    fixture.scene.primaryWeapon = createWeaponRuntimeState('shotgun');
    fixture.scene.characterSystem = {
      characterId: 'shotgun',
      weaponDefinition,
      installProductionVisuals,
      updateLocomotionVisuals
    };
    const baseMovement = vi.fn();
    fixture.scene.updateMovement = baseMovement;

    const result = await installShotgunD1Presentation(fixture.scene, definition);
    expect(Object.values(result.checks).every(Boolean)).toBe(true);
    expect(installProductionVisuals).toHaveBeenCalledOnce();
    fixture.scene.move.x = 1;
    fixture.scene.updateMovement(123);
    fixture.scene.updateMovement(246);
    expect(baseMovement).toHaveBeenCalledTimes(2);
    expect(baseMovement).toHaveBeenLastCalledWith(246);
    expect(updateLocomotionVisuals).not.toHaveBeenCalled();
    const layered = fixture.scene.__shotgunLayeredLocomotion;
    expect(layered.poseIndex).toBeGreaterThanOrEqual(0);
    expect(layered.torso.x).not.toBe(fixture.hero.x);
    // Authoring-space translations must be scaled down to the production sprite.
    // The old 1:1 pixel copy created the visible detached-leg gap on the live game.
    expect(Math.abs(layered.legLeft.x - layered.legRight.x)).toBeLessThanOrEqual(3);
    expect(layered.motionScale).toBeCloseTo((128 * .78) / 210, 5);
    expect(fixture.scene.primaryWeapon.fireProfile).toEqual(weaponDefinition.fireProfile);
  });

  it('loads only the separate weapon through Phaser image loading once Wrecker body canvases exist', async () => {
    const fixture = createScene();
    const image = vi.fn();
    const svg = vi.fn();
    const listeners = new Map<string, Function>();
    fixture.scene.textures.exists = (key: string) => key !== SHOTGUN_RUNTIME_PRESENTATION.weapon.key;
    fixture.scene.load = {
      image,
      svg,
      on: vi.fn((event: string, fn: Function) => listeners.set(event, fn)),
      off: vi.fn(),
      once: vi.fn((event: string, fn: Function) => listeners.set(event, fn)),
      start: vi.fn(() => listeners.get('complete')?.())
    };

    await installShotgunC5Presentation(fixture.scene);

    expect(image).toHaveBeenCalledOnce();
    expect(image).toHaveBeenCalledWith(
      SHOTGUN_RUNTIME_PRESENTATION.weapon.key,
      SHOTGUN_RUNTIME_PRESENTATION.weapon.path
    );
    expect(svg).not.toHaveBeenCalled();
  });

  it('rejects a future character definition that drifts from canonical Shotgun frames', async () => {
    const fixture = createScene();
    fixture.scene.characterSystem = { characterId: 'shotgun' };
    await expect(installShotgunD1Presentation(fixture.scene, {
      id: 'shotgun',
      render: { idleTexture: 'wrong-idle' },
      animations: { idle: { frames: ['wrong-idle'] }, run: { frames: ['wrong-run'] } }
    } as any)).rejects.toThrow('canonical idle runtime frames');
  });
});

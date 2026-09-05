import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWeaponRuntimeState, getWeaponDefinition } from '../../src/combat/weapon-registry.js';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';
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
  rotation = 99;
  originX = 0.5;
  originY = 0.5;
  setVisible(value: boolean) { this.visible = value; return this; }
  setTexture(key: string) { this.texture = { key }; return this; }
  setCrop() { this.cropped = false; return this; }
  setOrigin(x = 0.5, y = 0.5) { this.originX = x; this.originY = y; return this; }
  setScale() { return this; }
  setFlipX(value: boolean) { this.flipX = value; return this; }
  setFlipY(value: boolean) { this.flipY = value; return this; }
  clearTint() { return this; }
  stop() { return this; }
  setRotation(value = 0) { this.rotation = value; return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  setDepth(value: number) { this.depth = value; return this; }
  setAlpha() { return this; }
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
  it('uses mirrored fixed two-hand holds instead of rotating the gun around one hand', () => {
    for (const requested of [-Math.PI * 5, -Math.PI, -0.7, 0, 0.7, Math.PI, Math.PI * 5]) {
      const pose = resolveShotgunPresentationPose(100, 80, requested);
      expect(pose.weaponRotation).toBe(0);
      expect(pose.holdMode).toBe('two-hand-fixed');
      expect(pose.twoHandLocked).toBe(true);
      expect(pose.twoHandError).toBeLessThan(0.25);
      if (pose.facing === 'right') {
        expect(pose.muzzle.x).toBeGreaterThan(pose.grip.x);
        expect(pose.weaponFlipX).toBe(false);
        expect(pose.weaponOrigin.x).toBeCloseTo(18 / 96, 10);
      } else {
        expect(pose.muzzle.x).toBeLessThan(pose.grip.x);
        expect(pose.weaponFlipX).toBe(true);
        expect(pose.weaponOrigin.x).toBeCloseTo(1 - (18 / 96), 10);
      }
      expect(pose.weaponOrigin.y).toBeCloseTo(22 / 40, 10);
    }
  });

  it('installs C5 as body -> weapon -> baked front hands with zero body/weapon rotation', async () => {
    const fixture = createScene();
    const result = await installShotgunC5Presentation(fixture.scene);
    expect(Object.values(result.checks).every(Boolean)).toBe(true);
    expect(fixture.hero.texture.key).toBe(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    expect(fixture.hero.visible).toBe(true);
    expect(fixture.weaponV3Gun.texture.key).toBe(SHOTGUN_RUNTIME_PRESENTATION.weapon.key);
    expect(fixture.weaponV3Gun.cropped).toBe(false);
    expect(fixture.weaponV3Gun.flipY).toBe(false);
    expect(fixture.weaponV3Gun.flipX).toBe(false);
    expect(fixture.weaponV3Gun.originX).toBeCloseTo(18 / 96, 10);
    expect(fixture.weaponV3Gun.originY).toBeCloseTo(22 / 40, 10);
    expect(fixture.hero.rotation).toBe(0);
    expect(fixture.weaponV3Gun.rotation).toBe(0);
    expect(fixture.scene.__shotgunHandOverlay.texture.key).toBe(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].handOverlayKey);
    expect(fixture.scene.__shotgunHandOverlay.rotation).toBe(0);
    expect(fixture.hero.depth).toBeLessThan(fixture.weaponV3Gun.depth);
    expect(fixture.weaponV3Gun.depth).toBeLessThan(fixture.scene.__shotgunHandOverlay.depth);
    expect(fixture.scene.__shotgunTwoHandHold).toMatchObject({
      mode: 'two-hand-fixed',
      layerMode: 'body-weapon-front-hands',
      locked: true,
      runtimeRotation: false,
      runtimeBodyRotation: false
    });
    expect(LEGACY_PARTS.every(key => fixture.scene[key].visible === false)).toBe(true);
    const muzzle = fixture.getMuzzleResolver()?.(0);
    expect(muzzle?.x).toBeGreaterThan(fixture.hero.x);
    expect(fixture.getFireFeedback()).toBeTypeOf('function');
  });

  it('mirrors the entire hold left/right without allowing aim input or spread to rotate/relocate the gun', async () => {
    const fixture = createScene();
    await installShotgunC5Presentation(fixture.scene);
    const rightMuzzleA = fixture.getMuzzleResolver()?.(-0.3);
    const rightMuzzleB = fixture.getMuzzleResolver()?.(0.3);
    expect(rightMuzzleA).toEqual(rightMuzzleB);

    fixture.scene.weaponAim = Math.PI;
    fixture.scene.updateWeaponPose();
    expect(fixture.hero.flipX).toBe(true);
    expect(fixture.weaponV3Gun.flipX).toBe(true);
    expect(fixture.weaponV3Gun.originX).toBeCloseTo(1 - (18 / 96), 10);
    expect(fixture.weaponV3Gun.originY).toBeCloseTo(22 / 40, 10);
    expect(fixture.weaponV3Gun.rotation).toBe(0);
    expect(fixture.hero.rotation).toBe(0);
    expect(fixture.scene.__shotgunHandOverlay.flipX).toBe(true);
    expect(fixture.scene.__shotgunHandOverlay.rotation).toBe(0);
    expect(fixture.hero.depth).toBeLessThan(fixture.weaponV3Gun.depth);
    expect(fixture.weaponV3Gun.depth).toBeLessThan(fixture.scene.__shotgunHandOverlay.depth);
    expect(fixture.scene.__shotgunSupportHand.x).toBeLessThan(fixture.scene.__shotgunGrip.x);
    expect(fixture.scene.__shotgunMuzzle.x).toBeLessThan(fixture.scene.__shotgunGrip.x);
    const leftMuzzleA = fixture.getMuzzleResolver()?.(-0.4);
    const leftMuzzleB = fixture.getMuzzleResolver()?.(0.4);
    expect(leftMuzzleA).toEqual(leftMuzzleB);
  });

  it('installs D1 locomotion and preserves the canonical Shotgun weapon identity', async () => {
    const fixture = createScene();
    const weaponDefinition = getWeaponDefinition('shotgun');
    const definition = {
      id: 'shotgun',
      render: { idleTexture: SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key },
      animations: {
        idle: { frames: SHOTGUN_RUNTIME_PRESENTATION.body.idle.map((frame: { key: string }) => frame.key) },
        run: { frames: SHOTGUN_RUNTIME_PRESENTATION.body.run.map((frame: { key: string }) => frame.key) }
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
    fixture.hero.rotation = 0.3;
    fixture.scene.__shotgunHandOverlay.rotation = 0.3;
    fixture.scene.updateMovement(123);
    expect(baseMovement).toHaveBeenCalledWith(123);
    expect(updateLocomotionVisuals).toHaveBeenCalledOnce();
    expect(fixture.hero.rotation).toBe(0);
    expect(fixture.scene.__shotgunHandOverlay.rotation).toBe(0);
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
      start: vi.fn(() => queueMicrotask(() => listeners.get('complete')?.()))
    };

    await installShotgunC5Presentation(fixture.scene);
    expect(image).toHaveBeenCalledWith(SHOTGUN_RUNTIME_PRESENTATION.weapon.key, SHOTGUN_RUNTIME_PRESENTATION.weapon.path);
    expect(svg).not.toHaveBeenCalled();
  });

  it('rejects a future character definition that drifts from canonical Shotgun frames', async () => {
    const fixture = createScene();
    fixture.scene.characterSystem = { characterId: 'shotgun' };
    await expect(installShotgunD1Presentation(fixture.scene, {
      id: 'shotgun',
      render: { idleTexture: 'wrong-idle' },
      animations: { idle: { frames: ['wrong-idle'] }, run: { frames: ['wrong-run'] } }
    })).rejects.toThrow();
  });
});

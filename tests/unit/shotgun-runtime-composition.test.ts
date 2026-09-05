import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import {
  getCharacterEntry,
  getCharacterDefinition,
  isCharacterSelectable,
} from '../../src/characters/character-registry.js';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';
import {
  SHOTGUN_RUNTIME_COMPOSITION,
  createShotgunRuntimeComposition
} from '../../src/characters/shotgun-runtime-composition.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function imageStub() {
  const image: any = {
    x: 0,
    y: 0,
    setOrigin: vi.fn(),
    setScale: vi.fn(),
    setFlipX: vi.fn(),
    setAngle: vi.fn(),
    setTexture: vi.fn(),
    destroy: vi.fn()
  };
  for (const method of ['setOrigin', 'setScale', 'setFlipX', 'setAngle', 'setTexture']) image[method].mockReturnValue(image);
  return image;
}

function sceneStub() {
  const body = imageStub();
  const weapon = imageStub();
  const container: any = {
    setPosition: vi.fn(),
    destroy: vi.fn()
  };
  container.setPosition.mockReturnValue(container);
  return {
    body,
    weapon,
    container,
    scene: {
      add: {
        image: vi.fn()
          .mockReturnValueOnce(body)
          .mockReturnValueOnce(weapon),
        container: vi.fn().mockReturnValue(container)
      }
    }
  };
}

describe('WS14-C/WS14-E locked Shotgun Phaser composition', () => {
  it('composes separate body and weapon layers from the canonical runtime presentation', () => {
    const { scene, body, weapon, container } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any, { x: 120, y: 90 });

    expect(scene.add.image).toHaveBeenNthCalledWith(1, 0, 0, SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    expect(scene.add.image).toHaveBeenNthCalledWith(
      2,
      SHOTGUN_ART_CONTRACT.gripSocket.offsetX,
      SHOTGUN_ART_CONTRACT.gripSocket.offsetY,
      SHOTGUN_RUNTIME_PRESENTATION.weapon.key
    );
    expect(scene.add.container).toHaveBeenCalledWith(120, 90, [body, weapon]);
    expect(body.setOrigin).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.originX, SHOTGUN_ART_CONTRACT.render.originY);
    expect(body.setScale).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.scale);
    expect(weapon.setOrigin).toHaveBeenCalledWith(
      SHOTGUN_RUNTIME_PRESENTATION.weapon.origin.x,
      SHOTGUN_RUNTIME_PRESENTATION.weapon.origin.y
    );
    expect(weapon.setScale).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.scale);
    expect(composition.container).toBe(container);
  });

  it('selects all approved idle/run textures without changing body canvas or scale ownership', () => {
    const { scene, body } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any);

    composition.setMotion('idle', 1);
    composition.setMotion('run', 0);
    composition.setMotion('run', 1);
    composition.setMotion('run', 2);
    composition.setMotion('run', 3);

    expect(body.setTexture.mock.calls.map((call: any[]) => call[0])).toEqual([
      SHOTGUN_RUNTIME_PRESENTATION.body.idle[1].key,
      SHOTGUN_RUNTIME_PRESENTATION.body.run[0].key,
      SHOTGUN_RUNTIME_PRESENTATION.body.run[1].key,
      SHOTGUN_RUNTIME_PRESENTATION.body.run[2].key,
      SHOTGUN_RUNTIME_PRESENTATION.body.run[3].key
    ]);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.canvas).toBe(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.render).toBe(SHOTGUN_ART_CONTRACT.render);
  });

  it('mirrors body and separate weapon around the canonical grip while preserving relative aim semantics', () => {
    const { scene, body, weapon } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any, { aimDegrees: -20 });

    expect(body.setFlipX).toHaveBeenLastCalledWith(false);
    expect(weapon.setFlipX).toHaveBeenLastCalledWith(false);
    expect(weapon.x).toBe(SHOTGUN_ART_CONTRACT.gripSocket.offsetX);
    expect(weapon.y).toBe(SHOTGUN_ART_CONTRACT.gripSocket.offsetY);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(-20);

    composition.setFacing('left');
    expect(body.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.x).toBe(-SHOTGUN_ART_CONTRACT.gripSocket.offsetX);
    expect(weapon.y).toBe(SHOTGUN_ART_CONTRACT.gripSocket.offsetY);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(20);

    composition.setAimDegrees(15);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(-15);
  });

  it('advances deterministic idle/run cycles without owning cadence or disturbing aim/facing', () => {
    const { scene, body, weapon } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any, { facing: 'left', aimDegrees: 20 });

    composition.advanceLocomotion(249, { frameDurationMs: 250 });
    expect(composition.frameIndex).toBe(0);
    composition.advanceLocomotion(1, { frameDurationMs: 250 });
    expect(composition.frameIndex).toBe(1);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.idle[1].key);

    composition.advanceLocomotion(250, { frameDurationMs: 250 });
    expect(composition.frameIndex).toBe(0);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);

    composition.advanceLocomotion(0, { motion: 'run', frameDurationMs: 100 });
    expect(composition.motion).toBe('run');
    expect(composition.frameIndex).toBe(0);
    composition.advanceLocomotion(300, { frameDurationMs: 100 });
    expect(composition.frameIndex).toBe(3);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.run[3].key);
    composition.advanceLocomotion(100, { frameDurationMs: 100 });
    expect(composition.frameIndex).toBe(0);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.run[0].key);

    expect(body.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(-20);
  });

  it('allows a locked gameplay definition while keeping Shotgun outside live selection owners', () => {
    expect(SHOTGUN_RUNTIME_COMPOSITION.activation).toEqual({
      playableOnMain: false,
      previewRegistryEntryAllowed: true,
      playableRegistryDefinitionAllowed: true
    });
    expect(getCharacterEntry('shotgun')).toMatchObject({ id: 'shotgun', availability: 'locked', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
    expect(read('index.html')).not.toContain('shotgun-runtime-composition');
    expect(read('src/phase-d1-runtime.js')).not.toContain('shotgun-runtime-composition');
  });

  it('rejects invalid motion/facing/aim boundaries instead of silently inventing state', () => {
    const first = sceneStub();
    expect(() => createShotgunRuntimeComposition({} as any)).toThrow('Phaser-like scene.add');
    expect(() => createShotgunRuntimeComposition(first.scene as any, { motion: 'fly' })).toThrow('Unsupported Shotgun motion');

    const second = sceneStub();
    expect(() => createShotgunRuntimeComposition(second.scene as any, { facing: 'up' })).toThrow('Unsupported Shotgun facing');

    const third = sceneStub();
    expect(() => createShotgunRuntimeComposition(third.scene as any, { aimDegrees: Number.NaN })).toThrow('aim degrees must be finite');

    const fourth = sceneStub();
    const composition = createShotgunRuntimeComposition(fourth.scene as any);
    expect(() => composition.setMotion('run', 4)).toThrow('Invalid Shotgun run frame index');
    expect(() => composition.setPosition(Number.POSITIVE_INFINITY, 0)).toThrow('position must be finite');
    expect(() => composition.advanceLocomotion(-1, { frameDurationMs: 100 })).toThrow('delta must be a finite non-negative number');
    expect(() => composition.advanceLocomotion(1, { frameDurationMs: 0 })).toThrow('frame duration must be a finite positive number');
    expect(() => composition.advanceLocomotion(1, { motion: 'fly', frameDurationMs: 100 } as any)).toThrow('Unsupported Shotgun motion');
  });
});

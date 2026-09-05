import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';
import {
  SHOTGUN_RUNTIME_COMPOSITION,
  createShotgunRuntimeComposition
} from '../../src/characters/shotgun-runtime-composition.js';

const read=(path:string)=>fs.readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');

class DisplayObject {
  texture = { key: '' };
  x = 0;
  y = 0;
  flipX = false;
  angle = 0;
  setOrigin = vi.fn(() => this);
  setScale = vi.fn(() => this);
  setFlipX = vi.fn((value:boolean) => { this.flipX=value; return this; });
  setAngle = vi.fn((value:number) => { this.angle=value; return this; });
  setTexture = vi.fn((key:string) => { this.texture={key}; return this; });
  setPosition = vi.fn((x:number,y:number) => { this.x=x; this.y=y; return this; });
}

function sceneStub() {
  const body = new DisplayObject();
  const weapon = new DisplayObject();
  const hands = new DisplayObject();
  const objects = [body, weapon, hands];
  const container = {
    x: 0,
    y: 0,
    setPosition: vi.fn(function(this:any,x:number,y:number){this.x=x;this.y=y;return this;}),
    destroy: vi.fn()
  };
  const image = vi.fn((x:number,y:number,key:string) => {
    const target = objects[image.mock.calls.length - 1];
    target.x=x; target.y=y; target.texture={key};
    return target;
  });
  const scene = { add: { image, container: vi.fn((x:number,y:number,_children:any[]) => {container.x=x;container.y=y;return container;}) } };
  return { scene, body, weapon, hands, container };
}

describe('WS14-C/WS14-E locked Shotgun Phaser composition', () => {
  it('creates canonical body -> weapon -> baked-front-hands ordering', () => {
    const { scene, body, weapon, hands, container } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any, { x: 120, y: 90 });

    expect(scene.add.image).toHaveBeenNthCalledWith(1, 0, 0, SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    const render = SHOTGUN_ART_CONTRACT.render;
    const canvas = SHOTGUN_ART_CONTRACT.canvas;
    const grip = SHOTGUN_RUNTIME_PRESENTATION.body.grip.right;
    const gripOffset = {
      x: (grip.x - (canvas.width * render.originX)) * render.scale,
      y: (grip.y - (canvas.height * render.originY)) * render.scale
    };
    expect(scene.add.image).toHaveBeenNthCalledWith(2, gripOffset.x, gripOffset.y, SHOTGUN_RUNTIME_PRESENTATION.weapon.key);
    expect(scene.add.image).toHaveBeenNthCalledWith(3, 0, 0, SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].handOverlayKey);
    expect(scene.add.container).toHaveBeenCalledWith(120, 90, [body, weapon, hands]);
    expect(body.setOrigin).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.originX, SHOTGUN_ART_CONTRACT.render.originY);
    expect(body.setScale).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.scale);
    expect(weapon.setOrigin).toHaveBeenCalledWith(
      SHOTGUN_RUNTIME_PRESENTATION.weapon.origin.x,
      SHOTGUN_RUNTIME_PRESENTATION.weapon.origin.y
    );
    expect(weapon.setScale).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.scale);
    expect(hands.setOrigin).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.originX, SHOTGUN_ART_CONTRACT.render.originY);
    expect(hands.setScale).toHaveBeenCalledWith(SHOTGUN_ART_CONTRACT.render.scale);
    expect(composition.container).toBe(container);
    expect(composition.hands).toBe(hands);
    expect(SHOTGUN_RUNTIME_COMPOSITION.hold).toMatchObject({ mode: 'two-hand-fixed', runtimeRotation: false, runtimeBodyRotation: false, contactSource: 'authored-visible-hands' });
    expect(SHOTGUN_RUNTIME_COMPOSITION.layers).toMatchObject({ mode: 'body-weapon-front-hands', runtimeCrop: false });
  });

  it('keeps body and hand-overlay frames synchronized across every idle/run texture', () => {
    const { scene, body, hands } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any);

    composition.setMotion('idle', 1);
    composition.setMotion('run', 0);
    composition.setMotion('run', 1);
    composition.setMotion('run', 2);
    composition.setMotion('run', 3);

    const expectedFrames = [
      SHOTGUN_RUNTIME_PRESENTATION.body.idle[1],
      SHOTGUN_RUNTIME_PRESENTATION.body.run[0],
      SHOTGUN_RUNTIME_PRESENTATION.body.run[1],
      SHOTGUN_RUNTIME_PRESENTATION.body.run[2],
      SHOTGUN_RUNTIME_PRESENTATION.body.run[3]
    ];
    expect(body.setTexture.mock.calls.map((call: any[]) => call[0])).toEqual(expectedFrames.map(frame => frame.key));
    expect(hands.setTexture.mock.calls.map((call: any[]) => call[0])).toEqual(expectedFrames.map(frame => frame.handOverlayKey));
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.canvas).toEqual(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.render).toEqual(SHOTGUN_ART_CONTRACT.render);
  });

  it('mirrors body, weapon and hand overlay together while ignoring aim rotation inputs', () => {
    const { scene, body, weapon, hands } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any, { aimDegrees: -20 });

    expect(body.setFlipX).toHaveBeenLastCalledWith(false);
    expect(weapon.setFlipX).toHaveBeenLastCalledWith(false);
    expect(hands.setFlipX).toHaveBeenLastCalledWith(false);
    expect(weapon.x).toBeCloseTo((70 - 64) * SHOTGUN_ART_CONTRACT.render.scale, 8);
    expect(weapon.y).toBeCloseTo((75 - (148 * SHOTGUN_ART_CONTRACT.render.originY)) * SHOTGUN_ART_CONTRACT.render.scale, 8);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(0);

    composition.setFacing('left');
    expect(body.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.setFlipX).toHaveBeenLastCalledWith(true);
    expect(hands.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.x).toBeCloseTo(-((70 - 64) * SHOTGUN_ART_CONTRACT.render.scale), 8);
    expect(weapon.y).toBeCloseTo((75 - (148 * SHOTGUN_ART_CONTRACT.render.originY)) * SHOTGUN_ART_CONTRACT.render.scale, 8);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(0);

    for (const requested of [-720, -180, -15, 0, 15, 180, 720]) {
      composition.setAimDegrees(requested);
      expect(composition.aimDegrees).toBe(requested);
      expect(weapon.setAngle).toHaveBeenLastCalledWith(0);
    }
  });

  it('advances deterministic idle/run cycles with the overlay locked to the same frame', () => {
    const { scene, body, weapon, hands } = sceneStub();
    const composition = createShotgunRuntimeComposition(scene as any, { facing: 'left', aimDegrees: 20 });

    composition.advanceLocomotion(249, { frameDurationMs: 250 });
    expect(composition.frameIndex).toBe(0);
    composition.advanceLocomotion(1, { frameDurationMs: 250 });
    expect(composition.frameIndex).toBe(1);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.idle[1].key);
    expect(hands.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.idle[1].handOverlayKey);

    composition.advanceLocomotion(250, { frameDurationMs: 250 });
    expect(composition.frameIndex).toBe(0);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    expect(hands.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].handOverlayKey);

    composition.advanceLocomotion(0, { motion: 'run', frameDurationMs: 100 });
    expect(composition.motion).toBe('run');
    expect(composition.frameIndex).toBe(0);
    composition.advanceLocomotion(300, { frameDurationMs: 100 });
    expect(composition.frameIndex).toBe(3);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.run[3].key);
    expect(hands.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.run[3].handOverlayKey);
    composition.advanceLocomotion(100, { frameDurationMs: 100 });
    expect(composition.frameIndex).toBe(0);
    expect(body.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.run[0].key);
    expect(hands.setTexture).toHaveBeenLastCalledWith(SHOTGUN_RUNTIME_PRESENTATION.body.run[0].handOverlayKey);

    expect(body.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.setFlipX).toHaveBeenLastCalledWith(true);
    expect(hands.setFlipX).toHaveBeenLastCalledWith(true);
    expect(weapon.setAngle).toHaveBeenLastCalledWith(0);
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

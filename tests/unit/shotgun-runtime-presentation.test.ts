import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT } from '../../src/characters/shotgun-aim-alignment.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';
import { SHOTGUN_RUNTIME_PRESENTATION, getShotgunHandOverlayKey, getShotgunWeaponOriginForFacing, listShotgunRuntimeAssets, queueShotgunRuntimeAssets } from '../../src/characters/shotgun-runtime-presentation.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS14-C/WS14-E active Wrecker runtime presentation boundary', () => {
  it('owns two source idle frames, four generated run frames, baked hand overlays and one separate weapon', () => {
    const assets = listShotgunRuntimeAssets();
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.idle).toHaveLength(2);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run).toHaveLength(4);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run.every((frame: { generated: boolean }) => frame.generated === true)).toBe(true);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run.map((frame: { pose: string }) => frame.pose)).toEqual(SHOTGUN_PRODUCTION_ART.body.runBake.poses);
    expect(assets).toHaveLength(3);
    expect(assets.map((asset: { path: string }) => asset.path)).toEqual([
      ...SHOTGUN_PRODUCTION_ART.body.idle,
      SHOTGUN_PRODUCTION_ART.weapon.path
    ]);
    const bodyFrames=[...SHOTGUN_RUNTIME_PRESENTATION.body.idle,...SHOTGUN_RUNTIME_PRESENTATION.body.run];
    const allKeys=[...bodyFrames.map((x: { key: string }) => x.key),...bodyFrames.map((x: { handOverlayKey: string }) => x.handOverlayKey),SHOTGUN_RUNTIME_PRESENTATION.weapon.key];
    expect(new Set(allKeys).size).toBe(13);
    for (const frame of bodyFrames) expect(getShotgunHandOverlayKey(frame.key)).toBe(frame.handOverlayKey);
  });

  it('derives render and weapon geometry only from frozen canonical sources', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.canvas).toEqual(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.render).toEqual(SHOTGUN_ART_CONTRACT.render);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.origin).toEqual(SHOTGUN_AIM_ALIGNMENT.weaponOrigin);
    expect(getShotgunWeaponOriginForFacing('right')).toEqual({ x: 18 / 96, y: 22 / 40 });
    expect(getShotgunWeaponOriginForFacing('left')).toEqual({ x: 1 - (18 / 96), y: 22 / 40 });
    expect(getShotgunWeaponOriginForFacing('right').x + getShotgunWeaponOriginForFacing('left').x).toBeCloseTo(1, 10);
    expect(() => getShotgunWeaponOriginForFacing('up' as any)).toThrow('Unsupported Shotgun facing');
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.support).toEqual(SHOTGUN_PRODUCTION_ART.weapon.support);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.supportFromGrip).toEqual(SHOTGUN_AIM_ALIGNMENT.supportFromGrip);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.muzzleFromGrip).toEqual(SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.hold).toMatchObject({ mode: 'two-hand-fixed', runtimeRotation: false, runtimeBodyRotation: false });
    expect(SHOTGUN_RUNTIME_PRESENTATION.layers).toEqual({
      mode: 'body-weapon-front-hands',
      bodyDepthOffset: 0,
      weaponDepthOffset: 0.1,
      handOverlayDepthOffset: 0.2,
      runtimeCrop: false
    });
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.handOverlay).toEqual({ mode: 'baked-two-hand-overlay', source: 'same-body-raster', runtimeCrop: false });
  });

  it('queues only external source assets, never generated run frames', () => {
    const image = vi.fn();
    const result = queueShotgunRuntimeAssets({ load: { image } } as any);
    expect(result).toBe(SHOTGUN_RUNTIME_PRESENTATION);
    expect(image).toHaveBeenCalledTimes(3);
    for (const [index, asset] of listShotgunRuntimeAssets().entries()) {
      expect(image).toHaveBeenNthCalledWith(index + 1, asset.key, asset.path);
    }
    expect(() => queueShotgunRuntimeAssets({} as any)).toThrow('Phaser-like scene.load.image boundary');
  });

  it('exposes the canonical active runtime through main selection', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.status).toBe('active-runtime-boundary');
    expect(SHOTGUN_RUNTIME_PRESENTATION.activation.playableOnMain).toBe(true);
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'selectable', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(true);
    expect(getCharacterDefinition('shotgun')).toMatchObject({ id: 'shotgun', displayName: 'Wrecker' });
    expect(read('index.html')).not.toContain('shotgun-runtime-presentation');
  });
});

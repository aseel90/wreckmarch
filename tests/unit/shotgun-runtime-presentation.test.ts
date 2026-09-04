import { describe, expect, it, vi } from 'vitest';
import { getCharacterEntry } from '../../src/characters/character-registry.js';
import { SHOTGUN_AIM_ALIGNMENT } from '../../src/characters/shotgun-aim-alignment.js';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import {
  SHOTGUN_RUNTIME_PRESENTATION,
  listShotgunRuntimeAssets,
  queueShotgunRuntimeAssets
} from '../../src/characters/shotgun-runtime-presentation.js';

describe('WS14-C/WS14-E locked Shotgun runtime presentation boundary', () => {
  it('exposes all approved body frames and the signature weapon through one runtime contract', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.id).toBe('shotgun');
    expect(SHOTGUN_RUNTIME_PRESENTATION.status).toBe('inactive-runtime-boundary');
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.idle).toHaveLength(2);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run).toHaveLength(5);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.idle.map(frame => frame.path)).toEqual(SHOTGUN_PRODUCTION_ART.body.idle);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run.map(frame => frame.path)).toEqual(SHOTGUN_PRODUCTION_ART.body.run);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.path).toBe(SHOTGUN_PRODUCTION_ART.weapon.path);
    expect(listShotgunRuntimeAssets()).toHaveLength(8);
  });

  it('keeps aim geometry anchored to the canonical alignment contract', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.gripSocket).toBe(SHOTGUN_AIM_ALIGNMENT.gripSocket);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.origin).toBe(SHOTGUN_AIM_ALIGNMENT.weaponOrigin);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.muzzleFromGrip).toBe(SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip);
  });

  it('queues approved SVG textures through the browser image decoder without changing registry availability', () => {
    const image = vi.fn();
    const before = getCharacterEntry('shotgun');
    const result = queueShotgunRuntimeAssets({ load: { image } } as any);
    expect(result).toBe(SHOTGUN_RUNTIME_PRESENTATION);
    expect(image).toHaveBeenCalledTimes(8);
    for (const [index, asset] of listShotgunRuntimeAssets().entries()) {
      expect(image).toHaveBeenNthCalledWith(index + 1, asset.key, asset.path);
    }
    expect(getCharacterEntry('shotgun')).toBe(before);

    image.mockClear();
    const subset = listShotgunRuntimeAssets().slice(0, 2);
    queueShotgunRuntimeAssets({ load: { image } } as any, subset);
    expect(image).toHaveBeenCalledTimes(2);
    expect(image).toHaveBeenNthCalledWith(1, subset[0].key, subset[0].path);
    expect(image).toHaveBeenNthCalledWith(2, subset[1].key, subset[1].path);

    expect(() => queueShotgunRuntimeAssets({} as any)).toThrow('Phaser-like scene.load.image boundary');
  });

  it('allows a canonical definition while keeping main selection locked', () => {
    const entry = getCharacterEntry('shotgun');
    expect(entry.availability).toBe('locked');
    expect(entry.selectableNow).toBe(false);
    expect(SHOTGUN_RUNTIME_PRESENTATION.activation.playableOnMain).toBe(false);
    expect(SHOTGUN_RUNTIME_PRESENTATION.activation.playableRegistryDefinitionAllowed).toBe(true);
  });
});

import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT } from '../../src/characters/shotgun-aim-alignment.js';
import {
  getCharacterEntry,
  getCharacterDefinition,
  isCharacterSelectable,
} from '../../src/characters/character-registry.js';
import {
  SHOTGUN_RUNTIME_PRESENTATION,
  listShotgunRuntimeAssets,
  queueShotgunRuntimeAssets
} from '../../src/characters/shotgun-runtime-presentation.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS14-C/WS14-E locked Shotgun runtime presentation boundary', () => {
  it('owns stable unique texture keys for exactly the approved seven body frames plus separate weapon', () => {
    const assets = listShotgunRuntimeAssets();
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.idle).toHaveLength(2);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run).toHaveLength(5);
    expect(assets).toHaveLength(8);
    expect(new Set(assets.map(asset => asset.key)).size).toBe(8);
    expect(assets.map(asset => asset.path)).toEqual([
      ...SHOTGUN_PRODUCTION_ART.body.idle,
      ...SHOTGUN_PRODUCTION_ART.body.run,
      SHOTGUN_PRODUCTION_ART.weapon.path
    ]);
  });

  it('derives render and weapon geometry only from the frozen canonical art/alignment sources', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.canvas).toBe(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.render).toBe(SHOTGUN_ART_CONTRACT.render);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.canvas).toBe(SHOTGUN_PRODUCTION_ART.weapon.canvas);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.grip).toBe(SHOTGUN_PRODUCTION_ART.weapon.grip);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.muzzle).toBe(SHOTGUN_PRODUCTION_ART.weapon.muzzle);
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
    expect(SHOTGUN_RUNTIME_PRESENTATION.status).toBe('inactive-runtime-boundary');
    expect(SHOTGUN_RUNTIME_PRESENTATION.activation).toEqual({
      playableOnMain: false,
      previewRegistryEntryAllowed: true,
      playableRegistryDefinitionAllowed: true,
      gameplayDefinitionReady: true
    });
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'locked', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
    expect(read('index.html')).not.toContain('shotgun-runtime-presentation');
    expect(read('src/phase-d1-runtime.js')).not.toContain('shotgun-runtime-presentation');
  });
});

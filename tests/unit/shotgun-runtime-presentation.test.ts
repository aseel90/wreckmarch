import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT } from '../../src/characters/shotgun-aim-alignment.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';
import { SHOTGUN_RUNTIME_PRESENTATION, listShotgunRuntimeAssets, queueShotgunRuntimeAssets } from '../../src/characters/shotgun-runtime-presentation.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS14-C/WS14-E locked Shotgun runtime presentation boundary', () => {
  it('owns two source idle frames, four generated run frames and one separate weapon', () => {
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
    const allKeys=[...SHOTGUN_RUNTIME_PRESENTATION.body.idle,...SHOTGUN_RUNTIME_PRESENTATION.body.run,{key:SHOTGUN_RUNTIME_PRESENTATION.weapon.key}].map((x: { key: string }) => x.key);
    expect(new Set(allKeys).size).toBe(7);
  });

  it('derives render and weapon geometry only from frozen canonical sources', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.canvas).toBe(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.render).toBe(SHOTGUN_ART_CONTRACT.render);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.origin).toBe(SHOTGUN_AIM_ALIGNMENT.weaponOrigin);
    expect(SHOTGUN_RUNTIME_PRESENTATION.weapon.muzzleFromGrip).toBe(SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip);
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

  it('allows a canonical definition while keeping main selection locked', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.status).toBe('inactive-runtime-boundary');
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'locked', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
    expect(read('index.html')).not.toContain('shotgun-runtime-presentation');
  });
});

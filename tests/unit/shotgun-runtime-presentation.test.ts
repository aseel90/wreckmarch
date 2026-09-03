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

describe('WS14-C inactive Shotgun runtime presentation boundary', () => {
  it('owns stable unique texture keys for exactly the approved five body frames plus separate weapon', () => {
    const assets = listShotgunRuntimeAssets();
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.idle).toHaveLength(2);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run).toHaveLength(3);
    expect(assets).toHaveLength(6);
    expect(new Set(assets.map(asset => asset.key)).size).toBe(6);
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

  it('can queue presentation assets through one explicit owner without changing registry availability', () => {
    const svg = vi.fn();
    const before = getCharacterEntry('shotgun');
    const result = queueShotgunRuntimeAssets({ load: { svg } } as any);
    expect(result).toBe(SHOTGUN_RUNTIME_PRESENTATION);
    expect(svg).toHaveBeenCalledTimes(6);
    for (const [index, asset] of listShotgunRuntimeAssets().entries()) {
      expect(svg).toHaveBeenNthCalledWith(index + 1, asset.key, asset.path);
    }
    expect(getCharacterEntry('shotgun')).toBe(before);
    expect(() => queueShotgunRuntimeAssets({} as any)).toThrow('Phaser-like scene.load.svg boundary');
  });

  it('remains impossible to select on main while a locked preview registry entry is allowed', () => {
    expect(SHOTGUN_RUNTIME_PRESENTATION.status).toBe('inactive-runtime-boundary');
    expect(SHOTGUN_RUNTIME_PRESENTATION.activation).toEqual({
      playableOnMain: false,
      previewRegistryEntryAllowed: true,
      playableRegistryDefinitionAllowed: false,
      gameplayDefinitionReady: false
    });
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'locked', definition: null });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
    expect(read('index.html')).not.toContain('shotgun-runtime-presentation');
    expect(read('src/phase-d1-runtime.js')).not.toContain('shotgun-runtime-presentation');
  });
});

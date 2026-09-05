import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS14-C Shotgun production art contract', () => {
  it('freezes the normalized canvas and four-frame baked locomotion contract', () => {
    expect(SHOTGUN_ART_CONTRACT.canvas).toEqual({ width: 128, height: 148 });
    expect(SHOTGUN_ART_CONTRACT.body).toEqual({ maxWidth: 104, maxHeight: 132, footLineY: 140 });
    expect(SHOTGUN_ART_CONTRACT.baseAnimationFrames).toEqual({ idle: 2, run: 4 });
    expect(SHOTGUN_ART_CONTRACT.locomotion).toEqual({ productionMode: 'baked-full-body', runtimeLimbSplit: false });
  });

  it('owns Wrecker-authored two-hand contacts instead of inheriting Runner weapon sockets', () => {
    expect(SHOTGUN_ART_CONTRACT.render).toEqual({ originX: 0.5, originY: 0.52, scale: 0.78 });
    expect(SHOTGUN_ART_CONTRACT.twoHandHold).toEqual({
      bodyRearGrip: { x: 70, y: 75 },
      bodySupportGrip: { x: 103, y: 78 },
      weaponRearGrip: { x: 18, y: 22 },
      weaponSupportGrip: { x: 51, y: 25 },
      weaponMuzzle: { x: 90, y: 17 }
    });
    expect(SHOTGUN_ART_CONTRACT.gripSocket.offsetX).toBeCloseTo(4.68, 8);
    expect(SHOTGUN_ART_CONTRACT.gripSocket.offsetY).toBeCloseTo(-1.5288, 8);
  });

  it('keeps the weapon separate and the public character locked', () => {
    expect(SHOTGUN_ART_CONTRACT.weaponLayer.separateFromBody).toBe(true);
    expect(SHOTGUN_ART_CONTRACT.activation.playableOnMain).toBe(false);
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'locked', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
    expect(read('src/characters/character-registry.js')).not.toContain('SHOTGUN_ART_CONTRACT');
  });
});

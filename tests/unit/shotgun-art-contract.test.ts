import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';
import { RUNNER_CHARACTER } from '../../src/characters/definitions/runner.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS14-C Shotgun production art contract', () => {
  it('freezes the normalized canvas and four-frame baked locomotion contract', () => {
    expect(SHOTGUN_ART_CONTRACT.canvas).toEqual({ width: 128, height: 148 });
    expect(SHOTGUN_ART_CONTRACT.body).toEqual({ maxWidth: 104, maxHeight: 132, footLineY: 140 });
    expect(SHOTGUN_ART_CONTRACT.baseAnimationFrames).toEqual({ idle: 2, run: 4 });
    expect(SHOTGUN_ART_CONTRACT.locomotion).toEqual({ productionMode: 'baked-full-body', runtimeLimbSplit: false });
  });

  it('matches live Runner render geometry without inheriting the Runner weapon socket', () => {
    expect(SHOTGUN_ART_CONTRACT.render).toEqual({
      originX: RUNNER_CHARACTER.render.originX,
      originY: RUNNER_CHARACTER.render.originY,
      scale: RUNNER_CHARACTER.render.scale
    });
    expect(SHOTGUN_ART_CONTRACT).not.toHaveProperty('gripSocket');
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

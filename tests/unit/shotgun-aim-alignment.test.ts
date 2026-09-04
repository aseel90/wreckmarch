import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT, getShotgunWeaponPlacement } from '../../src/characters/shotgun-aim-alignment.js';
import {
  getCharacterEntry,
  getCharacterDefinition,
  isCharacterSelectable,
} from '../../src/characters/character-registry.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const bodyPaths = [...SHOTGUN_PRODUCTION_ART.body.idle, ...SHOTGUN_PRODUCTION_ART.body.run];

describe('WS14-C Shotgun hold / aim alignment', () => {
  it('derives the grip from the canonical hero socket instead of inventing a second runtime offset', () => {
    const { width, height } = SHOTGUN_ART_CONTRACT.canvas;
    const { originX, originY, scale } = SHOTGUN_ART_CONTRACT.render;
    const { offsetX, offsetY } = SHOTGUN_ART_CONTRACT.gripSocket;
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.x).toBeCloseTo((width * originX) + (offsetX / scale), 6);
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.y).toBeCloseTo((height * originY) + (offsetY / scale), 6);
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.left.x).toBeCloseTo(width - SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.x, 6);
  });

  it('keeps the authored hand marker within sub-pixel distance of the canonical right-facing grip', () => {
    expect(Math.abs(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker.x - SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.x)).toBeLessThan(0.3);
    expect(Math.abs(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker.y - SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.y)).toBeLessThan(0.3);
    expect(SHOTGUN_PRODUCTION_ART.body.authoredGripMarker).toEqual(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker);
  });

  it('keeps every approved idle/run wrapper body-only on the canonical canvas', () => {
    for (const path of bodyPaths) {
      const svg = read(path);
      expect(svg).toContain('width="128" height="148" viewBox="0 0 128 148"');
      expect(svg).toContain('data-source="approved-wrecker-raster"');
      expect(svg).toContain('id="shotgun-body"');
      expect(svg).toMatch(/<image\b/i);
      expect(svg).not.toMatch(/shotgun-weapon|muzzle-marker/i);
    }
  });

  it('places the measured weapon so its grip lands exactly on the body grip and derives muzzle vector from asset markers', () => {
    const placement = getShotgunWeaponPlacement('right');
    expect(placement.weaponTopLeft.x + SHOTGUN_PRODUCTION_ART.weapon.grip.x).toBeCloseTo(placement.grip.x, 8);
    expect(placement.weaponTopLeft.y + SHOTGUN_PRODUCTION_ART.weapon.grip.y).toBeCloseTo(placement.grip.y, 8);
    expect(SHOTGUN_AIM_ALIGNMENT.weaponOrigin).toEqual({ x: 18 / 96, y: 22 / 40 });
    expect(SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip).toEqual({ x: 72, y: -5 });
  });

  it('mirrors the hold point symmetrically for left aim and remains non-playable', () => {
    const right = getShotgunWeaponPlacement('right');
    const left = getShotgunWeaponPlacement('left');
    expect(left.grip.x).toBeCloseTo(SHOTGUN_ART_CONTRACT.canvas.width - right.grip.x, 8);
    expect(left.grip.y).toBeCloseTo(right.grip.y, 8);
    expect(SHOTGUN_AIM_ALIGNMENT.activation.playableOnMain).toBe(false);
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'locked', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
  });
});

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
const bodyPaths = [...SHOTGUN_PRODUCTION_ART.body.idle];

describe('WS14-C Shotgun two-hand hold alignment', () => {
  it('derives both hold contacts from authored visible hand markers with no duplicate runtime socket', () => {
    expect(SHOTGUN_ART_CONTRACT).not.toHaveProperty('gripSocket');
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.right).toEqual({ x: 70, y: 75 });
    expect(SHOTGUN_AIM_ALIGNMENT.bodySupport.right).toEqual({ x: 93, y: 72 });
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.left).toEqual({ x: 58, y: 75 });
    expect(SHOTGUN_AIM_ALIGNMENT.bodySupport.left).toEqual({ x: 35, y: 72 });
  });

  it('locks the real hand contact vector to the fixed weapon grip/support vector', () => {
    expect(SHOTGUN_PRODUCTION_ART.body.authoredGripMarker).toEqual({ x: 70, y: 75 });
    expect(SHOTGUN_PRODUCTION_ART.body.authoredSupportMarker).toEqual({ x: 93, y: 72 });
    expect(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker).toEqual(SHOTGUN_PRODUCTION_ART.body.authoredGripMarker);
    expect(SHOTGUN_AIM_ALIGNMENT.authoredSupportMarker).toEqual(SHOTGUN_PRODUCTION_ART.body.authoredSupportMarker);
    expect(SHOTGUN_AIM_ALIGNMENT.authoredHoldVector).toEqual({ x: 23, y: -3 });
    expect(SHOTGUN_AIM_ALIGNMENT.supportFromGrip).toEqual({ x: 23, y: -3 });
    expect(SHOTGUN_AIM_ALIGNMENT.markerLockErrorPx).toBe(0);
    expect(SHOTGUN_AIM_ALIGNMENT.hold).toMatchObject({
      mode: 'two-hand-fixed',
      rotationRadians: 0,
      runtimeRotation: false,
      bodyRotationRadians: 0,
      runtimeBodyRotation: false,
      contactSource: 'authored-visible-hands'
    });
  });

  it('keeps every authored body wrapper body-only on the canonical canvas', () => {
    for (const path of bodyPaths) {
      const svg = read(path);
      expect(svg).toContain('width="128" height="148" viewBox="0 0 128 148"');
      expect(svg).toContain('data-source="approved-wrecker-raster"');
      expect(svg).toContain('id="shotgun-body"');
      expect(svg).toMatch(/<image\b/i);
      expect(svg).not.toMatch(/shotgun-weapon|muzzle-marker/i);
    }
  });

  it('maps both weapon contacts onto the visible hand markers with sub-pixel error and no rotation', () => {
    for (const facing of ['right', 'left'] as const) {
      const placement = getShotgunWeaponPlacement(facing);
      expect(placement.weaponTopLeft.x + SHOTGUN_PRODUCTION_ART.weapon.grip.x).toBeCloseTo(placement.grip.x, 8);
      expect(placement.weaponTopLeft.y + SHOTGUN_PRODUCTION_ART.weapon.grip.y).toBeCloseTo(placement.grip.y, 8);
      expect(placement.supportError).toBeLessThan(SHOTGUN_AIM_ALIGNMENT.hold.supportTolerancePx);
      expect(placement.rotationRadians).toBe(0);
      expect(placement.flipX).toBe(facing === 'left');
    }
    expect(SHOTGUN_AIM_ALIGNMENT.weaponOrigin).toEqual({ x: 18 / 96, y: 22 / 40 });
    expect(SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip).toEqual({ x: 72, y: -5 });
  });

  it('mirrors both hand sockets symmetrically and remains non-playable', () => {
    const right = getShotgunWeaponPlacement('right');
    const left = getShotgunWeaponPlacement('left');
    expect(left.grip.x).toBeCloseTo(SHOTGUN_ART_CONTRACT.canvas.width - right.grip.x, 8);
    expect(left.grip.y).toBeCloseTo(right.grip.y, 8);
    expect(left.support.x).toBeCloseTo(SHOTGUN_ART_CONTRACT.canvas.width - right.support.x, 8);
    expect(left.support.y).toBeCloseTo(right.support.y, 8);
    expect(SHOTGUN_AIM_ALIGNMENT.activation.playableOnMain).toBe(false);
    expect(getCharacterEntry('shotgun')).toMatchObject({ availability: 'locked', definition: { id: 'shotgun' } });
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
  });
});

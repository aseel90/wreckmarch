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
  it('keeps the authored Wrecker palm socket owned by the art contract', () => {
    const { width, height } = SHOTGUN_ART_CONTRACT.canvas;
    const { originX, originY, scale } = SHOTGUN_ART_CONTRACT.render;
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.right).toEqual({ x: 70, y: 75 });
    expect(SHOTGUN_ART_CONTRACT.gripSocket.offsetX).toBeCloseTo((70 - (width * originX)) * scale, 8);
    expect(SHOTGUN_ART_CONTRACT.gripSocket.offsetY).toBeCloseTo((75 - (height * originY)) * scale, 8);
    expect(SHOTGUN_AIM_ALIGNMENT.bodyGrip.left.x).toBeCloseTo(width - 70, 8);
    expect(SHOTGUN_AIM_ALIGNMENT).not.toHaveProperty('gripOffset');
  });

  it('pins both authored hand markers to the fixed weapon grip/support pair', () => {
    expect(Math.abs(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker.x - SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.x)).toBeLessThan(0.3);
    expect(Math.abs(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker.y - SHOTGUN_AIM_ALIGNMENT.bodyGrip.right.y)).toBeLessThan(0.3);
    expect(SHOTGUN_PRODUCTION_ART.body.authoredGripMarker).toEqual(SHOTGUN_AIM_ALIGNMENT.authoredGripMarker);
    expect(SHOTGUN_PRODUCTION_ART.body.authoredSupportMarker).toEqual({ x: 103, y: 78 });
    expect(SHOTGUN_PRODUCTION_ART.body.authoredSupportMarker).toEqual(SHOTGUN_AIM_ALIGNMENT.authoredSupportMarker);
    expect(SHOTGUN_AIM_ALIGNMENT.supportFromGrip).toEqual({ x: 33, y: 3 });
    expect(SHOTGUN_AIM_ALIGNMENT.hold).toMatchObject({
      mode: 'two-hand-fixed',
      rotationRadians: 0,
      runtimeRotation: false,
      bodyRotationRadians: 0,
      runtimeBodyRotation: false
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

  it('maps both weapon hand points onto the body with sub-pixel error and no rotation', () => {
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

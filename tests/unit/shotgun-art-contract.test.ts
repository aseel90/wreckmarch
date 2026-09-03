import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { RUNNER_CHARACTER } from '../../src/characters/definitions/runner.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS14-C Shotgun production art contract', () => {
  it('freezes the exact measured production canvas and body alignment', () => {
    expect(SHOTGUN_ART_CONTRACT.canvas).toEqual({ width: 128, height: 148 });
    expect(SHOTGUN_ART_CONTRACT.body).toEqual({ maxWidth: 104, maxHeight: 132, footLineY: 140 });
    expect(SHOTGUN_ART_CONTRACT.baseAnimationFrames).toEqual({ idle: 2, run: 3 });
  });

  it('matches the live Runner render origin, scale, and grip socket instead of inventing new geometry', () => {
    expect(SHOTGUN_ART_CONTRACT.render).toEqual({
      originX: RUNNER_CHARACTER.render.originX,
      originY: RUNNER_CHARACTER.render.originY,
      scale: RUNNER_CHARACTER.render.scale
    });
    expect(SHOTGUN_ART_CONTRACT.gripSocket).toEqual({
      offsetX: RUNNER_CHARACTER.weapon.socketOffsetX,
      offsetY: RUNNER_CHARACTER.weapon.socketOffsetY
    });
    expect(SHOTGUN_ART_CONTRACT.facing).toEqual({
      leftAimIndexMin: RUNNER_CHARACTER.weapon.leftFacingMinIndex,
      leftAimIndexMax: RUNNER_CHARACTER.weapon.leftFacingMaxIndex
    });
  });

  it('remains an art gate only and cannot silently activate the character', () => {
    expect(SHOTGUN_ART_CONTRACT.weaponLayer.separateFromBody).toBe(true);
    expect(SHOTGUN_ART_CONTRACT.activation.playableOnMain).toBe(false);

    const registry = read('src/characters/character-registry.js');
    expect(registry).not.toContain('SHOTGUN_ART_CONTRACT');
    expect(registry).not.toMatch(/shotgun/i);
  });

  it('is pinned to the same normalization geometry used by current production Runner art', () => {
    const locomotion = read('src/characters/runner-locomotion-art.js');
    expect(locomotion).toContain('const maxBodyW = 104');
    expect(locomotion).toContain('const maxBodyH = 132');
    expect(locomotion).toContain('const drawX = Math.round((128 - drawW) / 2)');
    expect(locomotion).toContain('const drawY = 140 - drawH');
    expect(locomotion).toContain('scene.textures.createCanvas(targetKey, 128, 148)');
  });
});

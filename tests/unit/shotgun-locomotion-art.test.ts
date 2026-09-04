import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';
import { listShotgunLocomotionData } from '../../src/characters/shotgun-locomotion-art.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Wrecker locomotion raster runtime', () => {
  it('uses all seven canonical body frames and each wrapper contains an exact 128x148 PNG', () => {
    const frames = listShotgunLocomotionData();
    expect(frames).toHaveLength(7);
    expect(frames.map(frame => frame.key)).toEqual([
      ...SHOTGUN_RUNTIME_PRESENTATION.body.idle.map(frame => frame.key),
      ...SHOTGUN_RUNTIME_PRESENTATION.body.run.map(frame => frame.key)
    ]);
    for (const frame of frames) {
      const match = read(frame.path).match(/href=["']data:image\/png;base64,([^"']+)["']/i);
      expect(match?.[1]).toBeTruthy();
      const bytes = Buffer.from(match![1], 'base64');
      expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
      expect(bytes.readUInt32BE(16)).toBe(128);
      expect(bytes.readUInt32BE(20)).toBe(148);
    }
  });

  it('mirrors Runner raster decoding and keeps SVG decoding out of the live body path', () => {
    const source = read('src/characters/shotgun-locomotion-art.js');
    const presenter = read('src/characters/shotgun-production-presentation.js');
    expect(source).toContain('data:image/png;base64,');
    expect(source).toContain('scene.textures.createCanvas');
    expect(source).toContain('scene.load.text');
    expect(source).not.toContain('scene.load.svg');
    expect(presenter).toContain('loadShotgunLocomotionArt(scene)');
    expect(presenter).not.toContain('queueShotgunRuntimeAssets(scene');
    expect(presenter).not.toContain('fetch(');
  });
});

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const bodyPaths = [
  ...SHOTGUN_PRODUCTION_ART.body.idle,
  ...SHOTGUN_PRODUCTION_ART.body.run
];

describe('WS14-C Shotgun production art assets', () => {
  it('ships exactly the approved two idle and three run body frames', () => {
    expect(SHOTGUN_PRODUCTION_ART.body.idle).toHaveLength(2);
    expect(SHOTGUN_PRODUCTION_ART.body.run).toHaveLength(3);
    expect(bodyPaths).toHaveLength(5);
  });

  it('pins every body SVG to the exact 128x148 canvas and Y=140 foot line', () => {
    for (const path of bodyPaths) {
      const svg = read(path);
      expect(svg).toContain('width="128" height="148" viewBox="0 0 128 148"');
      expect(svg).toContain('data-canvas="128x148"');
      expect(svg).toContain('data-foot-line-y="140"');
      expect(svg).toContain('id="shotgun-body"');
      expect(svg).not.toMatch(/shotgun-weapon|muzzle-marker|grip-marker/);
      expect(svg).not.toMatch(/<image\b/i);
    }
    expect(SHOTGUN_PRODUCTION_ART.body.canvas).toBe(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_PRODUCTION_ART.body.footLineY).toBe(140);
  });

  it('keeps the shotgun as a separate measured vector asset', () => {
    const svg = read(SHOTGUN_PRODUCTION_ART.weapon.path);
    expect(svg).toContain('width="96" height="40" viewBox="0 0 96 40"');
    expect(svg).toContain('id="shotgun-weapon"');
    expect(svg).toContain('data-grip-x="18" data-grip-y="22"');
    expect(svg).toContain('data-muzzle-x="90" data-muzzle-y="17"');
    expect(SHOTGUN_PRODUCTION_ART.weapon.grip).toEqual({ x: 18, y: 22 });
    expect(SHOTGUN_PRODUCTION_ART.weapon.muzzle).toEqual({ x: 90, y: 17 });
  });

  it('does not activate or register Shotgun on main runtime paths', () => {
    expect(SHOTGUN_PRODUCTION_ART.status).toBe('art-only');
    expect(SHOTGUN_PRODUCTION_ART.activation.playableOnMain).toBe(false);
    const registry = read('src/characters/character-registry.js');
    const html = read('index.html');
    expect(registry).not.toMatch(/shotgun/i);
    expect(html).not.toContain('shotgun-production-art');
  });
});

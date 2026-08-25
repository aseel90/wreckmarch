import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('production Scrap Rat visuals', () => {
  it('ships the approved 12-frame sprite sheet as local chunked runtime data', () => {
    const asset = read('src/enemies/scrap-rat-asset.js');
    const chunks = Array.from({ length: 8 }, (_, i) => read(`src/enemies/assets/scrap-rat-sheet-${i}.js`));
    expect(asset).toContain('SCRAP_RAT_FRAME_SIZE = 128');
    expect(asset).toContain('SCRAP_RAT_FRAME_COUNT = 12');
    expect(asset).toContain('data:image/webp;base64,');
    expect(chunks.every(chunk => chunk.length > 10_000)).toBe(true);
    expect(chunks.reduce((sum, chunk) => sum + chunk.length, 0)).toBeGreaterThan(90_000);
  });

  it('defines production idle, run, hit and death frame groups', () => {
    const visuals = read('src/enemies/scrap-rat-visuals.js');
    expect(visuals).toContain('idle: Object.freeze([0, 1])');
    expect(visuals).toContain('run: Object.freeze([2, 3, 4, 5])');
    expect(visuals).toContain('hit: Object.freeze([6, 7])');
    expect(visuals).toContain('death: Object.freeze([8, 9, 10, 11])');
    expect(visuals).toContain("__scrapRatVisualVersion = 'production-v1'");
  });

  it('retires the old rat SVG renderer and keeps the production wrapper outermost', () => {
    const art = read('src/art-runtime.js');
    const visuals = read('src/enemies/scrap-rat-visuals.js');
    expect(art).not.toContain('function ratSvg');
    expect(art).not.toContain("'art-rat-run-0'");
    expect(art).toContain('await installScrapRatVisuals(scene)');
    expect(visuals).toContain('__scrapRatVisualWrapper');
  });

  it('reapplies production Rat visuals after Phase C in the boot chain', () => {
    const html = read('index.html');
    const art = html.indexOf('./src/art-runtime.js?v=3');
    const phaseC = html.indexOf('await phaseC.applyPhaseC()');
    const lock = html.indexOf('Production Scrap Rat locked after Phase C');
    expect(art).toBeGreaterThan(-1);
    expect(phaseC).toBeGreaterThan(art);
    expect(lock).toBeGreaterThan(phaseC);
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('production Scrap Rat visuals', () => {
  it('ships two cleaned baked run master frames', () => {
    const asset = read('src/enemies/scrap-rat-asset.js');
    const masters = [0, 1].map(i => read(`src/enemies/assets/scrap-rat-run-master-${i}.js`));
    expect(asset).toContain('SCRAP_RAT_RUN_FRAME_COUNT = 2');
    expect(asset).toContain('SCRAP_RAT_RUN_MASTER_DATA');
    expect(asset).toContain('scrap-rat-run-master-0.js?v=2');
    expect(asset).toContain('scrap-rat-run-master-1.js?v=2');
    expect(asset).not.toContain('scrap-rat-run-master-2');
    expect(asset).not.toContain('scrap-rat-run-master-3');
    expect(masters.every(frame => frame.includes('data:image/webp;base64,'))).toBe(true);
    expect(masters.every(frame => frame.length > 4_500)).toBe(true);
  });

  it('uses the complete two-pose master for normal running', () => {
    const visuals = read('src/enemies/scrap-rat-visuals.js');
    expect(visuals).toContain('scrap-rat-run-master-');
    expect(visuals).toContain('replaceTextureAnimation(scene, SCRAP_RAT_VISUAL.animations.run, RUN_TEXTURES, 8, -1)');
    expect(visuals).toContain("__scrapRatVisualVersion = 'production-v6'");
    expect(visuals).toContain('__scrapRatStaticMaster = true');
  });

  it('does not recolor, normalize or rebuild Rat pixels at runtime', () => {
    const visuals = read('src/enemies/scrap-rat-visuals.js');
    for (const forbidden of ['normalizeRunPalette','installStableRunTextures','createCanvas','getImageData','putImageData','scrap-rat-run-stable-','scaleY: baseScale']) expect(visuals).not.toContain(forbidden);
    expect(visuals).toContain('scene.load.image(key, uri)');
    expect(visuals).toContain('scene.textures.remove(key)');
  });

  it('retires the old rat SVG renderer and keeps the production wrapper outermost', () => {
    const art = read('src/art-runtime.js');
    const visuals = read('src/enemies/scrap-rat-visuals.js');
    expect(art).not.toContain('function ratSvg');
    expect(art).not.toContain("'art-rat-run-0'");
    expect(art).toContain("./enemies/scrap-rat-visuals.js?v=4");
    expect(art).toContain('await installScrapRatVisuals(scene)');
    expect(visuals).toContain('__scrapRatVisualWrapper');
  });

  it('reapplies the clean master after the final legacy runtime phase', () => {
    const html = read('index.html');
    const art = html.search(/\.\/src\/art-runtime\.js\?v=\d+/);
    const phaseC = html.indexOf('await phaseC.applyPhaseC()');
    const phaseE1 = html.indexOf('await phaseE1.applyPhaseE1()');
    const lock = html.search(/\.\/src\/enemies\/scrap-rat-visuals\.js\?v=\d+/);
    expect(art).toBeGreaterThan(-1);
    expect(phaseC).toBeGreaterThan(art);
    expect(phaseE1).toBeGreaterThan(phaseC);
    expect(lock).toBeGreaterThan(phaseE1);
  });
});

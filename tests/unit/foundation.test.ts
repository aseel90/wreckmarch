import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('F0 production foundation', () => {
  it('keeps Phaser pinned to the current known-good engine during refactor', async () => {
    const pkg = JSON.parse(await read('package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies.phaser).toBe('3.90.0');
  });

  it('keeps the fast terrain and final road cleanup in the legacy boot chain', async () => {
    const html = await read('index.html');
    expect(html).toContain("./src/phase-e0-fast-terrain.js?v=2");
    expect(html).toContain("./src/phase-e1-runtime.js?v=3");
  });

  it('keeps legacy boot visuals covered until D1 and E1 are complete', async () => {
    const html = await read('index.html');
    const css = await read('style.css');
    expect(html).toContain('./style.css?v=10');
    expect(css).toContain('body.visual-ready #boot');
    expect(css).not.toContain('body.ready #boot');
    expect(css).toContain('body.visual-ready #game');
    const d1 = html.indexOf('await phaseD1.applyPhaseD1()');
    const e1 = html.indexOf('await phaseE1.applyPhaseE1()');
    const reveal = html.indexOf("document.body.classList.add('visual-ready')");
    expect(d1).toBeGreaterThan(-1);
    expect(e1).toBeGreaterThan(d1);
    expect(reveal).toBeGreaterThan(e1);
    expect(html).toContain("document.documentElement.dataset.wreckmarchVisualReady='current'");
  });

});

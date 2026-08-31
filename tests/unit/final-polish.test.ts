import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

describe('final presentation polish', () => {
  it('boots final polish after the production enemy visuals', () => {
    const html = read('index.html');
    const rat = html.indexOf("./src/enemies/scrap-rat-visuals.js");
    const polish = html.indexOf("./src/final-polish-runtime.js");
    expect(rat).toBeGreaterThan(-1);
    expect(polish).toBeGreaterThan(rat);
    expect(html).toContain('<small id="boot-status">');
    expect(html).toContain("document.body.classList.toggle('debug-enabled',debug)");
  });

  it('keeps the compact HUD safe-area aware and clamps touch joystick origin', () => {
    const hud = read('src/mobile-hud-polish.js');
    expect(hud).toContain('safe-area-inset-left');
    expect(hud).toContain('safe-area-inset-right');
    expect(hud).toContain('safe-area-inset-bottom');
    expect(hud).toContain('clampJoystickOrigin');
    expect(hud).toContain("wreckmarchMobileHud = 'compact-v2'");
    expect(hud).toContain("wreckmarchEndRunLayout = 'runtime-v3'");
  });

  it('adds presentation feedback without changing balance or spawn rules', () => {
    const polish = read('src/final-polish-runtime.js');
    expect(polish).toContain("const VERSION = 'presentation-v1'");
    expect(polish).toContain('scene.spawnHitFx = function');
    expect(polish).toContain('scene.showBanner = function');
    expect(polish).toContain('scene.updateHUD = function');
    expect(polish).not.toMatch(/spawnEvent\.delay|heroSpeed\s*=|fireDelay\s*=|enemy\.speed\s*=/);
  });

  it('hides diagnostics outside explicit debug mode', () => {
    const css = read('style.css');
    expect(css).toContain('#debug {');
    expect(css).toContain('display: none;');
    expect(css).toContain('body.debug-enabled #debug { display: block; }');
    expect(css).toContain('-webkit-touch-callout: none');
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const smokeSource = readFileSync('scripts/ci-smoke.mjs', 'utf8');
const mobileHudSource = readFileSync('src/mobile-hud-polish.js', 'utf8');
const indexSource = readFileSync('index.html', 'utf8');

describe('Live telemetry Results ownership', () => {
  it('drives the canonical GameShell Results screen instead of the legacy Phaser end-run overlay', () => {
    expect(smokeSource).toContain('TELEMETRY_SMOKE');
    expect(smokeSource).toContain("document.querySelector('.wm-results-screen')");
    expect(smokeSource).toContain("document.querySelector('.wm-results-report-button')");
    expect(smokeSource).toContain("before.shellScreen !== 'results'");
    expect(smokeSource).toContain("before.owner !== 'game-shell-results-v1'");
    expect(smokeSource).toContain("before.resultsState !== 'active'");
    expect(smokeSource).toContain('legacyLayoutExists');
    expect(smokeSource).not.toContain('layout?.reportBtn');
    expect(smokeSource).not.toContain('__mobileHudEndRunOwnerVersion');
  });

  it('requires the real Results report action to complete through the canonical telemetry API', () => {
    expect(smokeSource).toContain("before.label !== 'SEND REPORT'");
    expect(smokeSource).toContain('reportButton.click()');
    expect(smokeSource).toContain("telemetryState.label !== 'REPORT SENT'");
    expect(smokeSource).toContain("telemetryState.manualState !== 'sent'");
  });

  it('keeps mobile HUD presentation out of canonical end-run ownership', () => {
    expect(mobileHudSource).not.toContain('scene.endRun=');
    expect(mobileHudSource).not.toContain('__WM_END_RUN_LAYOUT__');
    expect(mobileHudSource).not.toContain('TEST UI v5');
    expect(mobileHudSource).not.toContain('RUN COMPLETE');
    expect(indexSource).toContain('mobile-hud-loader-canonical-v2.js?rev=3');
    expect(indexSource).not.toContain('mobile-hud-loader-telemetry-v1.js');
    expect(indexSource.indexOf('results-runtime.js?v=5')).toBeLessThan(indexSource.indexOf('mobile-hud-loader-canonical-v2.js?rev=3'));
  });
});

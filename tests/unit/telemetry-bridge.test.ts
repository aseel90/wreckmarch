import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const telemetryRuntime = readFileSync('src/telemetry/telemetry-runtime.js', 'utf8');
const runTelemetry = readFileSync('src/telemetry/run-telemetry.js', 'utf8');
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const indexHtml = readFileSync('index.html', 'utf8');

describe('Run Telemetry bridge', () => {
  it('installs telemetry before results and keeps Results as the canonical run-end owner', () => {
    expect(indexHtml).toContain("./src/telemetry/telemetry-runtime.js?v=16");
    expect(indexHtml).toContain("./src/ui/results-runtime.js?v=5");
    expect(indexHtml.indexOf('./src/telemetry/telemetry-runtime.js?v=16')).toBeLessThan(
      indexHtml.indexOf('./src/ui/results-runtime.js?v=5'),
    );
    expect(telemetryRuntime).toContain("./run-telemetry.js?v=7");
    expect(telemetryRuntime).toContain('Run Telemetry runtime armed');
    expect(runTelemetry).toContain('resolveCharacterIdentity(scene)');
    expect(runTelemetry).toContain('this.characterIdentity = resolveCharacterIdentity(scene)');
    expect(runTelemetry).toContain('character: { ...this.characterIdentity }');
    expect(runTelemetry).toContain('characterDownReason(this.characterIdentity)');
  });

  it('keeps remote telemetry explicit and query-gated', () => {
    expect(runTelemetry).toContain("params.get('wmTelemetry') === '1'");
    expect(runTelemetry).toContain('remote reporting ENABLED');
  });

  it('keeps the Pages live smoke graph aligned with canonical runtime/cache ownership', () => {
    expect(pagesWorkflow).toContain('src/mobile-hud-loader-canonical-v2.js');
    expect(pagesWorkflow).toContain('src/mobile-hud-polish.js?asset=canonical-hud-20260903-responsive-v2');
    expect(pagesWorkflow).toContain('src/characters/character-system.js?v=13');
    expect(pagesWorkflow).toContain('src/combat/weapon-registry.js?v=2');
    expect(pagesWorkflow).toContain('src/combat/weapon-system.js?v=8');
    expect(pagesWorkflow).toContain('src/upgrades/upgrade-scene.js?v=2');
    expect(pagesWorkflow).toContain('src/upgrades/upgrade-roll-service.js?v=2');
    expect(pagesWorkflow).toContain('src/telemetry/telemetry-runtime.js?v=16');
    expect(pagesWorkflow).toContain('src/telemetry/run-telemetry.js?v=7');
    expect(pagesWorkflow).toContain('this.characterIdentity = resolveCharacterIdentity(scene)');
    expect(pagesWorkflow).toContain('character: { ...this.characterIdentity }');
    expect(pagesWorkflow).toContain('this._resetHealthOnNextInstall=Boolean(scene?.hero)');
    expect(pagesWorkflow).toContain('projectileCount: 1');
    expect(pagesWorkflow).toContain('halfSpreadRadians: 0');
    expect(pagesWorkflow).toContain('volleyDamageMultiplier: 1');
    expect(pagesWorkflow).toContain('heroVolleyProfile()');
    expect(pagesWorkflow).toContain("weaponVolley:s.primaryWeapon?.fireProfile?.projectileCount===1");
    expect(pagesWorkflow).toContain("weaponIdentity:s.characterSystem?.weaponDefinition?.id==='rivet-gun'");
    expect(pagesWorkflow).not.toContain('src/phase-d1-runtime.js?v=23');
    expect(pagesWorkflow).toContain('src/upgrades/upgrade-offer-pool.js?v=2');
    expect(pagesWorkflow).toContain('"./upgrades/upgrade-scene.js?v=2" wm-live-phase-c1.js');
    expect(pagesWorkflow).toContain('"./upgrade-offer-pool.js?v=2" wm-live-upgrade-scene.js');
    expect(pagesWorkflow).toContain('"./upgrade-roll-service.js?v=2" wm-live-upgrade-scene.js');
    expect(pagesWorkflow).not.toContain('"./upgrades/upgrade-offer-pool.js?v=1" wm-live-phase-c1.js');
    expect(pagesWorkflow).not.toContain('"./upgrade-offer-pool.js?v=1" wm-live-upgrade-scene.js');
    expect(pagesWorkflow).toContain("class UpgradeSceneV4 extends Phaser.Scene");
    expect(pagesWorkflow).toContain("gameScene.__upgradeSceneOwner = 'src/upgrades/upgrade-scene.js'");
    expect(pagesWorkflow).toContain("offer('explosive-rivet', 'HERO'");
    expect(pagesWorkflow).toContain('upgrade-icon-explosive-rivet');
    expect(pagesWorkflow).toContain("offer('triple-riveter', 'EVOLUTION'");
    expect(pagesWorkflow).toContain('upgrade-icon-triple-riveter');
  });
});

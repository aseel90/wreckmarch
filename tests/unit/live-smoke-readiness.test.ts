import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const smokeSource = readFileSync('scripts/ci-smoke.mjs', 'utf8');
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');

describe('Live smoke readiness ownership', () => {
  it('passes interval polling options through Playwright’s third argument', () => {
    expect(smokeSource).toContain("}, undefined, { polling: 250, timeout: 70_000 });");
    expect(smokeSource).not.toContain("}, { polling: 250, timeout: 70_000 });");
    expect(smokeSource).not.toContain("{ timeout: 30_000 }");
  });

  it('records readiness timing without weakening any playability condition', () => {
    expect(smokeSource).toContain('readinessMs = Date.now() - readinessStartedAt');
    expect(smokeSource).toContain('state.readinessElapsedMs = readinessStartedAt ? Date.now() - readinessStartedAt : null');
    expect(smokeSource).toContain("scene?.__finalPolishReady === true");
    expect(smokeSource).toContain("document.documentElement.dataset.wreckmarchE1SelfTest === 'passed'");
    expect(smokeSource).toContain("document.documentElement.dataset.wreckmarchMobileHud === 'compact-v5-test'");
  });

  it('selects activated Wrecker through the normal Character Select path on live Pages', () => {
    expect(smokeSource).toContain('const SMOKE_CHARACTER = process.env.WM_SMOKE_CHARACTER || null');
    expect(smokeSource).toContain('page.locator(`[data-character-id="${SMOKE_CHARACTER}"]`)');
    expect(smokeSource).toContain("availability !== 'selectable'");
    expect(smokeSource).toContain('await characterButton.click()');
    expect(smokeSource).toContain('state.selectedCharacter !== SMOKE_CHARACTER || state.sceneCharacter !== SMOKE_CHARACTER');
    expect(smokeSource).toContain("state.activeWeaponId !== 'shotgun'");
    expect(smokeSource).toContain('state.heroHp !== 110 || state.heroMaxHp !== 110');
    expect(pagesWorkflow).toContain('WM_SMOKE_CHARACTER: shotgun');
    expect(pagesWorkflow).toContain('?debug=1&wmTelemetry=1&build=${{ github.sha }}');
    expect(pagesWorkflow).not.toContain('?autotest=1&debug=1&wmTelemetry=1&build=${{ github.sha }}');
  });

  it('tracks the canonical upgrade offer pool cache version in the deployed asset graph', () => {
    expect(pagesWorkflow).toContain('src/upgrades/upgrade-offer-pool.js?v=2');
    expect(pagesWorkflow).toContain('grep -F "./upgrade-offer-pool.js?v=2" wm-live-upgrade-scene.js');
    expect(pagesWorkflow).not.toContain('grep -F "./upgrade-offer-pool.js?v=1" wm-live-upgrade-scene.js');
  });
});

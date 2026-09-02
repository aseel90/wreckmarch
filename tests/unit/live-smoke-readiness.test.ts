import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const smokeSource = readFileSync('scripts/ci-smoke.mjs', 'utf8');

describe('Live smoke readiness ownership', () => {
  it('uses interval polling with a bounded slow-renderer budget', () => {
    expect(smokeSource).toContain("{ polling: 250, timeout: 45_000 }");
    expect(smokeSource).not.toContain("{ timeout: 30_000 }");
  });

  it('records readiness timing without weakening any playability condition', () => {
    expect(smokeSource).toContain('readinessMs = Date.now() - readinessStartedAt');
    expect(smokeSource).toContain('state.readinessElapsedMs = readinessStartedAt ? Date.now() - readinessStartedAt : null');
    expect(smokeSource).toContain("scene?.__finalPolishReady === true");
    expect(smokeSource).toContain("document.documentElement.dataset.wreckmarchE1SelfTest === 'passed'");
    expect(smokeSource).toContain("document.documentElement.dataset.wreckmarchMobileHud === 'compact-v5-test'");
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const smoke = fs.readFileSync(new URL('../../scripts/ci-smoke.mjs', import.meta.url), 'utf8');

describe('CI smoke E1 persistence ownership', () => {
  it('does not block boot readiness on the runtime 12s autotest flag', () => {
    const waitBlock = smoke.slice(smoke.indexOf('await page.waitForFunction'), smoke.indexOf('const readE1RoadState'));
    expect(waitBlock).toContain("document.documentElement.dataset.wreckmarchE1SelfTest === 'passed'");
    expect(waitBlock).not.toContain('wreckmarchE1Persistence');
  });

  it('owns persistence by sampling canonical E1 roads twice with real Playwright time', () => {
    expect(smoke).toContain('const e1PersistenceBefore = await readE1RoadState()');
    expect(smoke).toContain('await page.waitForTimeout(2_000)');
    expect(smoke).toContain('const e1PersistenceAfter = await readE1RoadState()');
    expect(smoke).toContain('e1PersistenceAfter.roads !== e1PersistenceBefore.roads');
    expect(smoke).toContain('state.visible === state.roads');
    expect(smoke).toContain('state.legacyVisible === 0');
    expect(smoke).toContain('state.roadDepth > state.groundDepth');
  });
});

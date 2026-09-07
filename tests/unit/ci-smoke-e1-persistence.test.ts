import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const smoke = fs.readFileSync(new URL('../../scripts/ci-smoke.mjs', import.meta.url), 'utf8');

describe('CI smoke E1 persistence ownership', () => {
  it('does not block normal live readiness on the autotest-only E1 self-test marker', () => {
    const waitBlock = smoke.slice(smoke.indexOf('await page.waitForFunction'), smoke.indexOf('const readE1RoadState'));
    expect(waitBlock).toContain("document.documentElement.dataset.wreckmarchPhaseE1 === 'active'");
    expect(waitBlock).not.toContain("document.documentElement.dataset.wreckmarchE1SelfTest === 'passed'");
    expect(waitBlock).not.toContain('wreckmarchE1Persistence');
  });

  it('owns persistence by sampling canonical streamed terrain twice with real Playwright time', () => {
    expect(smoke).toContain('const e1PersistenceBefore = await readE1RoadState()');
    expect(smoke).toContain('await page.waitForTimeout(2_000)');
    expect(smoke).toContain('const e1PersistenceAfter = await readE1RoadState()');
    expect(smoke).toContain('scene?.worldSectorTerrain?.getDiagnostics?.()');
    expect(smoke).toContain('state.visible === state.roads');
    expect(smoke).toContain('state.legacyVisible === 0');
    expect(smoke).toContain('state.activeSectors <= 9');
    expect(smoke).toContain('state.totalSectors === 64');
    expect(smoke).toContain('state.activeObjects <= 100');
    expect(smoke).toContain('state.fullMapTerrainAllocated === false');
    expect(smoke).toContain('state.worldWidth === 9600');
    expect(smoke).toContain('state.cameraWidth === 9600');
    expect(smoke).toContain('state.roadDepth > state.groundDepth');
  });
});

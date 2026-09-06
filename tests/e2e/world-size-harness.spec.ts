import { expect, test } from '@playwright/test';

const candidates = [
  { size: 7200, worldId: 'candidate-7200-v1', totalSectorCount: 36 },
  { size: 9600, worldId: 'candidate-9600-v1', totalSectorCount: 64 },
  { size: 12000, worldId: 'candidate-12000-v1', totalSectorCount: 100 }
] as const;

for (const candidate of candidates) {
  test(`R2 ${candidate.size} candidate uses bounded streamed terrain across the whole world`, async ({ page }) => {
    await page.goto(`/?debug=1&autotest=1&wmWorldHarness=1&wmWorld=${candidate.size}`);
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await expect.poll(
      () => page.evaluate(() => document.body.classList.contains('visual-ready')),
      { timeout: 20_000 }
    ).toBe(true);

    const initial = await page.evaluate(() => {
      const api = (window as any).__WM_WORLD_HARNESS__;
      return {
        diagnostics: api?.diagnostics?.(),
        datasetSize: document.documentElement.dataset.wreckmarchWorldSize,
        datasetHarness: document.documentElement.dataset.wreckmarchWorldHarness,
        sectorMode: (window as any).__WM_WORLD_SECTORS__?.mode
      };
    });

    expect(initial.sectorMode).toBe('candidate-harness');
    expect(initial.datasetSize).toBe(String(candidate.size));
    expect(initial.datasetHarness).toBe('r2-size-harness-v1');
    expect(initial.diagnostics).toMatchObject({
      harness: {
        active: true,
        worldId: candidate.worldId,
        width: candidate.size,
        height: candidate.size
      },
      physicsBounds: { width: candidate.size, height: candidate.size },
      sectors: { activeSectorCount: 9, totalSectorCount: candidate.totalSectorCount },
      terrain: { activeSectorCount: 9, fullMapTerrainAllocated: false }
    });
    expect(initial.diagnostics.terrain.activeObjectCount).toBeLessThanOrEqual(100);
    expect(initial.diagnostics.terrain.peakActiveObjects).toBeLessThanOrEqual(100);

    const edge = candidate.size - 50;
    const moved = await page.evaluate(
      ({ x, y }) => (window as any).__WM_WORLD_HARNESS__.teleport(x, y),
      { x: edge, y: edge }
    );

    expect(moved.hero.x).toBeGreaterThan(candidate.size - 100);
    expect(moved.hero.y).toBeGreaterThan(candidate.size - 100);
    expect(moved.sectors.activeSectorCount).toBe(4);
    expect(moved.terrain.activeSectorCount).toBe(4);
    expect(moved.terrain.destroyedObjects).toBeGreaterThan(0);
    expect(moved.terrain.peakActiveObjects).toBeLessThanOrEqual(100);
    expect(moved.terrain.fullMapTerrainAllocated).toBe(false);
  });
}

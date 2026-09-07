import { expect, test } from '@playwright/test';

const CANDIDATES = [
  { size: 7200, worldId: 'candidate-7200-v1', totalSectorCount: 36 },
  { size: 9600, worldId: 'candidate-9600-v1', totalSectorCount: 64 },
  { size: 12000, worldId: 'candidate-12000-v1', totalSectorCount: 100 }
] as const;

for (const candidate of CANDIDATES) {
  test(`R2 ${candidate.size} candidate traverses the full world with bounded streamed terrain`, async ({ page }) => {
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
      cameraBounds: { width: candidate.size, height: candidate.size },
      sectors: { activeSectorCount: 9, totalSectorCount: candidate.totalSectorCount },
      terrain: { activeSectorCount: 9, fullMapTerrainAllocated: false }
    });
    expect(initial.diagnostics.terrain.activeObjectCount).toBeLessThanOrEqual(100);
    expect(initial.diagnostics.terrain.peakActiveObjects).toBeLessThanOrEqual(100);

    const nearMax = candidate.size - 50;
    const farEdge = await page.evaluate(
      ({ x, y }) => (window as any).__WM_WORLD_HARNESS__.teleport(x, y),
      { x: nearMax, y: nearMax }
    );
    expect(farEdge.hero.x).toBeGreaterThan(candidate.size - 100);
    expect(farEdge.hero.y).toBeGreaterThan(candidate.size - 100);
    expect(farEdge.sectors.activeSectorCount).toBe(4);
    expect(farEdge.terrain.activeSectorCount).toBe(4);
    expect(farEdge.terrain.destroyedObjects).toBeGreaterThan(0);
    expect(farEdge.terrain.peakActiveObjects).toBeLessThanOrEqual(100);
    expect(farEdge.terrain.fullMapTerrainAllocated).toBe(false);

    const nearMin = await page.evaluate(() => (window as any).__WM_WORLD_HARNESS__.teleport(50, 50));
    expect(nearMin.hero.x).toBeLessThan(100);
    expect(nearMin.hero.y).toBeLessThan(100);
    expect(nearMin.sectors.activeSectorCount).toBe(4);
    expect(nearMin.terrain.activeSectorCount).toBe(4);
    expect(nearMin.terrain.deactivationCount).toBeGreaterThan(farEdge.terrain.deactivationCount);
    expect(nearMin.terrain.peakActiveObjects).toBeLessThanOrEqual(100);

    const center = candidate.size / 2;
    const returnedToCenter = await page.evaluate(
      ({ x, y }) => (window as any).__WM_WORLD_HARNESS__.teleport(x, y),
      { x: center, y: center }
    );
    expect(returnedToCenter.sectors.activeSectorCount).toBe(9);
    expect(returnedToCenter.terrain.activeSectorCount).toBe(9);
    expect(returnedToCenter.terrain.activeObjectCount).toBeLessThanOrEqual(100);
    expect(returnedToCenter.terrain.peakActiveObjects).toBeLessThanOrEqual(100);
    expect(returnedToCenter.terrain.createdObjects - returnedToCenter.terrain.destroyedObjects)
      .toBe(returnedToCenter.terrain.activeObjectCount);
    expect(returnedToCenter.terrain.fullMapTerrainAllocated).toBe(false);
  });
}

test('R2 candidate travel does not trip the legacy E1 12s persistence assertion', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await page.goto('/?debug=1&autotest=1&wmWorldHarness=1&wmWorld=9600');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  await page.evaluate(() => (window as any).__WM_WORLD_HARNESS__.teleport(9200, 4800));
  await page.waitForTimeout(12_500);

  expect(await page.evaluate(() => document.documentElement.dataset.wreckmarchE1Persistence))
    .toBe('candidate-skipped');
  expect(pageErrors.filter(message => message.includes('Phase E.1 persistence failed'))).toEqual([]);
});

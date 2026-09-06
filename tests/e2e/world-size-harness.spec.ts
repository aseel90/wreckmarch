import { expect, test } from '@playwright/test';

test('R2 9600 candidate uses bounded streamed terrain while physics/camera use the candidate world', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1&wmWorldHarness=1&wmWorld=9600');
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
  expect(initial.datasetSize).toBe('9600');
  expect(initial.datasetHarness).toBe('r2-size-harness-v1');
  expect(initial.diagnostics).toMatchObject({
    harness: { active: true, worldId: 'candidate-9600-v1', width: 9600, height: 9600 },
    physicsBounds: { width: 9600, height: 9600 },
    sectors: { activeSectorCount: 9, totalSectorCount: 64 },
    terrain: { activeSectorCount: 9, fullMapTerrainAllocated: false }
  });
  expect(initial.diagnostics.terrain.activeObjectCount).toBeLessThanOrEqual(100);
  expect(initial.diagnostics.terrain.peakActiveObjects).toBeLessThanOrEqual(100);

  const moved = await page.evaluate(() => (window as any).__WM_WORLD_HARNESS__.teleport(9550, 9550));
  expect(moved.hero.x).toBeGreaterThan(9500);
  expect(moved.hero.y).toBeGreaterThan(9500);
  expect(moved.sectors.activeSectorCount).toBe(4);
  expect(moved.terrain.activeSectorCount).toBe(4);
  expect(moved.terrain.destroyedObjects).toBeGreaterThan(0);
  expect(moved.terrain.peakActiveObjects).toBeLessThanOrEqual(100);
  expect(moved.terrain.fullMapTerrainAllocated).toBe(false);
});

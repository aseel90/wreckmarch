import { expect, test } from '@playwright/test';

test('R2 selected 9600 production world runs on bounded sector streaming', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const sectors = (window as any).__WM_WORLD_SECTORS__;
    const physicsBounds = scene?.physics?.world?.bounds;
    const cameraBounds = scene?.cameras?.main?._bounds;
    const terrain = sectors?.terrainDiagnostics?.();
    const fullMapTerrainObjects = scene?.children?.list?.filter((object: any) => (
      object?.__terrainSystemObject
      && (Number(object?.displayWidth || object?.width || 0) >= 9000 || Number(object?.displayHeight || object?.height || 0) >= 9000)
    )).length || 0;
    return {
      sectors: sectors ? {
        active: sectors.active,
        contractVersion: sectors.contractVersion,
        mode: sectors.mode,
        worldId: sectors.worldId,
        diagnostics: sectors.diagnostics?.(),
        terrain
      } : null,
      sceneReady: scene?.__worldSectorFoundationReady,
      physicsBounds: physicsBounds ? { width: physicsBounds.width, height: physicsBounds.height } : null,
      cameraBounds: cameraBounds ? { width: cameraBounds.width, height: cameraBounds.height } : null,
      dataset: document.documentElement.dataset.wreckmarchWorldSectors,
      datasetSize: document.documentElement.dataset.wreckmarchWorldSize,
      datasetHarness: document.documentElement.dataset.wreckmarchWorldHarness,
      harnessApiPresent: Boolean((window as any).__WM_WORLD_HARNESS__),
      fullMapTerrainObjects
    };
  });

  expect(state.sectors).toMatchObject({
    active: true,
    contractVersion: 'r2-v1',
    mode: 'production-streaming',
    worldId: 'production-9600-v1',
    diagnostics: {
      contractVersion: 'r2-v1',
      worldId: 'production-9600-v1',
      activeSectorCount: 9,
      totalSectorCount: 64
    },
    terrain: {
      owner: 'r2-world-sector-terrain',
      worldId: 'production-9600-v1',
      activeSectorCount: 9,
      fullMapTerrainAllocated: false
    }
  });
  expect(state.sectors?.terrain?.activeObjectCount).toBeGreaterThan(0);
  expect(state.sectors?.terrain?.activeObjectCount).toBeLessThanOrEqual(100);
  expect(state.sectors?.terrain?.peakActiveObjects).toBeLessThanOrEqual(100);
  expect(state.sectors?.terrain?.activeRoadObjectCount).toBeGreaterThan(0);
  expect(state.sectors?.terrain?.visibleRoadObjectCount).toBe(state.sectors?.terrain?.activeRoadObjectCount);
  expect(state.sceneReady).toBe(true);
  expect(state.physicsBounds).toEqual({ width: 9600, height: 9600 });
  expect(state.cameraBounds).toEqual({ width: 9600, height: 9600 });
  expect(state.dataset).toBe('r2-v1');
  expect(state.datasetSize).toBe('9600');
  expect(state.datasetHarness).toBe('off');
  expect(state.harnessApiPresent).toBe(false);
  expect(state.fullMapTerrainObjects).toBe(0);
});

test('R2 comparison size query remains inert unless the harness flag is explicitly enabled', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1&wmWorld=12000');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return {
      sectorMode: (window as any).__WM_WORLD_SECTORS__?.mode,
      worldId: (window as any).__WM_WORLD_SECTORS__?.worldId,
      physics: {
        width: scene?.physics?.world?.bounds?.width,
        height: scene?.physics?.world?.bounds?.height
      },
      camera: {
        width: scene?.cameras?.main?._bounds?.width,
        height: scene?.cameras?.main?._bounds?.height
      },
      terrain: (window as any).__WM_WORLD_SECTORS__?.terrainDiagnostics?.(),
      datasetSize: document.documentElement.dataset.wreckmarchWorldSize,
      datasetHarness: document.documentElement.dataset.wreckmarchWorldHarness,
      harnessApiPresent: Boolean((window as any).__WM_WORLD_HARNESS__)
    };
  });

  expect(state).toMatchObject({
    sectorMode: 'production-streaming',
    worldId: 'production-9600-v1',
    physics: { width: 9600, height: 9600 },
    camera: { width: 9600, height: 9600 },
    terrain: { worldId: 'production-9600-v1', fullMapTerrainAllocated: false },
    datasetSize: '9600',
    datasetHarness: 'off',
    harnessApiPresent: false
  });
});

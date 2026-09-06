import { expect, test } from '@playwright/test';

test('R2 world-sector foundation is live without changing the 2200 production world', async ({ page }) => {
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
    return {
      sectors: sectors ? {
        active: sectors.active,
        contractVersion: sectors.contractVersion,
        mode: sectors.mode,
        worldId: sectors.worldId,
        diagnostics: sectors.diagnostics?.()
      } : null,
      sceneReady: scene?.__worldSectorFoundationReady,
      sceneDiagnostics: scene?.worldSectorDiagnostics,
      physicsBounds: physicsBounds ? { width: physicsBounds.width, height: physicsBounds.height } : null,
      dataset: document.documentElement.dataset.wreckmarchWorldSectors
    };
  });

  expect(state.sectors).toMatchObject({
    active: true,
    contractVersion: 'r2-v1',
    mode: 'logical-foundation',
    worldId: 'production-2200-v1',
    diagnostics: {
      contractVersion: 'r2-v1',
      worldId: 'production-2200-v1',
      activeSectorCount: 4,
      totalSectorCount: 4
    }
  });
  expect(state.sceneReady).toBe(true);
  expect(state.sceneDiagnostics).toMatchObject({ activeSectorCount: 4, totalSectorCount: 4 });
  expect(state.physicsBounds).toEqual({ width: 2200, height: 2200 });
  expect(state.dataset).toBe('r2-v1');
});

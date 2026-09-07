import { expect, test } from '@playwright/test';
const DISTRICTS=['scrap-fields','collapsed-highway','rust-depot','central-wreckroads','chemical-yard','burned-convoy-zone','marshal-territory'] as const;
for (const districtId of DISTRICTS) test(`R3 live-inspection hook centers ${districtId} without changing Production ownership`, async ({ page }) => {
  await page.goto(`/?debug=1&autotest=1&wmDistrictInspect=${districtId}`);
  await expect(page.locator('canvas')).toBeVisible({timeout:20000});
  await expect.poll(()=>page.evaluate(()=>Boolean((window as any).__WM_DISTRICT_INSPECT__?.active)),{timeout:20000}).toBe(true);
  const state=await page.evaluate(()=>({inspect:(window as any).__WM_DISTRICT_INSPECT__,terrain:(window as any).__WM_WORLD_SECTORS__?.terrainDiagnostics}));
  expect(state.inspect.districtId).toBe(districtId);
  expect(state.inspect.productionWorldId).toBe('production-9600-v1');
  expect(state.inspect.debugOnly).toBe(true);
  expect(state.terrain.owner).toBe('r2-world-sector-terrain');
  expect(state.terrain.fullMapTerrainAllocated).toBe(false);
  expect(state.terrain.districtMetadataFullMapAllocated).toBe(false);
  expect(state.terrain.activeDistrictIds).toContain(districtId);
  expect(state.terrain.visibleRoadObjectCount).toBe(state.terrain.activeRoadObjectCount);
  expect(state.terrain.activeObjectCount).toBeLessThanOrEqual(100);
});

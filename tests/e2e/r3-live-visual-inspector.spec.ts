import { expect, test } from '@playwright/test';
const DISTRICTS=['scrap-fields','collapsed-highway','rust-depot','central-wreckroads','chemical-yard','burned-convoy-zone','marshal-territory'] as const;
for(const districtId of DISTRICTS){
  test(`standalone R3 inspector renders ${districtId} on Production world`,async({page})=>{
    await page.goto(`/r3-inspect.html?district=${districtId}`);
    await expect(page.locator('#game')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>Boolean((window as any).__R3_INSPECT_STATE__)),{timeout:30000}).toBe(true);
    const state=await page.evaluate(()=> (window as any).__R3_INSPECT_STATE__);
    expect(state.districtId).toBe(districtId);
    expect(state.worldId).toBe('production-9600-v1');
    expect(state.terrain.owner).toBe('r2-world-sector-terrain');
    expect(state.terrain.activeDistrictIds).toContain(districtId);
    expect(state.terrain.activeSectorCount).toBeLessThanOrEqual(9);
    expect(state.terrain.activeObjectCount).toBeLessThanOrEqual(100);
    expect(state.terrain.visibleRoadObjectCount).toBe(state.terrain.activeRoadObjectCount);
    expect(state.terrain.fullMapTerrainAllocated).toBe(false);
    expect(state.terrain.districtMetadataFullMapAllocated).toBe(false);
  });
}

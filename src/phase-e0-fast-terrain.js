/* WRECKMARCH Phase E.0 — terrain texture bootstrap only; R2 owns geometry by streamed sectors. */
import { ensureTerrainTextures, getWreckmarchScene } from './world/terrain-system.js?v=3';

export async function applyFastTerrain(){
  const start=performance.now(),s=await getWreckmarchScene({timeout:5000});
  await ensureTerrainTextures(s);
  s.__e0FastTerrain=[];
  s.__e0FastRoadSegments=[];
  s.__e0FastRoadCount=0;
  s.__terrainTextureBootstrap='r2-sector-streaming';
  const ms=Math.round(performance.now()-start);
  window.__WM_PHASE_E0__=true;
  document.documentElement.dataset.wreckmarchPhaseE0='active';
  window.__WM_LOG__?.(`FAST TERRAIN textures ready in ${ms}ms; geometry deferred to R2 sector streaming`);
  return true;
}

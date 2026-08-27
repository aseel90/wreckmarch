/* WRECKMARCH Phase E.0 — fast terrain bootstrap only */
import { buildTerrainLayer, ensureTerrainTextures, getWreckmarchScene } from './world/terrain-system.js?v=2';

export async function applyFastTerrain(){
  const start=performance.now(),s=await getWreckmarchScene({timeout:5000});
  await ensureTerrainTextures(s);
  const built=buildTerrainLayer(s,{
    owner:'e0',
    terrainStore:'__e0FastTerrain',
    roadStore:'__e0FastRoadSegments',
    roadMarker:'__e0Road',
    groundDepth:.2,
    shoulderDepth:.8,
    roadDepth:.9,
    centerDepth:.95,
    samples:64,
    tileOffsetStep:37
  });
  s.__e0FastRoadCount=built.roads.length;
  const ms=Math.round(performance.now()-start);
  window.__WM_PHASE_E0__=true;
  document.documentElement.dataset.wreckmarchPhaseE0='active';
  window.__WM_LOG__?.(`FAST TERRAIN ready in ${ms}ms: roads=${s.__e0FastRoadCount||0}`);
  return true;
}

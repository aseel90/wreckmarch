/* WRECKMARCH Phase E.1 — canonical streamed-road visibility cleanup + persistence guard. */
import { getWreckmarchScene } from './world/terrain-system.js?v=3';
import { CURRENT_PRODUCTION_WORLD } from './world/world-contract.js?v=2';
import { applyFinalHotfix } from './final-hotfix-runtime.js?v=1';
import { applyCompanionV3 } from './companion-runtime-v3.js?v=1';
import { applyRunDirector } from './balance/run-director.js?v=6';
import { installRunTimelineRuntime } from './run/run-timeline-runtime.js?v=1';
import { installRustHoundVisuals } from './enemies/rust-hound-visuals.js?v=3';
import { installSawbugVisuals } from './enemies/sawbug-visuals.js?v=3';
import { installU3EliteRewards } from './rewards/u3-elite-reward-runtime.js?v=2';

function isLegacyTerrain(object) {
  if (!object || object.__worldSectorTerrainObject) return false;
  const name = String(object?.name || '');
  const texture = String(object?.texture?.key || '');
  if (name.startsWith('e0-road') || name.startsWith('c4-road') || name.startsWith('c5-road') || name.startsWith('d1-road')) return true;
  if (['e0-ground-base','c4-ground-base','c4-ground-wash','c5-ground-base','c5-ground-variation','d1-ground-base','e1-ground-base','e1-ground-wash'].includes(name)) return true;
  if (['b-ground','b1-ground','b1-road','b1-road-edge'].includes(name)) return true;
  if (['art-wasteland-ground','b1-ground-a','b1-ground-b'].includes(texture) && Number(object.depth) < 0) return true;
  if (['c4-ground','c4-road'].includes(texture) && Number(object.depth) < 0) return true;
  return false;
}

function clearLegacyTerrain(scene) {
  const doomed = [...scene.children.list].filter(isLegacyTerrain);
  doomed.forEach(object => object?.destroy?.());
  ['__e0FastTerrain','__e0FastRoadSegments','__c4Terrain','__c4RoadSegments','__c5Terrain','__c5RoadSegments','__d1Terrain','__d1RoadSegments','__e1Terrain','__e1RoadSegments']
    .forEach(key => {
      scene[key]?.forEach?.(object => object?.destroy?.());
      scene[key] = [];
    });
  return doomed.length;
}

function suppressLegacyWorldLayer(scene) {
  let hidden = 0;
  for (const object of scene.children.list) {
    if (!object || object.__worldSectorTerrainObject || String(object?.name || '').startsWith('r2-sector-')) continue;
    if (object.type === 'Graphics' && Number(object.depth) === 0) {
      object.setVisible(false);
      object.__e1SuppressedLegacy = true;
      hidden += 1;
      continue;
    }
    if (['Rectangle','Ellipse'].includes(object.type) && Number(object.depth) === 0 && (object.displayWidth || 0) <= 22 && (object.displayHeight || 0) <= 12) {
      object.setVisible(false);
      object.__e1SuppressedLegacy = true;
      hidden += 1;
    }
  }
  scene.__e1SuppressedLegacyCount = hidden;
  return hidden;
}

function roadSnapshot(scene, label) {
  const terrain = scene.worldSectorTerrain?.getDiagnostics?.() || null;
  const sectors = scene.worldSectorSystem?.getDiagnostics?.() || null;
  const legacyVisible = scene.children.list.filter(object => object?.visible && object.__e1SuppressedLegacy).length;
  const worldWidth = scene.__runtimeWorld?.width ?? null;
  const worldHeight = scene.__runtimeWorld?.height ?? null;
  const physicsWidth = scene.physics?.world?.bounds?.width ?? null;
  const physicsHeight = scene.physics?.world?.bounds?.height ?? null;
  const cameraWidth = scene.cameras?.main?._bounds?.width ?? null;
  const cameraHeight = scene.cameras?.main?._bounds?.height ?? null;
  const info = {
    label,
    roads: terrain?.activeRoadObjectCount ?? 0,
    visible: terrain?.visibleRoadObjectCount ?? 0,
    legacyVisible,
    activeSectors: terrain?.activeSectorCount ?? sectors?.activeSectorCount ?? 0,
    totalSectors: sectors?.totalSectorCount ?? 0,
    activeObjects: terrain?.activeObjectCount ?? 0,
    peakActiveObjects: terrain?.peakActiveObjects ?? 0,
    fullMapTerrainAllocated: terrain?.fullMapTerrainAllocated ?? null,
    roadDepth: terrain?.roadDepth ?? null,
    groundDepth: terrain?.groundDepth ?? null,
    worldWidth,
    worldHeight,
    physicsWidth,
    physicsHeight,
    cameraWidth,
    cameraHeight
  };
  window.__WM_E1_ROAD_WATCH__ = info;
  window.__WM_LOG__?.(`ROAD WATCH ${label}: roads=${info.roads} visible=${info.visible} sectors=${info.activeSectors}/${info.totalSectors} objects=${info.activeObjects}/${info.peakActiveObjects} fullMap=${info.fullMapTerrainAllocated} legacyVisible=${info.legacyVisible}`);

  if (label === '12s' && new URLSearchParams(location.search).get('autotest') === '1') {
    if (window.__WM_WORLD_HARNESS__?.active) {
      document.documentElement.dataset.wreckmarchE1Persistence='candidate-skipped';
      window.__WM_LOG__?.('E1 persistence test skipped at 12s for R2 candidate harness');
      return info;
    }
    const ok = info.roads > 0
      && info.visible === info.roads
      && info.legacyVisible === 0
      && info.activeSectors >= 4
      && info.activeSectors <= 9
      && info.activeObjects > 0
      && info.activeObjects <= 100
      && info.peakActiveObjects <= 100
      && info.fullMapTerrainAllocated === false
      && info.roadDepth > info.groundDepth
      && info.worldWidth === CURRENT_PRODUCTION_WORLD.width
      && info.worldHeight === CURRENT_PRODUCTION_WORLD.height
      && info.physicsWidth === CURRENT_PRODUCTION_WORLD.width
      && info.physicsHeight === CURRENT_PRODUCTION_WORLD.height
      && info.cameraWidth === CURRENT_PRODUCTION_WORLD.width
      && info.cameraHeight === CURRENT_PRODUCTION_WORLD.height;
    document.documentElement.dataset.wreckmarchE1Persistence = ok ? 'passed' : 'failed';
    window.__WM_LOG__?.(`E1 persistence test ${ok ? 'PASSED' : 'FAILED'} at 12s`);
    if (!ok) throw Error(`Phase E.1 persistence failed at 12s: ${JSON.stringify(info)}`);
  }
  return info;
}

function installRoadWatch(scene) {
  if (scene.__e1RoadWatchInstalled) return;
  scene.__e1RoadWatchInstalled = true;
  [0,500,1000,2000,3000,5000,8000,12000].forEach(ms => setTimeout(() => {
    if (scene?.sys?.isActive?.()) roadSnapshot(scene, ms === 0 ? '0s' : `${ms / 1000}s`);
  }, ms));
  const guard = () => {
    suppressLegacyWorldLayer(scene);
    scene.worldSectorTerrain?.ensureVisible?.();
    if (scene.hero) scene.worldSectorDiagnostics = scene.worldSectorSystem?.updateForPosition?.(scene.hero.x, scene.hero.y) || scene.worldSectorDiagnostics;
  };
  scene.events?.on?.('wake', guard);
  scene.events?.on?.('resume', guard);
}

function buildWorld(scene) {
  const removed = clearLegacyTerrain(scene);
  const suppressed = suppressLegacyWorldLayer(scene);
  const terrain = scene.worldSectorTerrain?.getDiagnostics?.();
  if (!scene.worldSectorSystem || !terrain || terrain.fullMapTerrainAllocated !== false || terrain.activeSectorCount < 1) {
    throw Error('Phase E.1 requires canonical R2 streamed terrain');
  }
  scene.worldSectorTerrain.ensureVisible();
  scene.__terrainSystemState = {
    owner: 'r2-world-sector-terrain',
    worldId: terrain.worldId,
    fullMapTerrainAllocated: false
  };
  scene.__e1RemovedLegacyTerrain = removed;
  scene.__e1SuppressedLegacyCount = suppressed;
  scene.__e1RoadNetwork = true;
  installRoadWatch(scene);
}

function selfTest(scene) {
  if (new URLSearchParams(location.search).get('autotest') !== '1') return;
  const terrain = scene.worldSectorTerrain?.getDiagnostics?.();
  const sectors = scene.worldSectorSystem?.getDiagnostics?.();
  const legacyCover = scene.children.list.some(object => isLegacyTerrain(object));
  const candidateHarness = window.__WM_WORLD_HARNESS__?.active === true;
  const checks = {
    streamedRoads: (terrain?.activeRoadObjectCount || 0) > 0,
    roadsVisible: terrain?.visibleRoadObjectCount === terrain?.activeRoadObjectCount,
    boundedSectors: (terrain?.activeSectorCount || 0) >= 4 && (terrain?.activeSectorCount || 0) <= 9 && (sectors?.totalSectorCount || 0) >= 36,
    noFullMapTerrain: terrain?.fullMapTerrainAllocated === false && (terrain?.activeObjectCount || 0) <= 100,
    noLegacyCover: !legacyCover,
    roadAboveGround: terrain?.roadDepth > terrain?.groundDepth,
    productionWorld: candidateHarness || (
      scene.__runtimeWorld?.width === CURRENT_PRODUCTION_WORLD.width
      && scene.__runtimeWorld?.height === CURRENT_PRODUCTION_WORLD.height
      && sectors?.totalSectorCount === 64
    )
  };
  const ok = Object.values(checks).every(Boolean);
  const detail = Object.entries(checks).map(([key, value]) => `${key}=${value ? 'ok' : 'FAIL'}`).join(' ');
  window.__WM_E1_SELF_TEST__ = { ok, ...checks };
  document.documentElement.dataset.wreckmarchE1SelfTest = ok ? 'passed' : 'failed';
  window.__WM_LOG__?.(`E1 browser self-test ${ok ? 'PASSED' : 'FAILED'}: ${detail}`);
  if (!ok) throw Error('Phase E.1 self-test failed: ' + detail);
}

export async function applyPhaseE1() {
  const scene = await getWreckmarchScene({ timeout: 10000, requireTerrainTextures: true });
  buildWorld(scene);
  applyFinalHotfix(scene);
  applyCompanionV3(scene);
  applyRunDirector(scene);
  installRunTimelineRuntime(scene);
  installU3EliteRewards(scene);
  await installRustHoundVisuals(scene);
  await installSawbugVisuals(scene);
  window.__WM_PHASE_E1__ = true;
  document.documentElement.dataset.wreckmarchPhaseE1 = 'active';
  window.__WM_LOG__?.(`Phase E.1 active: canonical streamed asphalt (removed ${scene.__e1RemovedLegacyTerrain || 0}, suppressed ${scene.__e1SuppressedLegacyCount || 0} legacy world objects)`);
  selfTest(scene);
  return true;
}

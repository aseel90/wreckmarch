// WRECKMARCH — Phase B runtime patch
import { resolveWorldGeometryForLocation, R2_WORLD_SIZE_HARNESS_VERSION } from './world/world-size-harness.js?v=3';
import { WorldSectorActivationSystem } from './world/world-sector-system.js?v=1';
import { R2_WORLD_CONTRACT_VERSION } from './world/world-contract.js?v=1';
import { WorldSectorTerrain } from './world/world-sector-terrain.js?v=2';

(() => {
  const scene = window.__WRECKMARCH_SCENE__;
  if (!scene || !scene.add) return;

  const world = resolveWorldGeometryForLocation(window.location);
  const WORLD_W = world.width;
  const WORLD_H = world.height;
  const CX = WORLD_W / 2;
  const CY = WORLD_H / 2;

  const safe = (obj, method, ...args) => {
    try { return obj?.[method]?.(...args); } catch { return obj; }
  };

  const ensureTexture = (key, w, h, painter) => {
    if (scene.textures?.exists?.(key)) return key;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    painter(g, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  };

  const groundKey = ensureTexture('c4-ground', 256, 256, (g, w, h) => {
    g.fillStyle(0x5a3927, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(0x8f5f3d, 0.18);
    for (let i = 0; i < 36; i++) g.fillCircle((i * 47) % w, (i * 83) % h, 2 + (i % 4));
    g.lineStyle(2, 0x2a1c15, 0.22);
    for (let i = 0; i < 10; i++) g.lineBetween((i * 31) % w, (i * 61) % h, ((i * 31) + 52) % w, ((i * 61) + 18) % h);
  });

  const roadKey = ensureTexture('c4-road', 256, 256, (g, w, h) => {
    g.fillStyle(0x342f2b, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(0x514941, 0.35);
    for (let i = 0; i < 22; i++) g.fillRect((i * 59) % w, (i * 97) % h, 18 + (i % 3) * 11, 3);
    g.lineStyle(2, 0x171513, 0.45);
    for (let i = 0; i < 7; i++) g.lineBetween((i * 71) % w, (i * 37) % h, ((i * 71) + 80) % w, ((i * 37) + 30) % h);
  });

  const terrainObjects = scene.children?.list || [];
  const keep = new Set([scene.player, scene.hero, scene.character, scene.companion].filter(Boolean));
  for (const obj of terrainObjects) {
    if (!obj || keep.has(obj) || !obj.visible || obj.__terrainSystemObject) continue;
    const depth = Number(obj.depth ?? 0);
    if (depth < 2 && (obj.texture?.key === groundKey || obj.texture?.key === roadKey)) safe(obj, 'destroy');
  }

  scene.worldSectorTerrain?.destroyAll?.();
  scene.worldSectorTerrain = new WorldSectorTerrain(scene, world);
  scene.worldSectorSystem = new WorldSectorActivationSystem({
    world,
    onActivate: sector => scene.worldSectorTerrain.activateSector(sector),
    onDeactivate: sector => scene.worldSectorTerrain.deactivateSector(sector)
  });
  scene.__terrainSystemState = { owner: 'r2-world-sector-terrain', worldId: world.id, fullMapTerrainAllocated: false };

  const hero = scene.player || scene.hero || scene.character;
  const heroX = Number(hero?.x ?? CX);
  const heroY = Number(hero?.y ?? CY);
  scene.worldSectorSystem.updateForPosition(heroX, heroY);

  const cameras = scene.cameras?.cameras || [scene.cameras?.main].filter(Boolean);
  for (const camera of cameras) safe(camera, 'setBounds', 0, 0, WORLD_W, WORLD_H);
  scene.physics?.world?.setBounds?.(0, 0, WORLD_W, WORLD_H);

  const previousUpdate = scene.update;
  if (!scene.__r2SectorUpdateWrapped) {
    scene.__r2SectorUpdateWrapped = true;
    scene.update = function (...args) {
      const result = previousUpdate?.apply(this, args);
      const liveHero = this.player || this.hero || this.character;
      if (liveHero && this.worldSectorSystem) this.worldSectorSystem.updateForPosition(liveHero.x, liveHero.y);
      this.worldSectorTerrain?.ensureVisible?.();
      return result;
    };
  }

  const diagnostics = () => {
    const sector = scene.worldSectorSystem?.getDiagnostics?.() || null;
    return {
      phase: 'B',
      world: { id: world.id, width: WORLD_W, height: WORLD_H },
      harness: { version: R2_WORLD_SIZE_HARNESS_VERSION, enabled: world.id !== 'production-9600-v1' },
      sectors: sector,
      terrain: scene.worldSectorTerrain?.getDiagnostics?.() || null
    };
  };

  window.__WRECKMARCH_PHASE_B__ = {
    version: 'r2-sector-production-v1',
    world,
    worldContractVersion: R2_WORLD_CONTRACT_VERSION,
    worldSizeHarnessVersion: R2_WORLD_SIZE_HARNESS_VERSION,
    diagnostics,
    terrainDiagnostics: () => scene.worldSectorTerrain?.getDiagnostics?.() || null
  };
  window.wreckmarchWorldSize = WORLD_W;
  document.documentElement.dataset.wreckmarchWorldSectors = R2_WORLD_CONTRACT_VERSION;
})();

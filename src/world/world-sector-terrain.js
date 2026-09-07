/* WRECKMARCH R2/R3 — canonical bounded sector terrain with active-sector district art metadata. */
import { getDistrictMetadataForSector } from './world-district-contract.js?v=3';

export const R2_WORLD_SECTOR_TERRAIN_VERSION = 'r2-sector-terrain-v1+r3-district-v2';

const ROAD_FRACTIONS = Object.freeze([0.25, 0.5, 0.75]);
const ROAD_WIDTH = 168;
const SECTOR_OVERLAP = 2;
const TERRAIN_OWNER = 'r2-world-sector-terrain';

function hashSector(column, row, salt = 0) {
  let value = ((column + 1) * 73856093) ^ ((row + 1) * 19349663) ^ ((salt + 1) * 83492791);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function roadCoordinates(world) {
  return ROAD_FRACTIONS.map(fraction => Math.round(world.width * fraction));
}

function intersectsBand(start, size, coordinate, halfWidth) {
  const end = start + size;
  return coordinate + halfWidth >= start && coordinate - halfWidth <= end;
}

function markSectorObject(object, sectorKey, kind) {
  if (!object) return object;
  object.__terrainSystemObject = true;
  object.__terrainSystemOwner = TERRAIN_OWNER;
  object.__worldSectorTerrainObject = true;
  object.__worldSectorTerrainSector = sectorKey;
  object.__worldSectorTerrainKind = kind;
  return object;
}

function markDistrictObject(object, sectorKey, kind, district, debugComparisonOnly = false) {
  object = markSectorObject(object, sectorKey, kind);
  if (!object) return object;
  object.__worldDistrictId = district.id;
  object.__worldDistrictDebugComparisonOnly = debugComparisonOnly === true;
  return object;
}

function overlapsBossClearing(localX, localY, bossClearings) {
  return bossClearings.some(clearing => (
    Math.abs(localX - clearing.localX) < clearing.width / 2 + 70
    && Math.abs(localY - clearing.localY) < clearing.height / 2 + 70
  ));
}

function createDistrictMotif(scene, sector, district, debugComparisonOnly) {
  if (debugComparisonOnly || !scene?.add?.graphics) return null;
  const graphics = markDistrictObject(scene.add.graphics(), sector.key, 'district-motif', district, false);
  const rng = createRng(hashSector(sector.column, sector.row, 11));
  const x = sector.x;
  const y = sector.y;
  const w = sector.width;
  const h = sector.height;
  const accent = district.tint;
  const dark = district.debrisTint;
  graphics.setDepth?.(0.72);
  graphics.setName?.(`r3-district-motif-${district.id}-${sector.key}`);

  switch (district.visual) {
    case 'scrap-ridges':
      graphics.lineStyle?.(9, dark, 0.24);
      for (let i = 0; i < 5; i += 1) {
        const yy = y + 160 + i * 185 + rng() * 35;
        graphics.lineBetween?.(x + 85, yy, x + 330 + rng() * 190, yy - 40 - rng() * 70);
      }
      graphics.fillStyle?.(accent, 0.12);
      for (let i = 0; i < 7; i += 1) graphics.fillCircle?.(x + 120 + rng() * (w - 240), y + 100 + rng() * (h - 200), 14 + rng() * 20);
      break;
    case 'concrete-asphalt':
      graphics.fillStyle?.(0x4d4b48, 0.16);
      graphics.fillRect?.(x + 80, y + 110, w - 160, 42);
      graphics.fillRect?.(x + 160, y + h - 180, w - 250, 48);
      graphics.lineStyle?.(5, accent, 0.18);
      graphics.lineBetween?.(x + 120, y + 240, x + w - 100, y + 420);
      graphics.lineBetween?.(x + 220, y + 780, x + w - 160, y + 620);
      break;
    case 'industrial-rust':
      graphics.lineStyle?.(5, accent, 0.18);
      for (let i = 0; i < 4; i += 1) {
        const rx = x + 100 + (i % 2) * 520;
        const ry = y + 120 + Math.floor(i / 2) * 520;
        graphics.strokeRect?.(rx, ry, 340, 210);
        graphics.lineBetween?.(rx + 22, ry + 30, rx + 318, ry + 30);
      }
      break;
    case 'chemical-stain':
      graphics.fillStyle?.(accent, 0.085);
      for (let i = 0; i < 5; i += 1) {
        const cx = x + 150 + rng() * (w - 300);
        const cy = y + 140 + rng() * (h - 280);
        graphics.fillCircle?.(cx, cy, 38 + rng() * 62);
      }
      graphics.lineStyle?.(4, 0x9ba75b, 0.15);
      graphics.strokeCircle?.(x + 300, y + 260, 120);
      graphics.strokeCircle?.(x + 865, y + 790, 95);
      break;
    case 'charred-lanes':
      graphics.lineStyle?.(14, 0x17110f, 0.19);
      for (let i = 0; i < 5; i += 1) {
        const sx = x + 90 + rng() * (w - 180);
        const sy = y + 100 + rng() * (h - 200);
        graphics.lineBetween?.(sx, sy, sx + 120 + rng() * 210, sy + 30 + rng() * 65);
      }
      break;
    case 'controlled-wasteland':
      graphics.lineStyle?.(5, accent, 0.18);
      graphics.strokeRect?.(x + 110, y + 110, w - 220, h - 220);
      for (let i = 0; i < 4; i += 1) {
        const offset = 190 + i * 205;
        graphics.lineBetween?.(x + offset, y + 105, x + offset + 75, y + 180);
        graphics.lineBetween?.(x + w - 105, y + offset, x + w - 180, y + offset + 75);
      }
      break;
    case 'broken-junctions':
    default:
      graphics.lineStyle?.(6, accent, 0.16);
      graphics.lineBetween?.(x + 105, y + 270, x + 430, y + 595);
      graphics.lineBetween?.(x + w - 105, y + 270, x + w - 430, y + 595);
      graphics.lineBetween?.(x + 250, y + h - 125, x + 535, y + h - 410);
      graphics.fillStyle?.(dark, 0.12);
      graphics.fillCircle?.(x + w * 0.5, y + h * 0.5, 90);
      break;
  }
  return graphics;
}

function createBossClearingVisual(scene, sector, clearing, district) {
  if (!scene?.add?.graphics) return null;
  const graphics = markDistrictObject(scene.add.graphics(), sector.key, 'boss-clearing', district, false);
  const cx = sector.x + clearing.localX;
  const cy = sector.y + clearing.localY;
  graphics.setDepth?.(0.82);
  graphics.setName?.(`r3-boss-clearing-${clearing.id}`);
  graphics.lineStyle?.(5, district.tint, 0.28);
  graphics.strokeEllipse?.(cx, cy, clearing.width, clearing.height);
  graphics.lineStyle?.(3, 0xe0b88d, 0.18);
  const rx = clearing.width / 2;
  const ry = clearing.height / 2;
  graphics.lineBetween?.(cx - rx, cy, cx - rx + 70, cy);
  graphics.lineBetween?.(cx + rx, cy, cx + rx - 70, cy);
  graphics.lineBetween?.(cx, cy - ry, cx, cy - ry + 60);
  graphics.lineBetween?.(cx, cy + ry, cx, cy + ry - 60);
  graphics.__worldBossClearingId = clearing.id;
  return graphics;
}

function createLandmarkVisual(scene, sector, landmark, district) {
  if (!scene?.add?.graphics) return null;
  const graphics = markDistrictObject(scene.add.graphics(), sector.key, 'landmark', district, false);
  const x = sector.x + landmark.localX;
  const y = sector.y + landmark.localY;
  const s = landmark.scale || 1;
  const dark = 0x17120f;
  const metal = district.debrisTint;
  const accent = district.tint;
  graphics.setDepth?.(1.18);
  graphics.setName?.(`r3-landmark-${landmark.id}`);
  graphics.__worldLandmarkId = landmark.id;
  graphics.__worldLandmarkKind = landmark.kind;
  graphics.fillStyle?.(dark, 0.78);
  graphics.lineStyle?.(4 * s, accent, 0.64);

  switch (landmark.kind) {
    case 'scrap-spire':
      graphics.fillTriangle?.(x, y - 120 * s, x - 70 * s, y + 70 * s, x + 72 * s, y + 70 * s);
      graphics.strokeTriangle?.(x, y - 120 * s, x - 70 * s, y + 70 * s, x + 72 * s, y + 70 * s);
      graphics.fillStyle?.(metal, 0.88);
      graphics.fillRect?.(x - 34 * s, y - 10 * s, 68 * s, 105 * s);
      break;
    case 'wreck-ribs':
      for (let i = -2; i <= 2; i += 1) graphics.lineBetween?.(x + i * 38 * s, y + 72 * s, x + i * 30 * s, y - (50 + (2 - Math.abs(i)) * 22) * s);
      graphics.lineBetween?.(x - 100 * s, y + 72 * s, x + 100 * s, y + 72 * s);
      break;
    case 'overpass-pier':
      graphics.fillRect?.(x - 150 * s, y - 60 * s, 300 * s, 45 * s);
      graphics.fillRect?.(x - 105 * s, y - 15 * s, 42 * s, 130 * s);
      graphics.fillRect?.(x + 63 * s, y - 15 * s, 42 * s, 130 * s);
      graphics.lineBetween?.(x - 160 * s, y - 62 * s, x + 160 * s, y - 62 * s);
      break;
    case 'concrete-ramp':
      graphics.fillTriangle?.(x - 145 * s, y + 80 * s, x + 145 * s, y + 80 * s, x + 95 * s, y - 90 * s);
      graphics.lineBetween?.(x - 150 * s, y + 82 * s, x + 150 * s, y + 82 * s);
      graphics.lineBetween?.(x + 94 * s, y - 92 * s, x + 145 * s, y + 80 * s);
      break;
    case 'loader-frame':
      graphics.fillRect?.(x - 125 * s, y - 55 * s, 175 * s, 100 * s);
      graphics.fillRect?.(x + 50 * s, y - 100 * s, 55 * s, 145 * s);
      graphics.fillCircle?.(x - 75 * s, y + 65 * s, 35 * s);
      graphics.fillCircle?.(x + 70 * s, y + 65 * s, 35 * s);
      graphics.lineBetween?.(x + 95 * s, y - 90 * s, x + 160 * s, y - 135 * s);
      break;
    case 'container-stack':
      graphics.fillRect?.(x - 135 * s, y - 10 * s, 170 * s, 80 * s);
      graphics.fillRect?.(x + 42 * s, y - 10 * s, 120 * s, 80 * s);
      graphics.fillRect?.(x - 70 * s, y - 96 * s, 175 * s, 78 * s);
      graphics.strokeRect?.(x - 135 * s, y - 10 * s, 170 * s, 80 * s);
      graphics.strokeRect?.(x - 70 * s, y - 96 * s, 175 * s, 78 * s);
      break;
    case 'road-totem':
      graphics.fillRect?.(x - 14 * s, y - 120 * s, 28 * s, 230 * s);
      graphics.fillRect?.(x - 100 * s, y - 82 * s, 190 * s, 42 * s);
      graphics.fillRect?.(x - 65 * s, y - 25 * s, 150 * s, 38 * s);
      graphics.lineBetween?.(x - 105 * s, y - 85 * s, x + 95 * s, y - 85 * s);
      break;
    case 'junction-wreck':
      graphics.fillRect?.(x - 145 * s, y - 32 * s, 290 * s, 64 * s);
      graphics.fillRect?.(x - 32 * s, y - 145 * s, 64 * s, 290 * s);
      graphics.fillCircle?.(x, y, 58 * s);
      graphics.strokeCircle?.(x, y, 75 * s);
      break;
    case 'tank-pair':
      graphics.fillCircle?.(x - 65 * s, y, 70 * s);
      graphics.fillCircle?.(x + 75 * s, y, 70 * s);
      graphics.strokeCircle?.(x - 65 * s, y, 72 * s);
      graphics.strokeCircle?.(x + 75 * s, y, 72 * s);
      graphics.lineBetween?.(x - 135 * s, y + 72 * s, x + 150 * s, y + 72 * s);
      break;
    case 'pipe-cluster':
      graphics.lineStyle?.(14 * s, metal, 0.88);
      graphics.lineBetween?.(x - 120 * s, y + 80 * s, x - 120 * s, y - 70 * s);
      graphics.lineBetween?.(x - 40 * s, y + 80 * s, x - 40 * s, y - 120 * s);
      graphics.lineBetween?.(x + 45 * s, y + 80 * s, x + 45 * s, y - 45 * s);
      graphics.lineBetween?.(x + 120 * s, y + 80 * s, x + 120 * s, y - 95 * s);
      graphics.lineStyle?.(4 * s, accent, 0.64);
      graphics.lineBetween?.(x - 130 * s, y + 88 * s, x + 135 * s, y + 88 * s);
      break;
    case 'burned-truck':
      graphics.fillRect?.(x - 155 * s, y - 58 * s, 200 * s, 105 * s);
      graphics.fillRect?.(x + 48 * s, y - 35 * s, 95 * s, 82 * s);
      graphics.fillCircle?.(x - 95 * s, y + 62 * s, 28 * s);
      graphics.fillCircle?.(x + 85 * s, y + 62 * s, 28 * s);
      graphics.lineBetween?.(x - 160 * s, y - 60 * s, x + 145 * s, y + 48 * s);
      break;
    case 'barricade':
      for (let i = -2; i <= 2; i += 1) graphics.fillRect?.(x + i * 62 * s - 25 * s, y - (i % 2 ? 30 : 12) * s, 50 * s, 80 * s);
      graphics.lineBetween?.(x - 175 * s, y + 60 * s, x + 175 * s, y + 60 * s);
      break;
    case 'watchtower':
      graphics.lineStyle?.(9 * s, metal, 0.9);
      graphics.lineBetween?.(x - 75 * s, y + 120 * s, x - 42 * s, y - 55 * s);
      graphics.lineBetween?.(x + 75 * s, y + 120 * s, x + 42 * s, y - 55 * s);
      graphics.lineStyle?.(4 * s, accent, 0.64);
      graphics.fillStyle?.(dark, 0.82);
      graphics.fillRect?.(x - 90 * s, y - 75 * s, 180 * s, 65 * s);
      graphics.fillTriangle?.(x - 105 * s, y - 78 * s, x + 105 * s, y - 78 * s, x, y - 135 * s);
      break;
    case 'checkpoint':
      graphics.fillRect?.(x - 145 * s, y - 85 * s, 40 * s, 175 * s);
      graphics.fillRect?.(x + 105 * s, y - 85 * s, 40 * s, 175 * s);
      graphics.fillRect?.(x - 105 * s, y - 22 * s, 210 * s, 44 * s);
      graphics.lineBetween?.(x - 145 * s, y - 92 * s, x + 145 * s, y - 92 * s);
      break;
    default:
      graphics.fillCircle?.(x, y, 74 * s);
      graphics.strokeCircle?.(x, y, 86 * s);
  }
  return graphics;
}

export class WorldSectorTerrain {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    /** @type {Map<string, any[]>} */
    this.active = new Map();
    this.createdObjects = 0;
    this.destroyedObjects = 0;
    this.peakActiveObjects = 0;
    this.activationCount = 0;
    this.deactivationCount = 0;
  }

  /** @param {any} sector */
  activateSector(sector) {
    if (!sector || this.active.has(sector.key)) return;
    const scene = this.scene;
    if (!scene?.textures?.exists?.('c4-ground') || !scene?.textures?.exists?.('c4-road')) {
      throw new Error('R2 world-sector terrain requires canonical c4-ground/c4-road textures');
    }

    const objects = [];
    const { district, landmarks, bossClearings, debugComparisonOnly } = getDistrictMetadataForSector(sector);
    const overlap = SECTOR_OVERLAP;
    const left = sector.x - overlap / 2;
    const top = sector.y - overlap / 2;
    const width = sector.width + overlap;
    const height = sector.height + overlap;
    const centerX = sector.x + sector.width / 2;
    const centerY = sector.y + sector.height / 2;

    const ground = markDistrictObject(scene.add.tileSprite(centerX, centerY, width, height, 'c4-ground').setDepth(0.18).setName(`r2-sector-ground-${sector.key}`), sector.key, 'ground', district, debugComparisonOnly);
    ground.setTileScale(1); ground.tilePositionX = left; ground.tilePositionY = top; objects.push(ground);
    const wash = markDistrictObject(scene.add.tileSprite(centerX, centerY, width, height, 'c4-ground').setDepth(0.24).setName(`r2-sector-wash-${sector.key}`).setAlpha(district.washAlpha).setTint(district.tint), sector.key, 'wash', district, debugComparisonOnly);
    wash.tilePositionX = left + 77; wash.tilePositionY = top + 41; objects.push(wash);

    const motif = createDistrictMotif(scene, sector, district, debugComparisonOnly); if (motif) objects.push(motif);
    for (const clearing of bossClearings) { const visual = createBossClearingVisual(scene, sector, clearing, district); if (visual) objects.push(visual); }

    const roadHalf = ROAD_WIDTH / 2;
    for (const coordinate of roadCoordinates(this.world)) {
      if (intersectsBand(sector.x, sector.width, coordinate, roadHalf)) {
        const vertical = markDistrictObject(scene.add.tileSprite(coordinate, centerY, ROAD_WIDTH, height, 'c4-road').setDepth(0.9).setName(`r2-sector-road-v-${coordinate}-${sector.key}`).setAlpha(1), sector.key, 'road', district, debugComparisonOnly);
        vertical.tilePositionX = coordinate - roadHalf; vertical.tilePositionY = top; objects.push(vertical);
      }
      if (intersectsBand(sector.y, sector.height, coordinate, roadHalf)) {
        const horizontal = markDistrictObject(scene.add.tileSprite(centerX, coordinate, width, ROAD_WIDTH, 'c4-road').setDepth(0.9).setName(`r2-sector-road-h-${coordinate}-${sector.key}`).setAlpha(1), sector.key, 'road', district, debugComparisonOnly);
        horizontal.tilePositionX = left; horizontal.tilePositionY = coordinate - roadHalf; objects.push(horizontal);
      }
    }

    const rng = createRng(hashSector(sector.column, sector.row));
    for (let index = 0; index < 5; index += 1) {
      const landmark = landmarks[index] || null;
      if (landmark) { const visual = createLandmarkVisual(scene, sector, landmark, district); if (visual) { objects.push(visual); continue; } }
      let localX = 90 + rng() * Math.max(1, sector.width - 180); let localY = 90 + rng() * Math.max(1, sector.height - 180);
      if (overlapsBossClearing(localX, localY, bossClearings)) { localX = 110 + (index % 2) * Math.max(1, sector.width - 220); localY = 110 + (Math.floor(index / 2) % 2) * Math.max(1, sector.height - 220); }
      const debris = markDistrictObject(scene.add.ellipse(sector.x + localX, sector.y + localY, 24 + rng() * 60, 8 + rng() * 18, district.debrisTint, debugComparisonOnly ? 0.04 + rng() * 0.035 : 0.055 + rng() * 0.035).setDepth(1.12).setRotation(rng() * Math.PI), sector.key, 'debris', district, debugComparisonOnly);
      debris.setName(debugComparisonOnly ? `r2-debug-comparison-debris-${sector.key}-${index}` : `r3-${district.id}-debris-${sector.key}-${index}`); objects.push(debris);
    }

    const bossClearingIds = bossClearings.map(clearing => clearing.id); for (const object of objects) object.__worldBossClearingIds = bossClearingIds;
    this.active.set(sector.key, objects); this.activationCount += 1; this.createdObjects += objects.length; this.peakActiveObjects = Math.max(this.peakActiveObjects, this.activeObjectCount());
  }

  deactivateSector(sector) { const objects = this.active.get(sector?.key); if (!objects) return; objects.forEach(object => object?.destroy?.()); this.active.delete(sector.key); this.deactivationCount += 1; this.destroyedObjects += objects.length; }
  activeObjects(kind = null) { const objects = []; for (const sectorObjects of this.active.values()) for (const object of sectorObjects) if (!kind || object?.__worldSectorTerrainKind === kind) objects.push(object); return objects; }
  activeObjectCount() { return this.activeObjects().length; }
  ensureVisible() { for (const object of this.activeObjects()) if (object?.active !== false) object?.setVisible?.(true); }
  destroyAll() { for (const objects of this.active.values()) objects.forEach(object => object?.destroy?.()); this.active.clear(); }

  getDiagnostics() {
    const objects = this.activeObjects();
    const roads = objects.filter(object => object?.__worldSectorTerrainKind === 'road');
    const visibleRoads = roads.filter(object => object?.active !== false && object?.visible !== false && Number(object?.alpha ?? 1) > 0.9);
    const grounds = objects.filter(object => ['ground', 'wash'].includes(object?.__worldSectorTerrainKind));
    const debris = objects.filter(object => object?.__worldSectorTerrainKind === 'debris');
    const landmarks = objects.filter(object => object?.__worldSectorTerrainKind === 'landmark');
    const motifs = objects.filter(object => object?.__worldSectorTerrainKind === 'district-motif');
    const clearingVisuals = objects.filter(object => object?.__worldSectorTerrainKind === 'boss-clearing');
    const activeDistrictIds = [...new Set(objects.filter(object => object?.__worldDistrictDebugComparisonOnly !== true).map(object => object?.__worldDistrictId).filter(Boolean))].sort();
    const activeBossClearingIds = [...new Set(objects.flatMap(object => object?.__worldBossClearingIds || []))].sort();
    const activeLandmarkIds = [...new Set(landmarks.map(object => object?.__worldLandmarkId).filter(Boolean))].sort();
    const debugComparisonDistrictObjects = objects.filter(object => object?.__worldDistrictDebugComparisonOnly === true);
    return Object.freeze({ version: R2_WORLD_SECTOR_TERRAIN_VERSION, owner: TERRAIN_OWNER, worldId: this.world.id, width: this.world.width, height: this.world.height,
      activeSectorKeys: Object.freeze([...this.active.keys()].sort()), activeSectorCount: this.active.size, activeObjectCount: objects.length,
      activeGroundObjectCount: grounds.length, activeRoadObjectCount: roads.length, visibleRoadObjectCount: visibleRoads.length, activeDebrisObjectCount: debris.length,
      activeLandmarkObjectCount: landmarks.length, activeDistrictMotifObjectCount: motifs.length, activeBossClearingObjectCount: clearingVisuals.length,
      activeDistrictIds: Object.freeze(activeDistrictIds), activeLandmarkIds: Object.freeze(activeLandmarkIds), activeBossClearingIds: Object.freeze(activeBossClearingIds),
      debugComparisonDistrictObjectCount: debugComparisonDistrictObjects.length, districtMetadataFullMapAllocated: false, peakActiveObjects: this.peakActiveObjects,
      createdObjects: this.createdObjects, destroyedObjects: this.destroyedObjects, activationCount: this.activationCount, deactivationCount: this.deactivationCount,
      fullMapTerrainAllocated: false, sectorOverlapPx: SECTOR_OVERLAP, roadFractions: ROAD_FRACTIONS, roadDepth: 0.9, groundDepth: 0.18 });
  }
}

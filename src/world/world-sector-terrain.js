/* WRECKMARCH R2/R3 — canonical bounded sector terrain with active-sector district art metadata. */
import { getDistrictMetadataForSector } from './world-district-contract.js?v=2';

export const R2_WORLD_SECTOR_TERRAIN_VERSION = 'r2-sector-terrain-v1+r3-district-v1';

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

function overlapsBossClearing(localX, localY, bossClearings) {
  return bossClearings.some(clearing => (
    Math.abs(localX - clearing.localX) < clearing.width / 2 + 70
    && Math.abs(localY - clearing.localY) < clearing.height / 2 + 70
  ));
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

    const ground = markSectorObject(
      scene.add.tileSprite(centerX, centerY, width, height, 'c4-ground')
        .setDepth(0.18)
        .setName(`r2-sector-ground-${sector.key}`),
      sector.key,
      'ground'
    );
    ground.setTileScale(1);
    ground.tilePositionX = left;
    ground.tilePositionY = top;
    objects.push(ground);

    const wash = markSectorObject(
      scene.add.tileSprite(centerX, centerY, width, height, 'c4-ground')
        .setDepth(0.24)
        .setName(`r2-sector-wash-${sector.key}`)
        .setAlpha(district.washAlpha)
        .setTint(district.tint),
      sector.key,
      'wash'
    );
    wash.tilePositionX = left + 77;
    wash.tilePositionY = top + 41;
    objects.push(wash);

    const roadHalf = ROAD_WIDTH / 2;
    for (const coordinate of roadCoordinates(this.world)) {
      if (intersectsBand(sector.x, sector.width, coordinate, roadHalf)) {
        const vertical = markSectorObject(
          scene.add.tileSprite(coordinate, centerY, ROAD_WIDTH, height, 'c4-road')
            .setDepth(0.9)
            .setName(`r2-sector-road-v-${coordinate}-${sector.key}`)
            .setAlpha(1),
          sector.key,
          'road'
        );
        vertical.tilePositionX = coordinate - roadHalf;
        vertical.tilePositionY = top;
        objects.push(vertical);
      }
      if (intersectsBand(sector.y, sector.height, coordinate, roadHalf)) {
        const horizontal = markSectorObject(
          scene.add.tileSprite(centerX, coordinate, width, ROAD_WIDTH, 'c4-road')
            .setDepth(0.9)
            .setName(`r2-sector-road-h-${coordinate}-${sector.key}`)
            .setAlpha(1),
          sector.key,
          'road'
        );
        horizontal.tilePositionX = left;
        horizontal.tilePositionY = coordinate - roadHalf;
        objects.push(horizontal);
      }
    }

    const rng = createRng(hashSector(sector.column, sector.row));
    for (let index = 0; index < 5; index += 1) {
      const landmark = landmarks[index] || null;
      let localX = landmark?.localX ?? (90 + rng() * Math.max(1, sector.width - 180));
      let localY = landmark?.localY ?? (90 + rng() * Math.max(1, sector.height - 180));

      if (!landmark && overlapsBossClearing(localX, localY, bossClearings)) {
        localX = 110 + (index % 2) * Math.max(1, sector.width - 220);
        localY = 110 + (Math.floor(index / 2) % 2) * Math.max(1, sector.height - 220);
      }

      const scale = landmark?.scale || 1;
      const object = markSectorObject(
        scene.add.ellipse(
          sector.x + localX,
          sector.y + localY,
          landmark ? (72 + rng() * 34) * scale : 24 + rng() * 60,
          landmark ? (34 + rng() * 24) * scale : 8 + rng() * 18,
          district.debrisTint,
          landmark ? 0.34 : 0.055 + rng() * 0.035
        ).setDepth(landmark ? 1.18 : 1.12).setRotation(rng() * Math.PI),
        sector.key,
        landmark ? 'landmark' : 'debris'
      );
      object.__worldDistrictId = district.id;
      object.__worldLandmarkId = landmark?.id || null;
      object.__worldDistrictDebugComparisonOnly = debugComparisonOnly === true;
      object.setName(landmark ? `r3-landmark-${landmark.id}` : `r3-${district.id}-debris-${sector.key}-${index}`);
      objects.push(object);
    }

    for (const object of objects) {
      object.__worldDistrictId = object.__worldDistrictId || district.id;
      object.__worldBossClearingIds = bossClearings.map(clearing => clearing.id);
      object.__worldDistrictDebugComparisonOnly = debugComparisonOnly === true;
    }

    this.active.set(sector.key, objects);
    this.activationCount += 1;
    this.createdObjects += objects.length;
    this.peakActiveObjects = Math.max(this.peakActiveObjects, this.activeObjectCount());
  }

  /** @param {any} sector */
  deactivateSector(sector) {
    const objects = this.active.get(sector?.key);
    if (!objects) return;
    objects.forEach(object => object?.destroy?.());
    this.active.delete(sector.key);
    this.deactivationCount += 1;
    this.destroyedObjects += objects.length;
  }

  activeObjects(kind = null) {
    const objects = [];
    for (const sectorObjects of this.active.values()) {
      for (const object of sectorObjects) {
        if (!kind || object?.__worldSectorTerrainKind === kind) objects.push(object);
      }
    }
    return objects;
  }

  activeObjectCount() {
    return this.activeObjects().length;
  }

  ensureVisible() {
    for (const object of this.activeObjects()) {
      if (object?.active !== false) object?.setVisible?.(true);
    }
  }

  destroyAll() {
    for (const objects of this.active.values()) objects.forEach(object => object?.destroy?.());
    this.active.clear();
  }

  getDiagnostics() {
    const objects = this.activeObjects();
    const roads = objects.filter(object => object?.__worldSectorTerrainKind === 'road');
    const visibleRoads = roads.filter(object => object?.active !== false && object?.visible !== false && Number(object?.alpha ?? 1) > 0.9);
    const grounds = objects.filter(object => ['ground', 'wash'].includes(object?.__worldSectorTerrainKind));
    const debris = objects.filter(object => object?.__worldSectorTerrainKind === 'debris');
    const landmarks = objects.filter(object => object?.__worldSectorTerrainKind === 'landmark');
    const activeDistrictIds = [...new Set(objects.map(object => object?.__worldDistrictId).filter(Boolean))].sort();
    const activeBossClearingIds = [...new Set(objects.flatMap(object => object?.__worldBossClearingIds || []))].sort();
    const debugComparisonDistrictObjects = objects.filter(object => object?.__worldDistrictDebugComparisonOnly === true);

    return Object.freeze({
      version: R2_WORLD_SECTOR_TERRAIN_VERSION,
      owner: TERRAIN_OWNER,
      worldId: this.world.id,
      width: this.world.width,
      height: this.world.height,
      activeSectorKeys: Object.freeze([...this.active.keys()].sort()),
      activeSectorCount: this.active.size,
      activeObjectCount: objects.length,
      activeGroundObjectCount: grounds.length,
      activeRoadObjectCount: roads.length,
      visibleRoadObjectCount: visibleRoads.length,
      activeDebrisObjectCount: debris.length,
      activeLandmarkObjectCount: landmarks.length,
      activeDistrictIds: Object.freeze(activeDistrictIds),
      activeBossClearingIds: Object.freeze(activeBossClearingIds),
      debugComparisonDistrictObjectCount: debugComparisonDistrictObjects.length,
      districtMetadataFullMapAllocated: false,
      peakActiveObjects: this.peakActiveObjects,
      createdObjects: this.createdObjects,
      destroyedObjects: this.destroyedObjects,
      activationCount: this.activationCount,
      deactivationCount: this.deactivationCount,
      fullMapTerrainAllocated: false,
      sectorOverlapPx: SECTOR_OVERLAP,
      roadFractions: ROAD_FRACTIONS,
      roadDepth: 0.9,
      groundDepth: 0.18
    });
  }
}

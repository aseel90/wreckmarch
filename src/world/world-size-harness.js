/* WRECKMARCH R2 — isolated large-world candidate harness + bounded streamed terrain. */
import { CURRENT_PRODUCTION_WORLD, FUTURE_WORLD_CANDIDATES } from './world-contract.js?v=1';

export const R2_WORLD_SIZE_HARNESS_VERSION = 'r2-size-harness-v1';
export const WORLD_SIZE_HARNESS_ENABLE_PARAM = 'wmWorldHarness';
export const WORLD_SIZE_HARNESS_SIZE_PARAM = 'wmWorld';

const ROAD_FRACTIONS = Object.freeze([0.25, 0.5, 0.75]);
const ROAD_WIDTH = 168;
const SECTOR_OVERLAP = 2;

const candidateByRequest = request => {
  const normalized = String(request || '').trim().toLowerCase();
  if (!normalized) return null;
  return FUTURE_WORLD_CANDIDATES.find(candidate => (
    candidate.id.toLowerCase() === normalized ||
    String(candidate.width) === normalized ||
    `${candidate.width}x${candidate.height}` === normalized
  )) || null;
};

/**
 * Future sizes are only selectable behind an explicit harness flag.
 * Normal URLs always resolve to the current production world.
 * @param {string} [search='']
 */
export function resolveWorldSizeHarness(search = '') {
  const params = new URLSearchParams(search);
  const requested = params.get(WORLD_SIZE_HARNESS_SIZE_PARAM);
  const explicitlyEnabled = params.get(WORLD_SIZE_HARNESS_ENABLE_PARAM) === '1';
  const candidate = candidateByRequest(requested);
  const enabled = explicitlyEnabled && Boolean(candidate);
  const reason = enabled
    ? 'candidate-selected'
    : explicitlyEnabled && requested
      ? 'invalid-candidate'
      : 'production-default';

  return Object.freeze({
    version: R2_WORLD_SIZE_HARNESS_VERSION,
    enabled,
    requested,
    reason,
    world: enabled ? candidate : CURRENT_PRODUCTION_WORLD
  });
}

/** @param {{ search?: string } | undefined} [locationLike] */
export function resolveWorldSizeHarnessFromLocation(locationLike = typeof location === 'undefined' ? undefined : location) {
  return resolveWorldSizeHarness(locationLike?.search || '');
}

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

function markHarnessObject(object, sectorKey) {
  if (!object) return object;
  object.__terrainSystemObject = true;
  object.__terrainSystemOwner = 'r2-world-size-harness';
  object.__r2WorldHarnessObject = true;
  object.__r2WorldHarnessSector = sectorKey;
  return object;
}

export class WorldSizeHarnessTerrain {
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
      throw new Error('R2 world-size harness requires canonical c4-ground/c4-road textures');
    }

    const objects = [];
    const overlap = SECTOR_OVERLAP;
    const left = sector.x - overlap / 2;
    const top = sector.y - overlap / 2;
    const width = sector.width + overlap;
    const height = sector.height + overlap;
    const centerX = sector.x + sector.width / 2;
    const centerY = sector.y + sector.height / 2;

    const ground = markHarnessObject(
      scene.add.tileSprite(centerX, centerY, width, height, 'c4-ground')
        .setDepth(0.18)
        .setName(`r2-harness-ground-${sector.key}`),
      sector.key
    );
    ground.setTileScale(1);
    ground.tilePositionX = left;
    ground.tilePositionY = top;
    objects.push(ground);

    const wash = markHarnessObject(
      scene.add.tileSprite(centerX, centerY, width, height, 'c4-ground')
        .setDepth(0.24)
        .setName(`r2-harness-wash-${sector.key}`)
        .setAlpha(0.07)
        .setTint(0xb78963),
      sector.key
    );
    wash.tilePositionX = left + 77;
    wash.tilePositionY = top + 41;
    objects.push(wash);

    const roadHalf = ROAD_WIDTH / 2;
    for (const coordinate of roadCoordinates(this.world)) {
      if (intersectsBand(sector.x, sector.width, coordinate, roadHalf)) {
        const vertical = markHarnessObject(
          scene.add.tileSprite(coordinate, centerY, ROAD_WIDTH, height, 'c4-road')
            .setDepth(0.9)
            .setName(`r2-harness-road-v-${coordinate}-${sector.key}`)
            .setAlpha(1),
          sector.key
        );
        vertical.tilePositionX = coordinate - roadHalf;
        vertical.tilePositionY = top;
        objects.push(vertical);
      }
      if (intersectsBand(sector.y, sector.height, coordinate, roadHalf)) {
        const horizontal = markHarnessObject(
          scene.add.tileSprite(centerX, coordinate, width, ROAD_WIDTH, 'c4-road')
            .setDepth(0.9)
            .setName(`r2-harness-road-h-${coordinate}-${sector.key}`)
            .setAlpha(1),
          sector.key
        );
        horizontal.tilePositionX = left;
        horizontal.tilePositionY = coordinate - roadHalf;
        objects.push(horizontal);
      }
    }

    const rng = createRng(hashSector(sector.column, sector.row));
    for (let index = 0; index < 5; index += 1) {
      const x = sector.x + 90 + rng() * Math.max(1, sector.width - 180);
      const y = sector.y + 90 + rng() * Math.max(1, sector.height - 180);
      const debris = markHarnessObject(
        scene.add.ellipse(
          x,
          y,
          24 + rng() * 60,
          8 + rng() * 18,
          0x15110e,
          0.04 + rng() * 0.035
        ).setDepth(1.12).setRotation(rng() * Math.PI),
        sector.key
      );
      debris.setName(`r2-harness-debris-${sector.key}-${index}`);
      objects.push(debris);
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

  activeObjectCount() {
    let count = 0;
    for (const objects of this.active.values()) count += objects.length;
    return count;
  }

  destroyAll() {
    for (const objects of this.active.values()) objects.forEach(object => object?.destroy?.());
    this.active.clear();
  }

  getDiagnostics() {
    return Object.freeze({
      version: R2_WORLD_SIZE_HARNESS_VERSION,
      worldId: this.world.id,
      width: this.world.width,
      height: this.world.height,
      activeSectorKeys: Object.freeze([...this.active.keys()].sort()),
      activeSectorCount: this.active.size,
      activeObjectCount: this.activeObjectCount(),
      peakActiveObjects: this.peakActiveObjects,
      createdObjects: this.createdObjects,
      destroyedObjects: this.destroyedObjects,
      activationCount: this.activationCount,
      deactivationCount: this.deactivationCount,
      fullMapTerrainAllocated: false,
      sectorOverlapPx: SECTOR_OVERLAP,
      roadFractions: ROAD_FRACTIONS
    });
  }
}

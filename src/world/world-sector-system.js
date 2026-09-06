/* WRECKMARCH R2 — deterministic logical sector activation. No terrain spawning ownership yet. */
import {
  CURRENT_PRODUCTION_WORLD,
  R2_WORLD_CONTRACT_VERSION,
  WORLD_SECTOR_POLICY,
  getActiveWorldSectors,
  getWorldSectorForPosition,
  getWorldSectorGrid
} from './world-contract.js?v=1';

/** @typedef {ReturnType<typeof getWorldSectorForPosition>} WorldSectorDescriptor */
/** @typedef {{ contractVersion: string, worldId: string, centerSector: WorldSectorDescriptor | null, activeSectorKeys: readonly string[], activeSectorCount: number, totalSectorCount: number, activated: readonly string[], deactivated: readonly string[], revision: number }} WorldSectorDiagnostics */

const noop = () => {};

export class WorldSectorActivationSystem {
  constructor({
    world = CURRENT_PRODUCTION_WORLD,
    activeRadius = WORLD_SECTOR_POLICY.activeRadius,
    onActivate = noop,
    onDeactivate = noop
  } = {}) {
    this.world = world;
    this.activeRadius = Math.max(0, Math.floor(Number(activeRadius) || 0));
    this.onActivate = typeof onActivate === 'function' ? onActivate : noop;
    this.onDeactivate = typeof onDeactivate === 'function' ? onDeactivate : noop;
    /** @type {Map<string, WorldSectorDescriptor>} */
    this.activeSectors = new Map();
    /** @type {string | null} */
    this.centerKey = null;
    this.revision = 0;
    /** @type {Readonly<WorldSectorDiagnostics>} */
    this.lastDiagnostics = Object.freeze({
      contractVersion: R2_WORLD_CONTRACT_VERSION,
      worldId: world.id,
      centerSector: null,
      activeSectorKeys: Object.freeze([]),
      activeSectorCount: 0,
      totalSectorCount: getWorldSectorGrid(world).sectorCount,
      activated: Object.freeze([]),
      deactivated: Object.freeze([]),
      revision: 0
    });
  }

  /** @returns {Readonly<WorldSectorDiagnostics>} */
  updateForPosition(x, y) {
    const center = getWorldSectorForPosition(x, y, this.world);
    if (center.key === this.centerKey) return this.lastDiagnostics;

    const nextSectors = getActiveWorldSectors(x, y, this.world, this.activeRadius);
    const next = new Map(nextSectors.map(sector => [sector.key, sector]));
    const activated = [];
    const deactivated = [];

    for (const [key, sector] of this.activeSectors) {
      if (next.has(key)) continue;
      deactivated.push(key);
      this.onDeactivate(sector);
    }

    for (const [key, sector] of next) {
      if (this.activeSectors.has(key)) continue;
      activated.push(key);
      this.onActivate(sector);
    }

    this.activeSectors = next;
    this.centerKey = center.key;
    this.revision += 1;
    this.lastDiagnostics = Object.freeze({
      contractVersion: R2_WORLD_CONTRACT_VERSION,
      worldId: this.world.id,
      centerSector: center,
      activeSectorKeys: Object.freeze([...next.keys()]),
      activeSectorCount: next.size,
      totalSectorCount: getWorldSectorGrid(this.world).sectorCount,
      activated: Object.freeze(activated),
      deactivated: Object.freeze(deactivated),
      revision: this.revision
    });
    return this.lastDiagnostics;
  }

  /** @returns {Readonly<WorldSectorDiagnostics>} */
  getDiagnostics() {
    return this.lastDiagnostics;
  }

  /** @returns {Readonly<WorldSectorDiagnostics>} */
  reset() {
    for (const sector of this.activeSectors.values()) this.onDeactivate(sector);
    this.activeSectors = new Map();
    this.centerKey = null;
    this.revision += 1;
    this.lastDiagnostics = Object.freeze({
      contractVersion: R2_WORLD_CONTRACT_VERSION,
      worldId: this.world.id,
      centerSector: null,
      activeSectorKeys: Object.freeze([]),
      activeSectorCount: 0,
      totalSectorCount: getWorldSectorGrid(this.world).sectorCount,
      activated: Object.freeze([]),
      deactivated: Object.freeze([]),
      revision: this.revision
    });
    return this.lastDiagnostics;
  }
}

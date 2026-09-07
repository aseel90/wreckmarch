import { describe, expect, it, vi } from 'vitest';
import { CURRENT_PRODUCTION_WORLD, getActiveWorldSectors } from '../../src/world/world-contract.js';
import { WorldSectorTerrain } from '../../src/world/world-sector-terrain.js';

function fakeDisplayObject() {
  return {
    destroyed: false,
    active: true,
    visible: true,
    alpha: 1,
    tilePositionX: 0,
    tilePositionY: 0,
    setDepth() { return this; },
    setName() { return this; },
    setAlpha(value: number) { this.alpha = value; return this; },
    setTint() { return this; },
    setRotation() { return this; },
    setTileScale() { return this; },
    setVisible(value: boolean) { this.visible = value; return this; },
    destroy() { this.destroyed = true; this.active = false; }
  };
}

describe('R2 canonical world-sector terrain', () => {
  it('allocates only active sector tiles and never creates a full-map production tile', () => {
    const tileSizes: Array<{ width: number; height: number }> = [];
    const scene: any = {
      textures: { exists: () => true },
      add: {
        tileSprite: vi.fn((_x: number, _y: number, width: number, height: number) => {
          tileSizes.push({ width, height });
          return fakeDisplayObject();
        }),
        ellipse: vi.fn(() => fakeDisplayObject())
      }
    };
    const terrain = new WorldSectorTerrain(scene, CURRENT_PRODUCTION_WORLD);
    const sectors = getActiveWorldSectors(4800, 4800, CURRENT_PRODUCTION_WORLD);
    sectors.forEach(sector => terrain.activateSector(sector));

    const diagnostics = terrain.getDiagnostics();
    expect(diagnostics.owner).toBe('r2-world-sector-terrain');
    expect(diagnostics.activeSectorCount).toBe(9);
    expect(diagnostics.fullMapTerrainAllocated).toBe(false);
    expect(diagnostics.activeObjectCount).toBeGreaterThan(0);
    expect(diagnostics.activeObjectCount).toBeLessThanOrEqual(100);
    expect(diagnostics.activeGroundObjectCount).toBe(18);
    expect(diagnostics.activeRoadObjectCount).toBeGreaterThan(0);
    expect(diagnostics.visibleRoadObjectCount).toBe(diagnostics.activeRoadObjectCount);
    expect(tileSizes.length).toBeGreaterThan(0);
    expect(Math.max(...tileSizes.map(size => size.width))).toBeLessThanOrEqual(1202);
    expect(Math.max(...tileSizes.map(size => size.height))).toBeLessThanOrEqual(1202);
    expect(tileSizes.some(size => size.width === 9600 || size.height === 9600)).toBe(false);
  });

  it('destroys sector-owned objects on deactivation and keeps accounting exact', () => {
    const scene: any = {
      textures: { exists: () => true },
      add: {
        tileSprite: vi.fn(() => fakeDisplayObject()),
        ellipse: vi.fn(() => fakeDisplayObject())
      }
    };
    const terrain = new WorldSectorTerrain(scene, CURRENT_PRODUCTION_WORLD);
    const sector = getActiveWorldSectors(0, 0, CURRENT_PRODUCTION_WORLD)[0];
    terrain.activateSector(sector);
    const before = terrain.getDiagnostics();
    terrain.deactivateSector(sector);
    const after = terrain.getDiagnostics();
    expect(before.activeSectorCount).toBe(1);
    expect(after.activeSectorCount).toBe(0);
    expect(after.deactivationCount).toBe(1);
    expect(after.destroyedObjects).toBe(before.activeObjectCount);
    expect(after.createdObjects - after.destroyedObjects).toBe(after.activeObjectCount);
  });
});

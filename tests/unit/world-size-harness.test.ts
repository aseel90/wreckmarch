import { describe, expect, it, vi } from 'vitest';
import { PREFERRED_FUTURE_WORLD, getActiveWorldSectors } from '../../src/world/world-contract.js';
import { WorldSizeHarnessTerrain, resolveWorldSizeHarness } from '../../src/world/world-size-harness.js';

function fakeDisplayObject() {
  return {
    destroyed: false,
    tilePositionX: 0,
    tilePositionY: 0,
    setDepth() { return this; },
    setName() { return this; },
    setAlpha() { return this; },
    setTint() { return this; },
    setRotation() { return this; },
    setTileScale() { return this; },
    destroy() { this.destroyed = true; }
  };
}

describe('R2 world-size harness', () => {
  it('keeps normal URLs on the production world and only enables approved candidates explicitly', () => {
    expect(resolveWorldSizeHarness('')).toMatchObject({ enabled: false, reason: 'production-default', world: { width: 2200, height: 2200 } });
    expect(resolveWorldSizeHarness('?wmWorld=9600')).toMatchObject({ enabled: false, world: { width: 2200, height: 2200 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=7200')).toMatchObject({ enabled: true, world: { id: 'candidate-7200-v1', width: 7200 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=9600x9600')).toMatchObject({ enabled: true, world: { id: 'candidate-9600-v1', width: 9600 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=candidate-12000-v1')).toMatchObject({ enabled: true, world: { id: 'candidate-12000-v1', width: 12000 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=8000')).toMatchObject({ enabled: false, reason: 'invalid-candidate', world: { width: 2200 } });
  });

  it('allocates streamed sector terrain only and never creates a full-map tile', () => {
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
    const terrain = new WorldSizeHarnessTerrain(scene, PREFERRED_FUTURE_WORLD);
    const sectors = getActiveWorldSectors(4800, 4800, PREFERRED_FUTURE_WORLD);
    sectors.forEach(sector => terrain.activateSector(sector));

    const diagnostics = terrain.getDiagnostics();
    expect(diagnostics.activeSectorCount).toBe(9);
    expect(diagnostics.fullMapTerrainAllocated).toBe(false);
    expect(diagnostics.activeObjectCount).toBeGreaterThan(0);
    expect(diagnostics.activeObjectCount).toBeLessThanOrEqual(100);
    expect(tileSizes.length).toBeGreaterThan(0);
    expect(Math.max(...tileSizes.map(size => size.width))).toBeLessThanOrEqual(1202);
    expect(Math.max(...tileSizes.map(size => size.height))).toBeLessThanOrEqual(1202);
    expect(tileSizes.some(size => size.width === 9600 || size.height === 9600)).toBe(false);
  });

  it('destroys sector-owned objects when a sector deactivates', () => {
    const scene: any = {
      textures: { exists: () => true },
      add: {
        tileSprite: vi.fn(() => fakeDisplayObject()),
        ellipse: vi.fn(() => fakeDisplayObject())
      }
    };
    const terrain = new WorldSizeHarnessTerrain(scene, PREFERRED_FUTURE_WORLD);
    const sector = getActiveWorldSectors(0, 0, PREFERRED_FUTURE_WORLD)[0];
    terrain.activateSector(sector);
    const before = terrain.getDiagnostics();
    terrain.deactivateSector(sector);
    const after = terrain.getDiagnostics();
    expect(before.activeSectorCount).toBe(1);
    expect(after.activeSectorCount).toBe(0);
    expect(after.deactivationCount).toBe(1);
    expect(after.destroyedObjects).toBe(before.activeObjectCount);
  });
});

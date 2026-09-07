import { describe, expect, it } from 'vitest';
import { CURRENT_PRODUCTION_WORLD, getActiveWorldSectors, getWorldSectorGrid } from '../../src/world/world-contract.js';
import {
  BOSS_CLEARINGS,
  R3_WORLD_DISTRICT_VALIDATION,
  WORLD_DISTRICT_LIST,
  WORLD_LANDMARKS,
  getDistrictForSector,
  getDistrictMetadataForSector
} from '../../src/world/world-district-contract.js';

describe('R3 canonical district contract', () => {
  it('covers every production sector exactly once without changing the R2 streaming grid', () => {
    const grid = getWorldSectorGrid(CURRENT_PRODUCTION_WORLD);
    const covered = new Set<string>();
    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        const key = `${column}:${row}`;
        expect(covered.has(key)).toBe(false);
        covered.add(key);
        expect(getDistrictForSector(column, row)).toBeTruthy();
      }
    }
    expect(grid.columns).toBe(8);
    expect(grid.rows).toBe(8);
    expect(covered.size).toBe(64);
    expect(R3_WORLD_DISTRICT_VALIDATION.ok).toBe(true);
    expect(R3_WORLD_DISTRICT_VALIDATION.coveredSectorCount).toBe(64);
  });

  it('keeps the production start inside Central Wreckroads', () => {
    expect(getDistrictForSector(4, 4).id).toBe('central-wreckroads');
    expect(getActiveWorldSectors(4800, 4800, CURRENT_PRODUCTION_WORLD)).toHaveLength(9);
  });

  it('gives all seven districts memorable landmark ownership', () => {
    expect(WORLD_DISTRICT_LIST).toHaveLength(7);
    expect(WORLD_LANDMARKS).toHaveLength(14);
    for (const district of WORLD_DISTRICT_LIST) {
      const landmarks = WORLD_LANDMARKS.filter(item => item.districtId === district.id);
      expect(landmarks.length).toBeGreaterThanOrEqual(1);
      for (const landmark of landmarks) {
        const [column, row] = landmark.sectorKey.split(':').map(Number);
        expect(getDistrictForSector(column, row).id).toBe(district.id);
      }
    }
  });

  it('defines five distributed Boss-capable open clearings inside their owning sectors', () => {
    expect(BOSS_CLEARINGS).toHaveLength(5);
    expect(new Set(BOSS_CLEARINGS.map(clearing => clearing.districtId)).size).toBe(5);
    for (const clearing of BOSS_CLEARINGS) {
      const [column, row] = clearing.sectorKey.split(':').map(Number);
      expect(getDistrictForSector(column, row).id).toBe(clearing.districtId);
      expect(clearing.bossCapable).toBe(true);
      expect(clearing.openGround).toBe(true);
      expect(clearing.width).toBeGreaterThanOrEqual(480);
      expect(clearing.height).toBeGreaterThanOrEqual(420);
      expect(clearing.localX - clearing.width / 2).toBeGreaterThanOrEqual(80);
      expect(clearing.localX + clearing.width / 2).toBeLessThanOrEqual(1120);
      expect(clearing.localY - clearing.height / 2).toBeGreaterThanOrEqual(80);
      expect(clearing.localY + clearing.height / 2).toBeLessThanOrEqual(1120);
    }
  });

  it('returns sector-local metadata only, never a full-map prop allocation', () => {
    const active = getActiveWorldSectors(4800, 4800, CURRENT_PRODUCTION_WORLD);
    const metadata = active.map(sector => getDistrictMetadataForSector(sector));
    expect(metadata).toHaveLength(9);
    expect(metadata.flatMap(item => item.landmarks).length).toBeLessThan(WORLD_LANDMARKS.length);
    expect(metadata.flatMap(item => item.bossClearings).length).toBeLessThan(BOSS_CLEARINGS.length);
  });
});

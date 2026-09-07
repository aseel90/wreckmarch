import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { CURRENT_PRODUCTION_WORLD, getActiveWorldSectors, getWorldSectorGrid } from '../../src/world/world-contract.js';
import {
  BOSS_CLEARINGS,
  R3_WORLD_DISTRICT_VALIDATION,
  WORLD_DISTRICT_LIST,
  WORLD_LANDMARKS,
  getDistrictForSector,
  getDistrictMetadataForSector
} from '../../src/world/world-district-contract.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('R3 canonical district contract', () => {
  it('covers all 64 production sectors exactly once without changing R2 streaming', () => {
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

  it('keeps production start in Central Wreckroads and R2 active bound intact', () => {
    expect(getDistrictForSector(4, 4).id).toBe('central-wreckroads');
    expect(getActiveWorldSectors(4800, 4800, CURRENT_PRODUCTION_WORLD)).toHaveLength(9);
  });

  it('gives every district landmarks', () => {
    expect(WORLD_DISTRICT_LIST).toHaveLength(7);
    expect(WORLD_LANDMARKS).toHaveLength(14);
    for (const district of WORLD_DISTRICT_LIST) {
      expect(WORLD_LANDMARKS.some(item => item.districtId === district.id)).toBe(true);
    }
  });

  it('defines five valid Boss-capable open clearings in different districts', () => {
    expect(BOSS_CLEARINGS).toHaveLength(5);
    expect(new Set(BOSS_CLEARINGS.map(item => item.districtId)).size).toBe(5);
    for (const item of BOSS_CLEARINGS) {
      const [column, row] = item.sectorKey.split(':').map(Number);
      expect(getDistrictForSector(column, row).id).toBe(item.districtId);
      expect(item.bossCapable && item.openGround).toBe(true);
      expect(item.width).toBeGreaterThanOrEqual(480);
      expect(item.height).toBeGreaterThanOrEqual(420);
    }
  });

  it('returns active-sector metadata rather than full-map prop allocation', () => {
    const metadata = getActiveWorldSectors(4800, 4800, CURRENT_PRODUCTION_WORLD).map(getDistrictMetadataForSector);
    expect(metadata).toHaveLength(9);
    expect(metadata.flatMap(item => item.landmarks).length).toBeLessThan(WORLD_LANDMARKS.length);
    expect(metadata.flatMap(item => item.bossClearings).length).toBeLessThan(BOSS_CLEARINGS.length);
  });

  it('keeps 12000 comparison-only sectors neutral instead of extending Production districts', () => {
    const metadata = getDistrictMetadataForSector({ column: 8, row: 8, key: '8:8' });
    expect(metadata.debugComparisonOnly).toBe(true);
    expect(metadata.district.id).toBe('debug-comparison-outside-production');
    expect(metadata.landmarks).toHaveLength(0);
    expect(metadata.bossClearings).toHaveLength(0);
    expect(() => getDistrictForSector(8, 8)).toThrow(/Invalid production sector/);
  });

  it('keeps R2 terrain ownership canonical and does not add a competing district renderer', () => {
    const terrainSource = read('src/world/world-sector-terrain.js');
    const contractSource = read('src/world/world-district-contract.js');
    expect(terrainSource).toContain("const TERRAIN_OWNER = 'r2-world-sector-terrain'");
    expect(terrainSource).toContain('districtMetadataFullMapAllocated: false');
    expect(contractSource).not.toContain('scene.add.');
    expect(contractSource).not.toContain('new Phaser');
  });
});

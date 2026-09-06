import { describe, expect, it } from 'vitest';
import {
  CURRENT_PRODUCTION_WORLD,
  FUTURE_WORLD_CANDIDATES,
  PREFERRED_FUTURE_WORLD,
  R2_WORLD_CONTRACT_VALIDATION,
  WORLD_SECTOR_POLICY,
  getActiveWorldSectors,
  getWorldSectorForPosition,
  getWorldSectorGrid
} from '../../src/world/world-contract.js';

describe('R2 canonical world contract', () => {
  it('keeps production at 2200 while preserving the approved future size candidates', () => {
    expect(CURRENT_PRODUCTION_WORLD).toMatchObject({ width: 2200, height: 2200, role: 'current-production-reference' });
    expect(FUTURE_WORLD_CANDIDATES.map(candidate => candidate.width)).toEqual([7200, 9600, 12000]);
    expect(PREFERRED_FUTURE_WORLD).toMatchObject({ width: 9600, height: 9600 });
    expect(R2_WORLD_CONTRACT_VALIDATION).toEqual({ ok: true, errors: [] });
  });

  it('uses 1200-unit technical sectors so every future candidate divides exactly', () => {
    expect(WORLD_SECTOR_POLICY).toMatchObject({ sectorSize: 1200, activeRadius: 1, maxActiveSectors: 9 });
    expect(FUTURE_WORLD_CANDIDATES.map(candidate => getWorldSectorGrid(candidate))).toEqual([
      { worldId: 'candidate-7200-v1', sectorSize: 1200, columns: 6, rows: 6, sectorCount: 36 },
      { worldId: 'candidate-9600-v1', sectorSize: 1200, columns: 8, rows: 8, sectorCount: 64 },
      { worldId: 'candidate-12000-v1', sectorSize: 1200, columns: 10, rows: 10, sectorCount: 100 }
    ]);
  });

  it('clamps positions to world coordinates and never activates more than a 3x3 neighborhood', () => {
    expect(getWorldSectorForPosition(-50, -90, PREFERRED_FUTURE_WORLD)).toMatchObject({ key: '0:0', column: 0, row: 0 });
    expect(getWorldSectorForPosition(9600, 9600, PREFERRED_FUTURE_WORLD)).toMatchObject({ key: '7:7', column: 7, row: 7 });
    const center = getActiveWorldSectors(4800, 4800, PREFERRED_FUTURE_WORLD);
    const edge = getActiveWorldSectors(0, 0, PREFERRED_FUTURE_WORLD);
    expect(center).toHaveLength(9);
    expect(new Set(center.map(sector => sector.key)).size).toBe(9);
    expect(edge).toHaveLength(4);
  });
});

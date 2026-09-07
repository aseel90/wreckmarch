import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('final terrain ownership cleanup', () => {
  it('protects canonical sector-terrain objects from B and B1 legacy cleanup passes', () => {
    expect(read('src/phase-b-runtime.js')).toContain('obj.__terrainSystemObject');
    expect(read('src/phase-b1-polish.js')).toContain('obj.__terrainSystemObject');
    expect(read('src/world/world-sector-terrain.js')).toContain("object.__terrainSystemOwner = TERRAIN_OWNER");
  });

  it('keeps legacy B/B1 phases out of ground and road rendering', () => {
    const phaseB = read('src/phase-b-runtime.js');
    const phaseB1 = read('src/phase-b1-polish.js');
    expect(phaseB).not.toContain("setDepth(-5)");
    expect(phaseB).not.toContain('fillRoundedRect(110, 270');
    expect(phaseB1).not.toContain('function addGroundDetails');
    expect(phaseB1).not.toContain('function addRoads');
    expect(phaseB1).not.toContain("'b1-ground-a'");
  });

  it('keeps E0/C4/C5/D1/E1 from rebuilding private full-map terrain', () => {
    const e0 = read('src/phase-e0-fast-terrain.js');
    const c4 = read('src/phase-c4-runtime.js');
    const c5 = read('src/phase-c5-runtime.js');
    const d1 = read('src/phase-d1-runtime.js');
    const e1 = read('src/phase-e1-runtime.js');
    expect(e0).not.toContain('buildTerrainLayer(');
    expect(c4).not.toContain('buildTerrainLayer(');
    expect(c5).not.toContain('function buildTerrain');
    expect(d1).not.toContain('function installWorld');
    expect(e1).not.toContain('buildTerrainLayer(');
    expect(c5).toContain('worldSectorTerrain?.getDiagnostics?.()');
    expect(d1).toContain('worldSectorTerrain?.getDiagnostics?.()');
    expect(e1).toContain('worldSectorTerrain?.getDiagnostics?.()');
  });
});

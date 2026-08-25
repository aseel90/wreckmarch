import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('final terrain ownership cleanup', () => {
  it('protects TerrainSystem objects from the B and B1 legacy cleanup passes', () => {
    expect(read('src/phase-b-runtime.js')).toContain('obj.__terrainSystemObject');
    expect(read('src/phase-b1-polish.js')).toContain('obj.__terrainSystemObject');
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

  it('keeps C5 and D1 gameplay/art features but removes their private terrain builders', () => {
    const c5 = read('src/phase-c5-runtime.js');
    const d1 = read('src/phase-d1-runtime.js');
    expect(c5).not.toContain('function buildTerrain');
    expect(c5).not.toContain('buildTerrain(s)');
    expect(d1).not.toContain('function installWorld');
    expect(d1).not.toContain('installWorld(s)');
    expect(c5).toContain('__e0FastRoadSegments');
    expect(d1).toContain('__e0FastRoadSegments');
  });
});

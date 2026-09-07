import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('R2 terrain phase ownership', () => {
  it('keeps C4 weapon/Rig work on the canonical streamed terrain owner', async () => {
    const source = await read('src/phase-c4-runtime.js');
    const apply = source.slice(source.indexOf('export async function applyPhaseC4'));
    expect(apply).not.toContain('buildTerrain(s)');
    expect(apply).not.toContain('buildTerrainLayer(s');
    expect(apply).toContain('clearAngularRoads(s)');
    expect(source).toContain("checks.sharedTerrain=s.__terrainSystemState?.owner==='r2-world-sector-terrain'");
    expect(source).toContain("throw Error('Phase C.4 requires canonical R2 streamed terrain ownership')");
  });
});

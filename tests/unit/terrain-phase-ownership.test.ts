import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('legacy terrain phase ownership', () => {
  it('keeps C4 weapon/Rig work but does not rebuild terrain during apply', async () => {
    const source = await read('src/phase-c4-runtime.js');
    const apply = source.slice(source.indexOf('export async function applyPhaseC4'));
    expect(apply).not.toContain('buildTerrain(s)');
    expect(apply).toContain('clearAngularRoads(s)');
    expect(source).toContain("checks.sharedTerrain=s.__terrainSystemState?.owner==='e0'");
  });
});

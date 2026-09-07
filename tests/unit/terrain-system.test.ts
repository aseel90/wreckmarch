import { describe, expect, it } from 'vitest';
import { FINAL_ROUTES, WORLD_H, WORLD_W } from '../../src/world/terrain-system.js';

describe('legacy TerrainSystem reference geometry', () => {
  it('retains the old 2200 reference only for tooling/tests while R2 production streams sectors', () => {
    expect(WORLD_W).toBe(2200);
    expect(WORLD_H).toBe(2200);
    expect(FINAL_ROUTES).toHaveLength(4);
    expect(FINAL_ROUTES.map(route => route.w)).toEqual([210, 190, 170, 170]);
  });

  it('keeps the legacy main routes stable for regression/reference scenarios', () => {
    expect(FINAL_ROUTES[0].p).toContainEqual([1100, 1100]);
    expect(FINAL_ROUTES[1].p).toContainEqual([1100, 1100]);
  });
});

import { describe, expect, it } from 'vitest';
import { FINAL_ROUTES, WORLD_H, WORLD_W } from '../../src/world/terrain-system.js';

describe('TerrainSystem production geometry', () => {
  it('owns the current 2200x2200 world and four final routes', () => {
    expect(WORLD_W).toBe(2200);
    expect(WORLD_H).toBe(2200);
    expect(FINAL_ROUTES).toHaveLength(4);
    expect(FINAL_ROUTES.map(route => route.w)).toEqual([210, 190, 170, 170]);
  });

  it('keeps the main horizontal and vertical routes crossing the spawn area', () => {
    expect(FINAL_ROUTES[0].p).toContainEqual([1100, 1100]);
    expect(FINAL_ROUTES[1].p).toContainEqual([1100, 1100]);
  });
});

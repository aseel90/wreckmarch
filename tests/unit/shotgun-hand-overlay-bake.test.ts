import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_HAND_OVERLAY_MASKS, bakeShotgunHandOverlayTexture } from '../../src/characters/shotgun-hand-overlay-bake.js';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';

function contains(point: [number, number], polygon: readonly (readonly number[])[]) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi) / ((yj - yi) || 1e-9)) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

describe('Wrecker baked front-hand overlay', () => {
  it('covers only the authored grip/support foreground region, never the head or legs', () => {
    expect(SHOTGUN_HAND_OVERLAY_MASKS.map(mask => mask.id)).toEqual(['rear-grip-hand', 'support-hand']);
    expect(SHOTGUN_HAND_OVERLAY_MASKS.some(mask => contains([70, 75], mask.points))).toBe(true);
    expect(SHOTGUN_HAND_OVERLAY_MASKS.some(mask => contains([103, 78], mask.points))).toBe(true);
    for (const mask of SHOTGUN_HAND_OVERLAY_MASKS) {
      expect(mask.points.length).toBeGreaterThanOrEqual(6);
      expect(Math.max(...mask.points.map(point => point[1]))).toBeLessThan(90);
      expect(Math.min(...mask.points.map(point => point[1]))).toBeGreaterThan(65);
    }
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.handOverlay.runtimeCrop).toBe(false);
    expect(SHOTGUN_RUNTIME_PRESENTATION.layers.runtimeCrop).toBe(false);
  });

  it('bakes one transparent 128x148 CanvasTexture without creating runtime limb objects', () => {
    const ctx = {
      imageSmoothingEnabled: true,
      clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      closePath: vi.fn(), clip: vi.fn(), drawImage: vi.fn()
    };
    const refresh = vi.fn();
    const createCanvas = vi.fn(() => ({ getContext: () => ctx, refresh }));
    const scene: any = { textures: { exists: vi.fn(() => false), remove: vi.fn(), createCanvas } };
    const image = { width: 128, height: 148 };

    bakeShotgunHandOverlayTexture(scene, image, 'shotgun-hands-test');

    expect(createCanvas).toHaveBeenCalledWith('shotgun-hands-test', 128, 148);
    expect(ctx.clip).toHaveBeenCalledOnce();
    expect(ctx.drawImage).toHaveBeenCalledWith(image, 0, 0, 128, 148);
    expect(refresh).toHaveBeenCalledOnce();
    expect(scene.add).toBeUndefined();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { EXPLOSIVE_RIVET_VFX, ProjectileSystem } from '../../src/combat/projectile-system.js';

describe('Explosive Rivet VFX', () => {
  it('renders a multi-layer blast whose shockwave reaches the real AoE radius', () => {
    const circles: any[] = [];
    const circle = vi.fn((_x: number, _y: number, _radius: number, _color: number, _alpha: number) => {
      const item: any = {
        setDepth: vi.fn(() => item),
        setStrokeStyle: vi.fn(() => item),
        destroy: vi.fn()
      };
      circles.push(item);
      return item;
    });
    const addTween = vi.fn();
    const scene: any = { add: { circle }, tweens: { add: addTween } };
    const projectileSystem = new ProjectileSystem(scene);

    const shockwave = projectileSystem.spawnImpactExplosionFx(120, 240, 90);

    expect(shockwave).toBe(circles[2]);
    expect(circle).toHaveBeenCalledTimes(4 + EXPLOSIVE_RIVET_VFX.sparkCount);
    expect(circle.mock.calls[0]).toEqual([120, 240, 8, 0xfff4c7, 1]);
    expect(circle.mock.calls[2]).toEqual([120, 240, 12, 0xff6f2f, .18]);
    expect(circles[2].setStrokeStyle).toHaveBeenCalledWith(5, 0xffd38a, 1);

    const shockwaveTween = addTween.mock.calls.map(call => call[0]).find(tween => tween.targets === shockwave);
    expect(shockwaveTween).toMatchObject({
      scale: 7.5,
      alpha: 0,
      duration: EXPLOSIVE_RIVET_VFX.shockwaveDurationMs,
      ease: 'Quad.Out'
    });
    expect(addTween).toHaveBeenCalledTimes(4 + EXPLOSIVE_RIVET_VFX.sparkCount);
  });

  it('keeps a minimum readable footprint for unexpectedly small radii', () => {
    const circle = vi.fn(() => {
      const item: any = {
        setDepth: vi.fn(() => item),
        setStrokeStyle: vi.fn(() => item),
        destroy: vi.fn()
      };
      return item;
    });
    const addTween = vi.fn();
    const scene: any = { add: { circle }, tweens: { add: addTween } };
    const projectileSystem = new ProjectileSystem(scene);

    const shockwave = projectileSystem.spawnImpactExplosionFx(0, 0, 20);
    const shockwaveTween = addTween.mock.calls.map(call => call[0]).find(tween => tween.targets === shockwave);

    expect(shockwaveTween.scale).toBe(EXPLOSIVE_RIVET_VFX.minReadableRadius / 12);
  });
});

import { describe, expect, it } from 'vitest';
import { segmentCircleHit } from '../../src/combat/projectile-system.js';

describe('ProjectileSystem swept collision rule', () => {
  it('detects a circle crossed between frames and returns the earliest segment position', () => {
    const t = segmentCircleHit(0, 0, 100, 0, 50, 0, 10);
    expect(t).not.toBeNull();
    expect(t!).toBeCloseTo(.5, 6);
  });

  it('ignores a circle outside the swept path', () => {
    expect(segmentCircleHit(0, 0, 100, 0, 50, 30, 10)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { resolveShotgunCropOrigin } from '../../src/characters/shotgun-layered-locomotion.js';

const CANVAS = { width: 128, height: 148 };
const ORIGIN = { x: 0.5, y: 0.52 };

function expectCropToShareFullBodyAnchor(crop: [number, number, number, number]) {
  const origin = resolveShotgunCropOrigin({
    canvasWidth: CANVAS.width,
    canvasHeight: CANVAS.height,
    cropX: crop[0],
    cropY: crop[1],
    cropWidth: crop[2],
    cropHeight: crop[3],
    originX: ORIGIN.x,
    originY: ORIGIN.y
  });
  expect(crop[0] + crop[2] * origin.x).toBeCloseTo(CANVAS.width * ORIGIN.x, 6);
  expect(crop[1] + crop[3] * origin.y).toBeCloseTo(CANVAS.height * ORIGIN.y, 6);
}

describe('Wrecker layered crop anchors', () => {
  it('keeps both leg crops and torso crop registered to the same full-body anchor', () => {
    expectCropToShareFullBodyAnchor([60, 81, 68, 67]);
    expectCropToShareFullBodyAnchor([0, 81, 68, 67]);
    expectCropToShareFullBodyAnchor([0, 0, 128, 107]);
  });

  it('uses opposite compensated horizontal origins for the two lower-body halves', () => {
    const right = resolveShotgunCropOrigin({
      canvasWidth: 128, canvasHeight: 148,
      cropX: 60, cropY: 81, cropWidth: 68, cropHeight: 67,
      originX: 0.5, originY: 0.52
    });
    const left = resolveShotgunCropOrigin({
      canvasWidth: 128, canvasHeight: 148,
      cropX: 0, cropY: 81, cropWidth: 68, cropHeight: 67,
      originX: 0.5, originY: 0.52
    });
    expect(right.x).toBeCloseTo(4 / 68, 6);
    expect(left.x).toBeCloseTo(64 / 68, 6);
    expect(right.y).toBeCloseTo(left.y, 6);
  });
});

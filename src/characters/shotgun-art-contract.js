/* WRECKMARCH WS14-C — non-runtime Shotgun character production art contract.
 * This module intentionally does not register or activate a playable character.
 * It freezes the measured Runner production geometry so Shotgun art cannot drift
 * in apparent size, foot line, render origin, scale, or grip alignment.
 */
export const SHOTGUN_ART_CONTRACT = Object.freeze({
  canvas: Object.freeze({ width: 128, height: 148 }),
  body: Object.freeze({ maxWidth: 104, maxHeight: 132, footLineY: 140 }),
  render: Object.freeze({ originX: 0.5, originY: 0.52, scale: 0.78 }),
  gripSocket: Object.freeze({ offsetX: 15, offsetY: -5 }),
  facing: Object.freeze({ leftAimIndexMin: 3, leftAimIndexMax: 5 }),
  baseAnimationFrames: Object.freeze({ idle: 2, run: 3 }),
  weaponLayer: Object.freeze({ separateFromBody: true }),
  activation: Object.freeze({ playableOnMain: false })
});

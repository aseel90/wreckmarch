/* WRECKMARCH WS14-C — Shotgun character production art contract.
 * Runtime locomotion uses full-body baked frames only. No body-part crop/rig is
 * permitted in production; authoring rigs must be baked before Phaser consumes them.
 */
export const SHOTGUN_ART_CONTRACT = Object.freeze({
  canvas: Object.freeze({ width: 128, height: 148 }),
  body: Object.freeze({ maxWidth: 104, maxHeight: 132, footLineY: 140 }),
  render: Object.freeze({ originX: 0.5, originY: 0.52, scale: 0.78 }),
  gripSocket: Object.freeze({ offsetX: 10, offsetY: 3 }),
  facing: Object.freeze({ leftAimIndexMin: 3, leftAimIndexMax: 5 }),
  baseAnimationFrames: Object.freeze({ idle: 2, run: 4 }),
  locomotion: Object.freeze({ productionMode: 'baked-full-body', runtimeLimbSplit: false }),
  weaponLayer: Object.freeze({ separateFromBody: true }),
  activation: Object.freeze({ playableOnMain: false })
});

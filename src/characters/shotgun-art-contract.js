/* WRECKMARCH WS14-C — Shotgun character production art contract.
 * Runtime locomotion uses full-body baked frames only. No body-part crop/rig is
 * permitted in production; authoring rigs must be baked before Phaser consumes them.
 *
 * Two-hand contact points are authored in the Wrecker raster/weapon coordinate
 * spaces. They are not inherited from Runner sockets.
 */
const CANVAS = Object.freeze({ width: 128, height: 148 });
const RENDER = Object.freeze({ originX: 0.5, originY: 0.52, scale: 0.78 });
const BODY_REAR_GRIP = Object.freeze({ x: 70, y: 75 });
const BODY_SUPPORT_GRIP = Object.freeze({ x: 103, y: 78 });
const WEAPON_REAR_GRIP = Object.freeze({ x: 18, y: 22 });
const WEAPON_SUPPORT_GRIP = Object.freeze({ x: 51, y: 25 });
const WEAPON_MUZZLE = Object.freeze({ x: 90, y: 17 });

export const SHOTGUN_ART_CONTRACT = Object.freeze({
  canvas: CANVAS,
  body: Object.freeze({ maxWidth: 104, maxHeight: 132, footLineY: 140 }),
  render: RENDER,
  twoHandHold: Object.freeze({
    bodyRearGrip: BODY_REAR_GRIP,
    bodySupportGrip: BODY_SUPPORT_GRIP,
    weaponRearGrip: WEAPON_REAR_GRIP,
    weaponSupportGrip: WEAPON_SUPPORT_GRIP,
    weaponMuzzle: WEAPON_MUZZLE
  }),
  gripSocket: Object.freeze({
    offsetX: (BODY_REAR_GRIP.x - (CANVAS.width * RENDER.originX)) * RENDER.scale,
    offsetY: (BODY_REAR_GRIP.y - (CANVAS.height * RENDER.originY)) * RENDER.scale
  }),
  facing: Object.freeze({ leftAimIndexMin: 3, leftAimIndexMax: 5 }),
  baseAnimationFrames: Object.freeze({ idle: 2, run: 4 }),
  locomotion: Object.freeze({ productionMode: 'baked-full-body', runtimeLimbSplit: false }),
  weaponLayer: Object.freeze({ separateFromBody: true }),
  activation: Object.freeze({ playableOnMain: false })
});

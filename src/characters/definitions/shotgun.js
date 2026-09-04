/* WRECKMARCH WS14-E — canonical Shotgun playable-character definition */
import { SHOTGUN_RUNTIME_PRESENTATION } from '../shotgun-runtime-presentation.js?v=1';

const presentation = SHOTGUN_RUNTIME_PRESENTATION;

export const SHOTGUN_CHARACTER = Object.freeze({
  id: 'shotgun',
  displayName: 'Shotgun',
  stats: Object.freeze({
    maxHp: 110,
    moveSpeed: 255
  }),
  combatProfile: Object.freeze({
    armor: 0,
    critChance: 0,
    critDamageMultiplier: 1.5,
    pickupRadiusMultiplier: 1
  }),
  startingWeapon: Object.freeze({
    id: 'shotgun'
  }),
  passive: Object.freeze({
    id: 'shotgun-baseline',
    enabled: false
  }),
  combat: Object.freeze({
    incomingDamageMultiplier: 1,
    contactKnockbackMultiplier: 1,
    invulnerabilityMs: 450,
    contactKnockbackStrength: 190,
    contactKnockbackDurationMs: 140,
    hitFlashColor: 0xff6a5d,
    hitFlashAlpha: .45,
    hitFlashDurationMs: 55,
    hitFlashRepeats: 2
  }),
  physics: Object.freeze({
    radius: 22,
    offsetX: 24,
    offsetY: 46
  }),
  bootstrap: Object.freeze({
    texture: presentation.body.idle[0].key,
    animation: presentation.body.animationKeys.idle,
    scale: presentation.body.render.scale,
    depth: 22
  }),
  render: Object.freeze({
    originX: presentation.body.render.originX,
    originY: presentation.body.render.originY,
    scale: presentation.body.render.scale,
    idleTexture: presentation.body.idle[0].key
  }),
  animations: Object.freeze({
    idle: Object.freeze({
      key: presentation.body.animationKeys.idle,
      frames: Object.freeze(presentation.body.idle.map(frame => frame.key)),
      frameRate: 2
    }),
    run: Object.freeze({
      key: presentation.body.animationKeys.run,
      frames: Object.freeze(presentation.body.run.map(frame => frame.key)),
      frameRate: 10
    })
  }),
  locomotion: Object.freeze({
    movingThresholdSq: .035,
    flipThreshold: .1,
    leanRadians: .055,
    leanLerp: .22,
    settleLerp: .24,
    animationBaseSpeed: 255,
    minTimeScale: .72,
    maxTimeScale: 1.32
  }),
  weapon: Object.freeze({
    socketOffsetX: presentation.body.gripSocket.offsetX,
    socketOffsetY: presentation.body.gripSocket.offsetY,
    leftFacingMinIndex: 3,
    leftFacingMaxIndex: 5,
    muzzleReachStraight: 38,
    muzzleReachDiagonal: 38
  })
});

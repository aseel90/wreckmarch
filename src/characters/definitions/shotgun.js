/* WRECKMARCH WS14-E — canonical Shotgun playable-character definition */
import { SHOTGUN_PRODUCTION_ART } from '../shotgun-production-art.js?v=1';

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
    texture: 'shotgun-idle-0',
    animation: 'character-shotgun-idle',
    scale: .78,
    depth: 22
  }),
  render: Object.freeze({
    originX: .5,
    originY: .52,
    scale: .78,
    idleTexture: 'shotgun-idle-0'
  }),
  animations: Object.freeze({
    idle: Object.freeze({
      key: 'character-shotgun-idle',
      frames: Object.freeze(['shotgun-idle-0', 'shotgun-idle-1']),
      frameRate: 2
    }),
    run: Object.freeze({
      key: 'character-shotgun-run',
      frames: Object.freeze(['shotgun-run-0', 'shotgun-run-1', 'shotgun-run-2']),
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
    socketOffsetX: SHOTGUN_PRODUCTION_ART.geometry.gripSocket.x,
    socketOffsetY: SHOTGUN_PRODUCTION_ART.geometry.gripSocket.y,
    leftFacingMinIndex: 3,
    leftFacingMaxIndex: 5,
    muzzleReachStraight: 38,
    muzzleReachDiagonal: 38
  })
});

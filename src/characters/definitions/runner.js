/* WRECKMARCH F0 — canonical Runner character definition */
export const RUNNER_CHARACTER = Object.freeze({
  id: 'runner',
  displayName: 'Runner',
  stats: Object.freeze({
    maxHp: 100,
    moveSpeed: 255
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
    texture: 'hero-idle-0',
    animation: 'hero-idle',
    scale: .78,
    depth: 22
  }),
  render: Object.freeze({
    originX: .5,
    originY: .52,
    scale: .78,
    idleTexture: 'art-hero-idle-0'
  }),
  animations: Object.freeze({
    idle: Object.freeze({
      key: 'character-runner-idle',
      frames: Object.freeze(['art-hero-idle-0', 'art-hero-idle-1']),
      frameRate: 2
    }),
    run: Object.freeze({
      key: 'character-runner-run',
      frames: Object.freeze(['art-hero-run-0', 'art-hero-run-1']),
      frameRate: 10
    })
  }),
  locomotion: Object.freeze({
    movingThresholdSq: .035,
    flipThreshold: .1,
    leanRadians: .035,
    leanLerp: .18,
    settleLerp: .2,
    animationBaseSpeed: 255,
    minTimeScale: .82,
    maxTimeScale: 1.25
  }),
  weapon: Object.freeze({
    socketOffsetX: 15,
    socketOffsetY: -5,
    leftFacingMinIndex: 3,
    leftFacingMaxIndex: 5,
    muzzleReachStraight: 76,
    muzzleReachDiagonal: 70
  })
});

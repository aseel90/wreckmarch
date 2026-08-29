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
    idleTexture: 'hunter-idle-0'
  }),
  animations: Object.freeze({
    idle: Object.freeze({
      key: 'character-runner-idle',
      frames: Object.freeze(['hunter-idle-0', 'hunter-idle-1']),
      frameRate: 2
    }),
    run: Object.freeze({
      key: 'character-runner-run',
      frames: Object.freeze(['hunter-run-0', 'hunter-run-1', 'hunter-run-2']),
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
    socketOffsetX: 10,
    socketOffsetY: 3,
    leftFacingMinIndex: 3,
    leftFacingMaxIndex: 5,
    muzzleReachStraight: 52,
    muzzleReachDiagonal: 49
  })
});

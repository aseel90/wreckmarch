/* WRECKMARCH — canonical Rust Hound gameplay definition */
export const RUST_HOUND_DEFINITION = Object.freeze({
  id: 'rust-hound',
  name: 'Rust Hound',
  behavior: 'hound-pounce',
  threatValue: 2,
  combat: Object.freeze({
    incomingDamageMultiplier: 1,
    projectileKnockbackMultiplier: .9,
    hitFlashMs: 62
  }),
  naming: Object.freeze({ prefix: 'rusthound' }),
  bootstrap: Object.freeze({
    texture: 'rust-hound-run-0',
    animation: 'rust-hound-run',
    depth: 13,
    scale: Object.freeze({ normal: .72, elite: .84 }),
    physics: Object.freeze({ radius: 25, offsetX: 55, offsetY: 42 }),
    eliteTint: 0xf2a45f
  }),
  behaviorConfig: Object.freeze({
    pounceRangeMin: 108,
    pounceRangeMax: 238,
    holdRange: 132,
    initialCooldownMinMs: 720,
    initialCooldownMaxMs: 980,
    cooldownMinMs: 1580,
    cooldownMaxMs: 2160,
    telegraphMs: 380,
    pounceMs: 310,
    recoverMs: 430,
    pounceSpeed: 348,
    pounceDamageMultiplier: 1.45,
    predictionSeconds: .16,
    maxPredictionPixels: 46,
    chaseSharpness: 8.5,
    holdSharpness: 10.5,
    recoverSharpness: 12,
    pounceTurnRate: .82
  }),
  variants: Object.freeze({
    normal: Object.freeze({
      hpBase: 92,
      hpPerSecond: 1.5,
      speedMin: 182,
      speedMax: 198,
      contactDamage: 12,
      scrapDrop: 2
    }),
    elite: Object.freeze({
      hpBase: 230,
      hpPerSecond: 3,
      speedMin: 190,
      speedMax: 208,
      contactDamage: 19,
      scrapDrop: 5
    })
  })
});

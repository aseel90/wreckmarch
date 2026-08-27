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
    pounceRangeMin: 100,
    pounceRangeMax: 280,
    holdRange: 126,
    initialCooldownMinMs: 220,
    initialCooldownMaxMs: 360,
    cooldownMinMs: 1120,
    cooldownMaxMs: 1480,
    telegraphMs: 280,
    pounceMs: 310,
    recoverMs: 320,
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
      speedMin: 200,
      speedMax: 216,
      contactDamage: 12,
      scrapDrop: 2
    }),
    elite: Object.freeze({
      hpBase: 230,
      hpPerSecond: 3,
      speedMin: 208,
      speedMax: 224,
      contactDamage: 19,
      scrapDrop: 5
    })
  })
});

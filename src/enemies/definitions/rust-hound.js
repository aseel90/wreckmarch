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
    chaseSpeedMultiplier: .72,
    slideRangeMin: 100,
    slideRangeMax: 270,
    holdRange: 130,
    initialCooldownMinMs: 350,
    initialCooldownMaxMs: 550,
    cooldownMinMs: 1450,
    cooldownMaxMs: 1850,
    telegraphMs: 300,
    slideMs: 480,
    recoverMs: 360,
    slideSpeed: 360,
    slideDamageMultiplier: 1.4,
    predictionSeconds: .10,
    maxPredictionPixels: 28,
    chaseSharpness: 7.2,
    holdSharpness: 10.5,
    recoverSharpness: 13
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

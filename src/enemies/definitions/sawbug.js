/* WRECKMARCH — canonical Sawbug acid-spitter gameplay definition */
export const SAWBUG_DEFINITION = Object.freeze({
  id: 'sawbug',
  name: 'Sawbug',
  behavior: 'acid-spitter',
  threatValue: 2,
  combat: Object.freeze({
    incomingDamageMultiplier: 1,
    projectileKnockbackMultiplier: .82,
    hitFlashMs: 58
  }),
  naming: Object.freeze({ prefix: 'sawbug' }),
  bootstrap: Object.freeze({
    texture: 'sawbug-idle-0',
    animation: 'sawbug-walk',
    depth: 12,
    scale: Object.freeze({ normal: .70, elite: .82 }),
    physics: Object.freeze({ radius: 24, offsetX: 56, offsetY: 46 }),
    eliteTint: 0xc6ff53
  }),
  behaviorConfig: Object.freeze({
    preferredRangeMin: 205,
    preferredRangeMax: 315,
    retreatRange: 165,
    approachSpeedMultiplier: .86,
    strafeSpeedMultiplier: .64,
    retreatSpeedMultiplier: .78,
    initialCooldownMinMs: 520,
    initialCooldownMaxMs: 760,
    cooldownMinMs: 1750,
    cooldownMaxMs: 2250,
    telegraphMs: 340,
    recoverMs: 280,
    projectileSpeed: 275,
    projectileLifeMs: 1900,
    projectileDamage: 11,
    projectileScale: .32,
    projectileRadius: 19,
    projectileOffsetX: 29,
    projectileOffsetY: 13,
    predictionSeconds: .15,
    maxPredictionPixels: 42
  }),
  variants: Object.freeze({
    normal: Object.freeze({
      hpBase: 76,
      hpPerSecond: 1.35,
      speedMin: 165,
      speedMax: 190,
      contactDamage: 8,
      scrapDrop: 2
    }),
    elite: Object.freeze({
      hpBase: 185,
      hpPerSecond: 2.8,
      speedMin: 175,
      speedMax: 200,
      contactDamage: 14,
      scrapDrop: 5
    })
  })
});

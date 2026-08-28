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
    preferredRangeMin: 250,
    preferredRangeMax: 380,
    retreatRange: 205,
    approachSpeedMultiplier: .92,
    strafeSpeedMultiplier: .72,
    retreatSpeedMultiplier: .84,
    initialCooldownMinMs: 420,
    initialCooldownMaxMs: 600,
    cooldownMinMs: 1550,
    cooldownMaxMs: 1950,
    telegraphMs: 320,
    recoverMs: 260,
    projectileSpeed: 275,
    projectileLifeMs: 2200,
    projectileDamage: 11,
    projectileScale: .32,
    projectileRadius: 19,
    projectileOffsetX: 29,
    projectileOffsetY: 13,
    predictionSeconds: .18,
    maxPredictionPixels: 58,
    stationaryTargetSpeedThreshold: 24,
    stationaryFireRangeMax: 430,
    stationaryCooldownMultiplier: .78
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

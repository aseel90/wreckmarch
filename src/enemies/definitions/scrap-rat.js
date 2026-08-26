/* WRECKMARCH — canonical Scrap Rat gameplay definition */
export const SCRAP_RAT_DEFINITION = Object.freeze({
  id: 'scrap-rat',
  name: 'Scrap Rat',
  behavior: 'chase',
  naming: Object.freeze({ prefix: 'scraprat' }),
  bootstrap: Object.freeze({
    texture: 'rat-run-0',
    animation: 'rat-run',
    depth: 12,
    scale: Object.freeze({ normal: .88, elite: 1.08 }),
    physics: Object.freeze({ radius: 21, offsetX: 24, offsetY: 17 }),
    eliteTint: 0xe69b56
  }),
  variants: Object.freeze({
    normal: Object.freeze({
      hpBase: 54,
      hpPerSecond: 1.25,
      speedMin: 88,
      speedMax: 122,
      contactDamage: 10,
      scrapDrop: 1
    }),
    elite: Object.freeze({
      hpBase: 110,
      hpPerSecond: 2.4,
      speedMin: 70,
      speedMax: 88,
      contactDamage: 19,
      scrapDrop: 3
    })
  })
});

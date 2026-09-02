/* WRECKMARCH — WS14-B candidate A1 canonical Shotgun weapon definition */
export const SHOTGUN_WEAPON = Object.freeze({
  id: 'shotgun',
  displayName: 'Shotgun',
  stats: Object.freeze({
    damage: 24,
    fireDelay: 720,
    projectileSpeed: 760,
    range: 330,
    pierceCount: 0,
    ricochetCount: 0,
    shrapnelCount: 0
  }),
  fireProfile: Object.freeze({
    projectileCount: 5,
    halfSpreadRadians: 0.24,
    volleyDamageMultiplier: 1.75
  }),
  runtime: Object.freeze({
    muzzleDistance: 38
  })
});

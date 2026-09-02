/* WRECKMARCH — canonical Rivet Gun weapon definition */
export const RIVET_GUN_WEAPON = Object.freeze({
  id: 'rivet-gun',
  displayName: 'Rivet Gun',
  stats: Object.freeze({
    damage: 24,
    fireDelay: 390,
    projectileSpeed: 760,
    range: 570,
    pierceCount: 0,
    ricochetCount: 0,
    shrapnelCount: 0
  }),
  runtime: Object.freeze({
    muzzleDistance: 38
  })
});

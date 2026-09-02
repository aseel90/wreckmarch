/* WRECKMARCH — canonical Fortress Rig support-combat budget */

export const FORTRESS_RIG_COMBAT_PROFILE = Object.freeze({
  fireDelayMs: 920,
  projectileCount: 1,
  projectileDamage: 13.92,
  projectileSpeed: 680,
  targetRange: 560,
  muzzleDistance: 61,
  projectileLifeMs: 1100,
  projectileScale: .66
});

export function fortressRigNominalDps(profile = FORTRESS_RIG_COMBAT_PROFILE) {
  const cadence = Math.max(1, Number(profile?.fireDelayMs) || 1);
  const shots = Math.max(1, Math.floor(Number(profile?.projectileCount) || 1));
  const damage = Math.max(0, Number(profile?.projectileDamage) || 0);
  return damage * shots * 1000 / cadence;
}

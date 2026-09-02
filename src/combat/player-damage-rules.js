/* WRECKMARCH — pure player contact-damage rules */
export const ARMOR_MITIGATION_PROFILE = Object.freeze({
  ratingScale: 100,
  maxMitigationFraction: .5
});

export const DEFAULT_PLAYER_COMBAT_PROFILE = Object.freeze({
  incomingDamageMultiplier: 1,
  contactKnockbackMultiplier: 1,
  invulnerabilityMs: 450,
  contactKnockbackStrength: 190,
  contactKnockbackDurationMs: 140,
  hitFlashColor: 0xff6a5d,
  hitFlashAlpha: .45,
  hitFlashDurationMs: 55,
  hitFlashRepeats: 2
});

function finiteOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function resolveArmorMitigation(armor) {
  const rating = Math.max(0, finiteOr(armor, 0));
  if (rating <= 0) return 0;
  return Math.min(
    ARMOR_MITIGATION_PROFILE.maxMitigationFraction,
    rating / (rating + ARMOR_MITIGATION_PROFILE.ratingScale)
  );
}

export function resolvePlayerContactHit({
  currentHp,
  lastHitAt,
  now,
  enemyDamage,
  heroX,
  heroY,
  enemyX,
  enemyY,
  profile = {},
  shieldCharges = 0,
  armor = 0
}) {
  const combat = { ...DEFAULT_PLAYER_COMBAT_PROFILE, ...profile };
  const hitAt = finiteOr(lastHitAt, -Infinity);
  const hitNow = finiteOr(now, 0);
  const invulnerabilityMs = Math.max(0, finiteOr(combat.invulnerabilityMs, 450));

  if (hitNow < hitAt + invulnerabilityMs) {
    return {
      ignored: true,
      appliedDamage: 0,
      preArmorDamage: 0,
      armorMitigationFraction: 0,
      armorPreventedDamage: 0,
      preventedDamage: 0,
      shieldAbsorbed: false,
      nextShieldCharges: Math.max(0, Math.floor(finiteOr(shieldCharges, 0))),
      nextHp: Math.max(0, finiteOr(currentHp, 0)),
      killed: false,
      invulnerableUntil: hitAt + invulnerabilityMs,
      knockbackX: 0,
      knockbackY: 0,
      knockbackUntil: 0
    };
  }

  const incomingDamageMultiplier = Math.max(0, finiteOr(combat.incomingDamageMultiplier, 1));
  const baseDamage = Math.max(1, Math.round(finiteOr(enemyDamage, 1)));
  const preArmorDamage = Math.max(1, Math.round(baseDamage * incomingDamageMultiplier));
  const armorMitigationFraction = resolveArmorMitigation(armor);
  const mitigatedDamage = Math.max(1, Math.round(preArmorDamage * (1 - armorMitigationFraction)));
  const armorPreventedDamage = Math.max(0, preArmorDamage - mitigatedDamage);
  const hp = Math.max(0, finiteOr(currentHp, 0));
  const availableShieldCharges = Math.max(0, Math.floor(finiteOr(shieldCharges, 0)));
  const shieldAbsorbed = availableShieldCharges > 0;
  const nextShieldCharges = shieldAbsorbed ? availableShieldCharges - 1 : availableShieldCharges;
  const preventedDamage = shieldAbsorbed ? mitigatedDamage : 0;
  const nextHp = shieldAbsorbed ? hp : Math.max(0, hp - mitigatedDamage);

  let dx = finiteOr(heroX, 0) - finiteOr(enemyX, 0);
  let dy = finiteOr(heroY, 0) - finiteOr(enemyY, 0);
  let length = Math.hypot(dx, dy);
  if (length < 1) {
    dx = 1;
    dy = 0;
    length = 1;
  }
  dx /= length;
  dy /= length;

  const knockbackStrength = Math.max(0, finiteOr(combat.contactKnockbackStrength, 190)) *
    Math.max(0, finiteOr(combat.contactKnockbackMultiplier, 1));
  const knockbackDurationMs = Math.max(0, finiteOr(combat.contactKnockbackDurationMs, 140));

  return {
    ignored: false,
    appliedDamage: shieldAbsorbed ? 0 : mitigatedDamage,
    preArmorDamage,
    armorMitigationFraction,
    armorPreventedDamage,
    preventedDamage,
    shieldAbsorbed,
    nextShieldCharges,
    nextHp,
    killed: !shieldAbsorbed && nextHp <= 0,
    invulnerableUntil: hitNow + invulnerabilityMs,
    knockbackX: dx * knockbackStrength,
    knockbackY: dy * knockbackStrength,
    knockbackUntil: hitNow + knockbackDurationMs
  };
}

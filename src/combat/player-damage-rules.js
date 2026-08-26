/* WRECKMARCH — pure player contact-damage rules */
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

export function resolvePlayerContactHit({
  currentHp,
  lastHitAt,
  now,
  enemyDamage,
  heroX,
  heroY,
  enemyX,
  enemyY,
  profile = {}
}) {
  const combat = { ...DEFAULT_PLAYER_COMBAT_PROFILE, ...profile };
  const hitAt = finiteOr(lastHitAt, -Infinity);
  const hitNow = finiteOr(now, 0);
  const invulnerabilityMs = Math.max(0, finiteOr(combat.invulnerabilityMs, 450));

  if (hitNow < hitAt + invulnerabilityMs) {
    return {
      ignored: true,
      appliedDamage: 0,
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
  const appliedDamage = Math.max(1, Math.round(baseDamage * incomingDamageMultiplier));
  const hp = Math.max(0, finiteOr(currentHp, 0));
  const nextHp = Math.max(0, hp - appliedDamage);

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
    appliedDamage,
    nextHp,
    killed: nextHp <= 0,
    invulnerableUntil: hitNow + invulnerabilityMs,
    knockbackX: dx * knockbackStrength,
    knockbackY: dy * knockbackStrength,
    knockbackUntil: hitNow + knockbackDurationMs
  };
}

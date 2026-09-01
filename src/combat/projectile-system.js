/* WRECKMARCH — authoritative projectile creation, swept collision and lifetime owner */
import { POWER_BUDGET } from '../balance/power-budget.js?v=1';

export function segmentCircleHit(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > .0001) t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  const ox = px - cx;
  const oy = py - cy;
  return ox * ox + oy * oy <= radius * radius ? t : null;
}

const DEFAULT_SHRAPNEL_PROFILE = Object.freeze({
  fallbackDamageScale: .25,
  speedScale: .68,
  minSpeed: 420,
  lifeMs: 260,
  spreadRadians: 1.1,
  scale: .42,
  radius: 3,
  offsetX: 1,
  offsetY: 1,
  maxFragments: 4
});

const SECONDARY_DAMAGE_BUDGET = POWER_BUDGET.chainedMechanics;

function boundedInteger(value, max) {
  return Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
}

export function resolveProjectileSecondaryDamageBudget({ pierceCount = 0, ricochetCount = 0, shrapnelCount = 0, explosionLevel = 0 } = {}) {
  const profiles = SECONDARY_DAMAGE_BUDGET.profiles;
  const pierce = boundedInteger(pierceCount, profiles.pierce.maxAdditionalTargets);
  const ricochet = boundedInteger(ricochetCount, profiles.ricochet.maxBounces);
  const shrapnel = boundedInteger(shrapnelCount, profiles.shrapnel.maxFragments);
  const explosion = boundedInteger(explosionLevel, profiles.explosion.targetCapByLevel.length - 1);

  const requestedPierce = Number(profiles.pierce.standaloneAddedDamageByCount[pierce]) || 0;
  const requestedRicochet = Number(profiles.ricochet.standaloneAddedDamageByCount[ricochet]) || 0;
  const shrapnelTable = profiles.shrapnel.standaloneAddedDamageByFragmentCount;
  const requestedShrapnel = Number(shrapnelTable[shrapnel]) || Math.min(
    SECONDARY_DAMAGE_BUDGET.perMechanicAddedDamageSoftCaps.shrapnel,
    shrapnel * .25
  );
  const explosionTargetCap = Number(profiles.explosion.targetCapByLevel[explosion]) || 0;
  const requestedExplosion = explosionTargetCap * (Number(profiles.explosion.damageCoefficient) || 0);
  const requestedCombined = requestedPierce + requestedRicochet + requestedShrapnel + requestedExplosion;
  const combinedScale = requestedCombined > SECONDARY_DAMAGE_BUDGET.combinedAddedDamageSoftCap
    ? SECONDARY_DAMAGE_BUDGET.combinedAddedDamageSoftCap / requestedCombined
    : 1;

  const pierceAddedDamage = requestedPierce * combinedScale;
  const ricochetAddedDamage = requestedRicochet * combinedScale;
  const shrapnelAddedDamage = requestedShrapnel * combinedScale;
  const explosionAddedDamage = requestedExplosion * combinedScale;

  return Object.freeze({
    pierceCount: pierce,
    ricochetCount: ricochet,
    shrapnelCount: shrapnel,
    explosionLevel: explosion,
    explosionTargetCap,
    requestedCombinedAddedDamage: requestedCombined,
    combinedAddedDamage: pierceAddedDamage + ricochetAddedDamage + shrapnelAddedDamage + explosionAddedDamage,
    combinedScale,
    pierceAddedDamage,
    ricochetAddedDamage,
    shrapnelAddedDamage,
    explosionAddedDamage,
    piercePerHitDamageScale: pierce > 0 ? pierceAddedDamage / pierce : 0,
    ricochetPerHitDamageScale: ricochet > 0 ? ricochetAddedDamage / ricochet : 0,
    shrapnelPerFragmentDamageScale: shrapnel > 0 ? shrapnelAddedDamage / shrapnel : 0,
    explosionDamageScale: explosionTargetCap > 0 ? explosionAddedDamage / explosionTargetCap : 0
  });
}

export class ProjectileSystem {
  /** @param {any} scene */
  constructor(scene) {
    this.scene = scene;
    this.randomSource = Math.random;
    this.bounds = {
      minX: -80,
      maxX: 2280,
      minY: -80,
      maxY: 2280
    };
  }

  configureBounds(bounds = {}) {
    this.bounds = { ...this.bounds, ...bounds };
    return this;
  }

  setRandomSource(source) {
    if (typeof source !== 'function') throw new TypeError('ProjectileSystem random source must be a function');
    this.randomSource = source;
    return this;
  }

  spawn({
    x,
    y,
    angle,
    speed,
    damage,
    pierceCount = 0,
    ricochetCount = 0,
    ricochetRange = 360,
    ricochetTargetMode = 'random',
    shrapnelCount = 0,
    explosionLevel = 0,
    explosionRadius = 0,
    explosiveRivetArmed = false,
    lifeMs,
    scale = .74,
    tint = null,
    depth = 30,
    radius = 8,
    offsetX = 2,
    offsetY = 2,
    texture = 'bullet'
  }) {
    const bullet = this.scene.bullets.create(x, y, texture).setDepth(depth).setScale(scale);
    if (tint != null) bullet.setTint(tint);
    bullet.setCircle(radius, offsetX, offsetY);
    const secondaryBudget = resolveProjectileSecondaryDamageBudget({ pierceCount, ricochetCount, shrapnelCount, explosionLevel });
    bullet.damage = damage;
    bullet.primaryDamage = Math.max(0, Number(damage) || 0);
    bullet.secondaryDamageBudget = secondaryBudget;
    bullet.pierceRemaining = secondaryBudget.pierceCount;
    bullet.pierceDamageScale = secondaryBudget.piercePerHitDamageScale;
    bullet.ricochetRemaining = secondaryBudget.ricochetCount;
    bullet.ricochetDamageScale = secondaryBudget.ricochetPerHitDamageScale;
    bullet.ricochetRange = Math.max(0, Number(ricochetRange) || 0);
    bullet.ricochetTargetMode = ricochetTargetMode === 'nearest' ? 'nearest' : 'random';
    bullet.shrapnelCount = secondaryBudget.shrapnelCount;
    bullet.shrapnelDamageScale = secondaryBudget.shrapnelPerFragmentDamageScale;
    bullet.shrapnelTriggered = false;
    bullet.explosiveRivetArmed = Boolean(explosiveRivetArmed && secondaryBudget.explosionLevel > 0);
    bullet.explosionTriggered = false;
    bullet.explosionLevel = secondaryBudget.explosionLevel;
    bullet.explosionDamageScale = secondaryBudget.explosionDamageScale;
    bullet.explosionTargetCap = secondaryBudget.explosionTargetCap;
    bullet.explosionRadius = Math.max(0, Number(explosionRadius) || Number(SECONDARY_DAMAGE_BUDGET.profiles.explosion.radiusByLevel[secondaryBudget.explosionLevel]) || 0);
    bullet.hitEnemies = new Set();
    bullet.life = lifeMs;
    bullet.prevX = x;
    bullet.prevY = y;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    return bullet;
  }

  findExplosionTargets(originX, originY, radius, targetCap) {
    const maxDistanceSq = Math.max(0, Number(radius) || 0) ** 2;
    const cap = Math.max(0, Math.floor(Number(targetCap) || 0));
    if (cap <= 0 || maxDistanceSq <= 0) return [];
    const candidates = [];
    this.scene.enemies.children.iterate(enemy => {
      if (!enemy?.active || enemy.hp <= 0) return;
      const dx = Number(enemy.x) - originX;
      const dy = Number(enemy.y) - originY;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq <= maxDistanceSq) candidates.push({ enemy, distanceSq });
    });
    candidates.sort((a, b) => a.distanceSq - b.distanceSq);
    return candidates.slice(0, cap).map(entry => entry.enemy);
  }

  spawnImpactExplosionFx(x, y, radius) {
    const scene = this.scene;
    if (!scene?.add?.circle || !scene?.tweens?.add) return null;
    const ring = scene.add.circle(x, y, 10, 0xd86d31, .05)
      .setStrokeStyle?.(2, 0xffbd69, .9)
      ?.setDepth?.(35) || null;
    if (!ring) return null;
    const targetScale = Math.max(1, Math.max(10, Number(radius) || 0) / 10);
    scene.tweens.add({
      targets: ring,
      scale: targetScale,
      alpha: 0,
      duration: 150,
      ease: 'Quad.Out',
      onComplete: () => ring.destroy?.()
    });
    return ring;
  }

  spawnImpactShrapnel({
    x,
    y,
    angle,
    speed,
    damage,
    count,
    damageScale = null,
    texture = 'bullet',
    excludedEnemies = []
  }) {
    const profile = DEFAULT_SHRAPNEL_PROFILE;
    const fragmentCount = Math.min(profile.maxFragments, Math.max(0, Math.floor(Number(count) || 0)));
    if (fragmentCount <= 0) return [];

    const sourceSpeed = Math.max(0, Number(speed) || 0);
    const fragmentSpeed = Math.max(profile.minSpeed, sourceSpeed * profile.speedScale);
    const resolvedDamageScale = Number.isFinite(Number(damageScale)) && Number(damageScale) >= 0
      ? Number(damageScale)
      : profile.fallbackDamageScale;
    const fragmentDamage = Math.max(1, (Number(damage) || 0) * resolvedDamageScale);
    const excluded = excludedEnemies instanceof Set ? excludedEnemies : new Set(excludedEnemies || []);
    const fragments = [];

    for (let index = 0; index < fragmentCount; index += 1) {
      const ratio = fragmentCount === 1 ? .5 : index / (fragmentCount - 1);
      const fragmentAngle = angle + (ratio - .5) * profile.spreadRadians;
      const fragment = this.spawn({
        x,
        y,
        angle: fragmentAngle,
        speed: fragmentSpeed,
        damage: fragmentDamage,
        lifeMs: profile.lifeMs,
        scale: profile.scale,
        radius: profile.radius,
        offsetX: profile.offsetX,
        offsetY: profile.offsetY,
        texture: texture || 'bullet'
      });
      fragment.isSecondaryProjectile = true;
      fragment.projectileKind = 'shrapnel';
      fragment.hitEnemies = new Set(excluded);
      fragment.setRotation?.(fragmentAngle);
      fragments.push(fragment);
    }
    return fragments;
  }

  findEarliestEnemyHit(bullet, x1, y1, x2, y2) {
    let bestEnemy = null;
    let bestT = Infinity;
    this.scene.enemies.children.iterate(enemy => {
      if (!enemy?.active || enemy.hp <= 0 || bullet.hitEnemies?.has?.(enemy)) return;
      const radius = (enemy.hitRadius || 25) + 5;
      const centerX = enemy.x + (enemy.flipX ? -4 : 4);
      const centerY = enemy.y + 1;
      const t = segmentCircleHit(x1, y1, x2, y2, centerX, centerY, radius);
      if (t !== null && t < bestT) {
        bestT = t;
        bestEnemy = enemy;
      }
    });
    return bestEnemy;
  }

  findRicochetTarget(bullet, originX, originY) {
    const maxDistanceSq = Math.max(0, Number(bullet.ricochetRange) || 0) ** 2;
    const eligible = [];
    this.scene.enemies.children.iterate(enemy => {
      if (!enemy?.active || enemy.hp <= 0 || bullet.hitEnemies?.has?.(enemy)) return;
      const dx = enemy.x - originX;
      const dy = enemy.y - originY;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq <= maxDistanceSq) eligible.push({ enemy, distanceSq });
    });
    if (!eligible.length) return null;
    if (bullet.ricochetTargetMode === 'nearest') {
      eligible.sort((a, b) => a.distanceSq - b.distanceSq);
      return eligible[0].enemy;
    }
    const roll = Number(this.randomSource());
    const normalizedRoll = Number.isFinite(roll) ? Math.min(.999999999, Math.max(0, roll)) : 0;
    return eligible[Math.floor(normalizedRoll * eligible.length)].enemy;
  }

  redirectRicochet(bullet, originX, originY) {
    const target = this.findRicochetTarget(bullet, originX, originY);
    if (!target) {
      bullet.destroy();
      return false;
    }
    const speed = Math.hypot(Number(bullet.body?.velocity?.x) || 0, Number(bullet.body?.velocity?.y) || 0);
    const angle = Math.atan2(target.y - originY, target.x - originX);
    bullet.ricochetRemaining = Math.max(0, Math.floor(Number(bullet.ricochetRemaining) || 0) - 1);
    const primaryDamage = Math.max(0, Number(bullet.primaryDamage ?? bullet.damage) || 0);
    const ricochetDamageScale = Math.max(0, Number(bullet.ricochetDamageScale) || 0);
    bullet.damage = primaryDamage * ricochetDamageScale;
    bullet.projectilePath = 'ricochet';
    bullet.setPosition?.(originX, originY);
    if (bullet.body?.velocity?.setToPolar) bullet.body.velocity.setToPolar(angle, speed);
    else bullet.setVelocity?.(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.prevX = originX;
    bullet.prevY = originY;
    return true;
  }

  update(delta) {
    const scene = this.scene;
    scene.bullets.children.iterate(bullet => {
      if (!bullet?.active) return;
      bullet.life -= delta;

      if (bullet.ricochetPending) {
        const origin = bullet.ricochetPending;
        bullet.ricochetPending = null;
        this.redirectRicochet(bullet, origin.x, origin.y);
        if (!bullet.active) return;
      }

      const x2 = bullet.x;
      const y2 = bullet.y;
      const x1 = Number.isFinite(bullet.prevX) ? bullet.prevX : x2;
      const y1 = Number.isFinite(bullet.prevY) ? bullet.prevY : y2;
      const hitEnemy = scene.combatSystem?.hitEnemyByProjectile;
      if (typeof hitEnemy === 'function') {
        while (bullet.active) {
          const enemy = this.findEarliestEnemyHit(bullet, x1, y1, x2, y2);
          if (!enemy) break;
          const beforeHits = bullet.hitEnemies?.size || 0;
          const hadPierce = Math.max(0, Math.floor(Number(bullet.pierceRemaining) || 0)) > 0;
          const originX = Number(enemy.x) || 0;
          const originY = Number(enemy.y) || 0;
          hitEnemy.call(scene.combatSystem, bullet, enemy);
          const afterHits = bullet.hitEnemies?.size || 0;
          const shouldRicochet = !hadPierce && bullet.active && Math.max(0, Math.floor(Number(bullet.ricochetRemaining) || 0)) > 0;
          if (shouldRicochet) {
            bullet.ricochetPending = null;
            this.redirectRicochet(bullet, originX, originY);
            break;
          }
          if (bullet.active && afterHits <= beforeHits) break;
        }
      }
      if (!bullet.active) return;

      bullet.prevX = bullet.x;
      bullet.prevY = bullet.y;
      const b = this.bounds;
      if (bullet.life <= 0 || bullet.x < b.minX || bullet.x > b.maxX || bullet.y < b.minY || bullet.y > b.maxY) {
        bullet.destroy();
      }
    });
  }
}

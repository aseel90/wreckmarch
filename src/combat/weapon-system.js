/* WRECKMARCH — authoritative target acquisition and weapon firing owner */

export function resolveHeroCriticalHit(combatStats = {}, rng = Math.random) {
  const critChance = Math.min(1, Math.max(0, Number(combatStats?.critChance) || 0));
  const critDamageMultiplier = Math.max(1, Number(combatStats?.critDamageMultiplier) || 1);
  if (critChance <= 0) {
    return Object.freeze({
      isCritical: false,
      critChance,
      critDamageMultiplier,
      roll: null,
      damageMultiplier: 1
    });
  }
  if (typeof rng !== 'function') throw new TypeError('Critical hit RNG must be a function');
  const roll = Number(rng());
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError(`Critical hit RNG must return a value in [0, 1): ${String(roll)}`);
  }
  const isCritical = roll < critChance;
  return Object.freeze({
    isCritical,
    critChance,
    critDamageMultiplier,
    roll,
    damageMultiplier: isCritical ? critDamageMultiplier : 1
  });
}

export function buildSymmetricSpreadOffsets(projectileCount = 1, halfSpreadRadians = 0) {
  const count = Math.max(1, Math.floor(Number(projectileCount) || 1));
  const halfSpread = Math.max(0, Number(halfSpreadRadians) || 0);
  if (count === 1 || halfSpread === 0) return Array.from({ length: count }, () => 0);
  if (count === 2) return [-halfSpread, halfSpread];
  const step = (halfSpread * 2) / (count - 1);
  return Array.from({ length: count }, (_, index) => -halfSpread + step * index);
}

const DEFAULT_HERO_PROFILE = Object.freeze({
  aimYOffset: 6,
  targetTurnRate: .22,
  moveTurnRate: .14,
  twinSpread2: .055,
  twinSpread3: .085,
  multiShotDamageScale: .9,
  projectile: Object.freeze({
    lifeMs: 1180,
    scale: .74,
    radius: 8,
    offsetX: 2,
    offsetY: 2
  })
});

export class WeaponSystem {
  /** @param {any} scene */
  constructor(scene, { projectileSystem }) {
    this.scene = scene;
    this.projectiles = projectileSystem;
    this.heroProfile = {
      ...DEFAULT_HERO_PROFILE,
      projectile: { ...DEFAULT_HERO_PROFILE.projectile }
    };
    this.muzzleResolver = null;
    this.fireFeedback = null;
    this.randomSource = Math.random;
    this.explosiveRivetRuntime = { level: 0, cadenceMs: 0, armed: false, nextArmAt: null };
  }

  configureHero(profile = {}) {
    const projectile = profile.projectile
      ? { ...this.heroProfile.projectile, ...profile.projectile }
      : this.heroProfile.projectile;
    this.heroProfile = { ...this.heroProfile, ...profile, projectile };
    if ('muzzleResolver' in profile) this.setMuzzleResolver(profile.muzzleResolver);
    if ('fireFeedback' in profile) this.setFireFeedback(profile.fireFeedback);
    return this;
  }

  setMuzzleResolver(resolver) {
    this.muzzleResolver = typeof resolver === 'function' ? resolver : null;
    return this;
  }

  setFireFeedback(handler) {
    this.fireFeedback = typeof handler === 'function' ? handler : null;
    return this;
  }

  setRandomSource(source) {
    if (typeof source !== 'function') throw new TypeError('WeaponSystem random source must be a function');
    this.randomSource = source;
    return this;
  }

  acquireTarget(x, y, maxDistance = Infinity) {
    let best = null;
    let bestSq = maxDistance * maxDistance;
    this.scene.enemies.children.iterate(enemy => {
      if (!enemy?.active || enemy.hp <= 0) return;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < bestSq) {
        best = enemy;
        bestSq = distanceSq;
      }
    });
    return best;
  }

  getMuzzle(spread = 0) {
    if (this.muzzleResolver) return this.muzzleResolver(spread);
    const scene = this.scene;
    const angle = (scene.weaponAim || 0) + spread;
    const distance = scene.primaryWeapon?.muzzleDistance || 38;
    return new Phaser.Math.Vector2(
      scene.hero.x + Math.cos(angle) * distance,
      scene.hero.y + 6 + Math.sin(angle) * distance
    );
  }

  heroVolleyProfile() {
    const scene = this.scene;
    const mechanicalState = scene.upgradeMechanicalState?.['triple-riveter'] || scene.upgradeMechanicalState?.['twin-riveter'];
    const mechanicalCount = Math.max(0, Math.floor(Number(mechanicalState?.projectileCount) || 0));
    if (mechanicalCount > 0) {
      const halfSpreadRadians = mechanicalCount === 2 ? this.heroProfile.twinSpread2 : this.heroProfile.twinSpread3;
      const stateScale = Number(mechanicalState?.projectileDamageScale);
      const projectileDamageScale = Number.isFinite(stateScale) && stateScale > 0
        ? stateScale
        : 1 / mechanicalCount;
      return Object.freeze({
        source: 'upgrade',
        projectileCount: mechanicalCount,
        halfSpreadRadians,
        volleyDamageMultiplier: projectileDamageScale * mechanicalCount,
        projectileDamageScale,
        spreads: Object.freeze(buildSymmetricSpreadOffsets(mechanicalCount, halfSpreadRadians))
      });
    }

    const mirroredTwinCount = Math.max(1, Math.floor(Number(scene.twinShots) || 1));
    if (mirroredTwinCount > 1) {
      const projectileCount = mirroredTwinCount === 2 ? 2 : 3;
      const halfSpreadRadians = projectileCount === 2 ? this.heroProfile.twinSpread2 : this.heroProfile.twinSpread3;
      const projectileDamageScale = this.heroProfile.multiShotDamageScale;
      return Object.freeze({
        source: 'upgrade-mirror',
        projectileCount,
        halfSpreadRadians,
        volleyDamageMultiplier: projectileDamageScale * projectileCount,
        projectileDamageScale,
        spreads: Object.freeze(buildSymmetricSpreadOffsets(projectileCount, halfSpreadRadians))
      });
    }

    const fireProfile = scene.primaryWeapon?.fireProfile || scene.weaponDefinition?.fireProfile || {};
    const projectileCount = Math.max(1, Math.floor(Number(fireProfile.projectileCount) || 1));
    const halfSpreadRadians = Math.max(0, Number(fireProfile.halfSpreadRadians) || 0);
    const volleyDamageMultiplier = Number.isFinite(Number(fireProfile.volleyDamageMultiplier)) && Number(fireProfile.volleyDamageMultiplier) > 0
      ? Number(fireProfile.volleyDamageMultiplier)
      : 1;
    return Object.freeze({
      source: 'weapon',
      projectileCount,
      halfSpreadRadians,
      volleyDamageMultiplier,
      projectileDamageScale: volleyDamageMultiplier / projectileCount,
      spreads: Object.freeze(buildSymmetricSpreadOffsets(projectileCount, halfSpreadRadians))
    });
  }

  heroSpreads() {
    return [...this.heroVolleyProfile().spreads];
  }

  heroProjectileDamageScale(projectileCount = null) {
    const profile = this.heroVolleyProfile();
    if (projectileCount == null || Math.max(1, Number(projectileCount) || 1) === profile.projectileCount) {
      return profile.projectileDamageScale;
    }
    const count = Math.max(1, Number(projectileCount) || 1);
    return count > 1 ? this.heroProfile.multiShotDamageScale : 1;
  }

  syncExplosiveRivet(time) {
    const state = this.scene.upgradeMechanicalState?.['explosive-rivet'];
    const level = Math.max(0, Math.floor(Number(state?.level) || 0));
    const cadenceMs = Math.max(0, Number(state?.cadenceMs) || 0);
    const runtime = this.explosiveRivetRuntime;
    if (level <= 0 || cadenceMs <= 0) {
      runtime.level = 0;
      runtime.cadenceMs = 0;
      runtime.armed = false;
      runtime.nextArmAt = null;
      return null;
    }
    if (runtime.level !== level || runtime.cadenceMs !== cadenceMs || runtime.nextArmAt == null) {
      runtime.level = level;
      runtime.cadenceMs = cadenceMs;
      runtime.armed = false;
      runtime.nextArmAt = Number(time) + cadenceMs;
    }
    if (!runtime.armed && Number(time) >= runtime.nextArmAt) runtime.armed = true;
    return state;
  }

  consumeExplosiveRivet(time) {
    const runtime = this.explosiveRivetRuntime;
    if (!runtime.armed || runtime.level <= 0 || runtime.cadenceMs <= 0) return false;
    runtime.armed = false;
    runtime.nextArmAt = Number(time) + runtime.cadenceMs;
    return true;
  }

  /**
   * @param {number} angle
   * @param {number} [damageScale]
   * @param {{ explosiveRivet?: any }} [options]
   */
  fireHeroProjectile(angle, damageScale = 1, options = {}) {
    const explosiveRivet = options.explosiveRivet ?? null;
    const scene = this.scene;
    const weapon = scene.primaryWeapon;
    if (!weapon) return null;
    const muzzle = this.getMuzzle(angle - scene.weaponAim);
    const p = this.heroProfile.projectile;
    const resolvedWeapon = scene.runStatState?.resolve?.()?.weapon || {};
    const baseDamage = weapon.damage * damageScale;
    const critical = resolveHeroCriticalHit(scene.runCombatStats, this.randomSource);
    const bullet = this.projectiles.spawn({
      x: muzzle.x,
      y: muzzle.y,
      angle,
      speed: weapon.projectileSpeed,
      damage: baseDamage * critical.damageMultiplier,
      pierceCount: Math.max(0, Math.floor(Number(resolvedWeapon.pierceCount ?? weapon.pierceCount) || 0)),
      ricochetCount: Math.max(0, Math.floor(Number(resolvedWeapon.ricochetCount ?? weapon.ricochetCount) || 0)),
      shrapnelCount: Math.max(0, Math.floor(Number(resolvedWeapon.shrapnelCount ?? weapon.shrapnelCount) || 0)),
      explosionLevel: explosiveRivet ? Math.max(0, Math.floor(Number(explosiveRivet.level) || 0)) : 0,
      explosionRadius: explosiveRivet ? Math.max(0, Number(explosiveRivet.radius) || 0) : 0,
      explosiveRivetArmed: Boolean(explosiveRivet),
      lifeMs: p.lifeMs,
      scale: p.scale,
      radius: p.radius,
      offsetX: p.offsetX,
      offsetY: p.offsetY
    });
    bullet.baseDamage = baseDamage;
    bullet.isCritical = critical.isCritical;
    bullet.criticalChance = critical.critChance;
    bullet.criticalDamageMultiplier = critical.critDamageMultiplier;
    bullet.criticalRoll = critical.roll;
    if (explosiveRivet) {
      bullet.explosiveRivetDamageCoefficient = Math.max(0, Number(explosiveRivet.damageCoefficient) || 0);
      bullet.setTint?.(0xffa85c);
    }
    return { bullet, muzzle, critical };
  }

  update(time) {
    const scene = this.scene;
    const weapon = scene.primaryWeapon;
    if (!scene.hero?.active || !weapon || scene.gameOver) return;

    const target = this.acquireTarget(scene.hero.x, scene.hero.y, weapon.range);
    if (target) {
      const desired = Phaser.Math.Angle.Between(scene.hero.x, scene.hero.y + this.heroProfile.aimYOffset, target.x, target.y);
      scene.weaponAim = Phaser.Math.Angle.RotateTo(scene.weaponAim || 0, desired, this.heroProfile.targetTurnRate);
    } else if (scene.move?.lengthSq?.() > .05) {
      scene.weaponAim = Phaser.Math.Angle.RotateTo(scene.weaponAim || 0, Math.atan2(scene.move.y, scene.move.x), this.heroProfile.moveTurnRate);
    }
    scene.updateWeaponPose?.();

    const explosiveRivetState = this.syncExplosiveRivet(time);
    const fireDelay = Number.isFinite(Number(scene.fireDelay)) ? Number(scene.fireDelay) : Number(weapon.fireDelay);
    if (!target || time < (scene.lastShot || 0) + fireDelay) return;
    scene.lastShot = time;

    const volleyProfile = this.heroVolleyProfile();
    const spreads = volleyProfile.spreads;
    const shots = [];
    let flashPoint = null;
    const projectileDamageScale = volleyProfile.projectileDamageScale;
    const explosiveShotIndex = this.explosiveRivetRuntime.armed ? Math.floor(spreads.length / 2) : -1;
    spreads.forEach((spread, index) => {
      const shot = this.fireHeroProjectile(scene.weaponAim + spread, projectileDamageScale, {
        explosiveRivet: index === explosiveShotIndex ? explosiveRivetState : null
      });
      if (!shot) return;
      shots.push(shot);
      if (index === Math.floor(spreads.length / 2) || !flashPoint) flashPoint = shot.muzzle;
    });
    if (!shots.length) return;
    if (explosiveShotIndex >= 0 && shots[explosiveShotIndex]?.bullet?.explosiveRivetArmed) this.consumeExplosiveRivet(time);

    this.fireFeedback?.({
      scene,
      target,
      angle: scene.weaponAim,
      visualAngle: Number.isFinite(scene.visualAimAngle) ? scene.visualAimAngle : scene.weaponAim,
      muzzle: flashPoint,
      shots
    });
  }

  fireSupportVolley({
    originX,
    originY,
    angle,
    spreads = [0],
    muzzleDistance = 0,
    speed = 680,
    damage,
    lifeMs = 1100,
    scale = .66,
    tint = 0x66dce9,
    radius = 8,
    offsetX = 2,
    offsetY = 2,
    onShot = null
  }) {
    const shots = [];
    spreads.forEach(spread => {
      const shotAngle = angle + spread;
      const x = originX + Math.cos(shotAngle) * muzzleDistance;
      const y = originY + Math.sin(shotAngle) * muzzleDistance;
      const bullet = this.projectiles.spawn({
        x,
        y,
        angle: shotAngle,
        speed,
        damage,
        lifeMs,
        scale,
        tint,
        radius,
        offsetX,
        offsetY
      });
      const shot = { bullet, x, y, angle: shotAngle };
      shots.push(shot);
      onShot?.(shot);
    });
    return shots;
  }
}

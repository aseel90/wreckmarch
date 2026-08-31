/* WRECKMARCH — authoritative projectile creation, swept collision and lifetime owner */

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

export class ProjectileSystem {
  /** @param {any} scene */
  constructor(scene) {
    this.scene = scene;
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

  spawn({
    x,
    y,
    angle,
    speed,
    damage,
    pierceCount = 0,
    ricochetCount = 0,
    ricochetRange = 360,
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
    bullet.damage = damage;
    bullet.pierceRemaining = Math.max(0, Math.floor(Number(pierceCount) || 0));
    bullet.ricochetRemaining = Math.max(0, Math.floor(Number(ricochetCount) || 0));
    bullet.ricochetRange = Math.max(0, Number(ricochetRange) || 0);
    bullet.hitEnemies = new Set();
    bullet.life = lifeMs;
    bullet.prevX = x;
    bullet.prevY = y;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    return bullet;
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
    let bestEnemy = null;
    let bestDistanceSq = Math.max(0, Number(bullet.ricochetRange) || 0) ** 2;
    this.scene.enemies.children.iterate(enemy => {
      if (!enemy?.active || enemy.hp <= 0 || bullet.hitEnemies?.has?.(enemy)) return;
      const dx = enemy.x - originX;
      const dy = enemy.y - originY;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < bestDistanceSq) {
        bestEnemy = enemy;
        bestDistanceSq = distanceSq;
      }
    });
    return bestEnemy;
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

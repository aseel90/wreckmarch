/* WRECKMARCH — live enemy combat boundary */
import { resolveEnemyProjectileHit, resolveEnemyScrapDropCount } from './enemy-combat-rules.js?v=1';

const SCRAP_RAT_ID = 'scrap-rat';
const SCRAP_RAT_HIT_TINT = 0xffc58f;

export class EnemyCombatSystem {
  /** @param {any} scene */
  constructor(scene) {
    this.scene = scene;
  }

  hitByProjectile(bullet, enemy) {
    if (!bullet?.active || !enemy?.active) return null;

    const velocityX = Number(bullet.body?.velocity?.x) || 0;
    const velocityY = Number(bullet.body?.velocity?.y) || 0;
    const result = resolveEnemyProjectileHit(enemy, {
      damage: bullet.damage ?? this.scene.damage,
      fallbackDamage: this.scene.damage,
      velocityX,
      velocityY
    });

    bullet.destroy();
    enemy.hp = result.nextHp;
    const isScrapRat = enemy.enemyId === SCRAP_RAT_ID;
    const hitFlashMs = Math.max(0, Number(enemy.combatProfile?.hitFlashMs) || 55);

    if (isScrapRat) {
      // Preserve the production Rat texture: a warm multiplicative tint reads as impact
      // without replacing its artwork with a flat white silhouette.
      enemy.setTint(SCRAP_RAT_HIT_TINT);
      this.scene.time.delayedCall(Math.min(hitFlashMs, 46), () => {
        if (!enemy?.active) return;
        const eliteTint = enemy.enemyDefinition?.bootstrap?.eliteTint;
        if (enemy.elite && eliteTint != null) enemy.setTint(eliteTint);
        else enemy.clearTint();
      });
      this.applyScrapRatKnockback(enemy, velocityX, velocityY);
      this.spawnScrapRatHitFx(enemy.x, enemy.y, velocityX, velocityY);
    } else {
      enemy.setTintFill(0xffffff);
      this.scene.time.delayedCall(hitFlashMs, () => enemy?.active && enemy.clearTint());
      this.scene.spawnHitFx(enemy.x, enemy.y, velocityX, velocityY);
    }

    if (enemy.body?.velocity) {
      enemy.body.velocity.x += result.knockbackX;
      enemy.body.velocity.y += result.knockbackY;
    }

    this.scene.playTone(78, .025, 'square', .013, 35);
    if (result.killed) this.killEnemy(enemy);
    return result;
  }

  applyScrapRatKnockback(enemy, velocityX, velocityY) {
    const magnitude = Math.hypot(velocityX, velocityY);
    if (!magnitude || !enemy?.active) return;
    const nudgePx = enemy.elite ? 3 : 4;
    enemy.setPosition(
      enemy.x + (velocityX / magnitude) * nudgePx,
      enemy.y + (velocityY / magnitude) * nudgePx
    );
    enemy.body?.updateFromGameObject?.();
  }

  spawnScrapRatHitFx(x, y, velocityX, velocityY) {
    const scene = this.scene;
    const impactAngle = Math.atan2(velocityY, velocityX) + Math.PI;
    const ring = scene.add.circle(x, y, 5, 0xf1b66f, .08)
      .setStrokeStyle(1, 0xf4cf96, .72)
      .setDepth(30);
    scene.tweens.add({
      targets: ring,
      scale: 1.8,
      alpha: 0,
      duration: 95,
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < 3; i += 1) {
      const spark = scene.add.circle(x, y, i === 0 ? 2 : 1.4, i === 0 ? 0xf4cf8b : 0xb96d43, .9).setDepth(30);
      const angle = impactAngle + Phaser.Math.FloatBetween(-.55, .55);
      const distance = Phaser.Math.Between(8, 16);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: .25,
        duration: Phaser.Math.Between(95, 125),
        onComplete: () => spark.destroy()
      });
    }
  }

  spawnScrapRatDeathFx(x, y, elite) {
    const scene = this.scene;
    const count = elite ? 7 : 5;
    for (let i = 0; i < count; i += 1) {
      const shard = scene.add.circle(x, y, i % 2 ? 1.5 : 2.2, i % 2 ? 0x8c563c : 0xd8954f, .9).setDepth(30);
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-.2, .2);
      const distance = Phaser.Math.Between(elite ? 18 : 13, elite ? 31 : 24);
      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: .2,
        duration: Phaser.Math.Between(130, 190),
        onComplete: () => shard.destroy()
      });
    }
  }

  killEnemy(enemy) {
    if (!enemy?.active) return null;
    const x = enemy.x;
    const y = enemy.y;
    const elite = Boolean(enemy.elite);
    const isScrapRat = enemy.enemyId === SCRAP_RAT_ID;

    enemy.body.enable = false;
    enemy.setVelocity(0, 0);
    enemy.anims.stop();
    this.scene.cameras.main.shake(elite ? 90 : 40, elite ? .0045 : .0015);
    this.scene.playTone(elite ? 52 : 64, elite ? .11 : .06, 'sawtooth', .025, -18);
    this.scene.tweens.add({
      targets: enemy,
      angle: enemy.flipX ? -28 : 28,
      y: y + 12,
      scaleX: enemy.scaleX * 1.15,
      scaleY: enemy.scaleY * .55,
      alpha: .35,
      duration: 180,
      onComplete: () => enemy.destroy()
    });

    const burst = this.scene.add.circle(x, y, elite ? 28 : 18, 0xd8954f, .55).setDepth(13);
    this.scene.tweens.add({ targets: burst, scale: 2.4, alpha: 0, duration: 180, onComplete: () => burst.destroy() });
    if (isScrapRat) this.spawnScrapRatDeathFx(x, y, elite);

    const dropCount = resolveEnemyScrapDropCount(enemy);
    for (let i = 0; i < dropCount; i += 1) {
      const scrap = this.scene.scraps.create(
        x + Phaser.Math.Between(-12, 12),
        y + Phaser.Math.Between(-12, 12),
        'scrap'
      ).setDepth(10);
      scrap.setScale(elite ? .95 : .78);
      scrap.setCircle(11, 3, 3);
      scrap.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-90, 90));
      scrap.setBounce(.4);
    }

    return { dropCount, elite, x, y };
  }
}

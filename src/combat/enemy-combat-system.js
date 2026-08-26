/* WRECKMARCH — live enemy combat boundary */
import { resolveEnemyProjectileHit, resolveEnemyScrapDropCount } from './enemy-combat-rules.js?v=1';

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
    enemy.setTintFill(0xffffff);
    const hitFlashMs = Math.max(0, Number(enemy.combatProfile?.hitFlashMs) || 55);
    this.scene.time.delayedCall(hitFlashMs, () => enemy?.active && enemy.clearTint());

    if (enemy.body?.velocity) {
      enemy.body.velocity.x += result.knockbackX;
      enemy.body.velocity.y += result.knockbackY;
    }

    this.scene.spawnHitFx(enemy.x, enemy.y, velocityX, velocityY);
    this.scene.playTone(78, .025, 'square', .013, 35);
    if (result.killed) this.killEnemy(enemy);
    return result;
  }

  killEnemy(enemy) {
    if (!enemy?.active) return null;
    const x = enemy.x;
    const y = enemy.y;
    const elite = Boolean(enemy.elite);

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

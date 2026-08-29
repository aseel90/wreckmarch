/* WRECKMARCH — live enemy combat boundary */
import { resolveEnemyProjectileHit, resolveEnemyScrapDropCount } from './enemy-combat-rules.js?v=1';

const SCRAP_RAT_ID = 'scrap-rat';
const SAWBUG_ID = 'sawbug';
const RUST_HOUND_ID = 'rust-hound';

const SCRAP_RAT_HIT_TINT = 0xffc58f;
const SAWBUG_HIT_TINT = 0xd9e78d;
const RUST_HOUND_HIT_TINT = 0xf0b07b;

const DEATH_BURST_COLORS = Object.freeze({
  [SCRAP_RAT_ID]: 0xd8954f,
  [SAWBUG_ID]: 0x9eb54e,
  [RUST_HOUND_ID]: 0xb9683f
});

const IMPACT_ACCENT_COLORS = Object.freeze({
  [SCRAP_RAT_ID]: 0xf1b66f,
  [SAWBUG_ID]: 0xc7d96f,
  [RUST_HOUND_ID]: 0xe0a06b
});

export class EnemyCombatSystem {
  /** @param {any} scene */
  constructor(scene) {
    this.scene = scene;
  }

  hitByProjectile(bullet, enemy) {
    if (!bullet?.active || !enemy?.active) return null;

    const velocityX = Number(bullet.body?.velocity?.x) || 0;
    const velocityY = Number(bullet.body?.velocity?.y) || 0;
    const impactX = Number.isFinite(Number(bullet.x)) ? Number(bullet.x) : Number(enemy.x) || 0;
    const impactY = Number.isFinite(Number(bullet.y)) ? Number(bullet.y) : Number(enemy.y) || 0;
    const result = resolveEnemyProjectileHit(enemy, {
      damage: bullet.damage ?? this.scene.damage,
      fallbackDamage: this.scene.damage,
      velocityX,
      velocityY
    });

    bullet.destroy();
    enemy.hp = result.nextHp;

    const enemyId = enemy.enemyId;
    const isScrapRat = enemyId === SCRAP_RAT_ID;
    const isSawbug = enemyId === SAWBUG_ID;
    const isRustHound = enemyId === RUST_HOUND_ID;
    const hitFlashMs = Math.max(0, Number(enemy.combatProfile?.hitFlashMs) || 55);

    this.spawnRivetImpactFx(impactX, impactY, velocityX, velocityY, enemyId);

    if (isScrapRat) {
      this.applyTexturePreservingHitTint(enemy, SCRAP_RAT_HIT_TINT, Math.min(hitFlashMs, 46));
      this.applyDirectionalNudge(enemy, velocityX, velocityY, enemy.elite ? 3 : 4);
      this.spawnScrapRatHitFx(impactX, impactY, velocityX, velocityY);
    } else if (isSawbug) {
      this.applyTexturePreservingHitTint(enemy, SAWBUG_HIT_TINT, Math.min(hitFlashMs, 48));
      // Sawbug should react clearly while keeping its ranged spacing readable.
      this.applyDirectionalNudge(enemy, velocityX, velocityY, enemy.elite ? 1.5 : 2.5);
      this.spawnSawbugHitFx(impactX, impactY, velocityX, velocityY);
    } else if (isRustHound) {
      this.applyTexturePreservingHitTint(enemy, RUST_HOUND_HIT_TINT, Math.min(hitFlashMs, 52));
      // The Hound is heavier than the Rat, so the visual nudge stays restrained.
      this.applyDirectionalNudge(enemy, velocityX, velocityY, enemy.elite ? 1 : 2);
      this.spawnRustHoundHitFx(impactX, impactY, velocityX, velocityY);
    } else {
      enemy.setTintFill(0xffffff);
      this.scene.time.delayedCall(hitFlashMs, () => enemy?.active && enemy.clearTint());
      this.scene.spawnHitFx(impactX, impactY, velocityX, velocityY);
    }

    if (enemy.body?.velocity) {
      enemy.body.velocity.x += result.knockbackX;
      enemy.body.velocity.y += result.knockbackY;
    }

    this.scene.playTone(78, .025, 'square', .012, 35);
    this.scene.playTone(265, .012, 'triangle', .004, -95);
    if (result.killed) this.killEnemy(enemy);
    return result;
  }

  applyTexturePreservingHitTint(enemy, tint, durationMs) {
    if (!enemy?.active) return;
    enemy.setTint(tint);
    this.scene.time.delayedCall(durationMs, () => {
      if (!enemy?.active) return;
      const eliteTint = enemy.enemyDefinition?.bootstrap?.eliteTint;
      if (enemy.elite && eliteTint != null) enemy.setTint(eliteTint);
      else enemy.clearTint();
    });
  }

  applyDirectionalNudge(enemy, velocityX, velocityY, nudgePx) {
    const magnitude = Math.hypot(velocityX, velocityY);
    if (!magnitude || !enemy?.active || !nudgePx) return;
    enemy.setPosition(
      enemy.x + (velocityX / magnitude) * nudgePx,
      enemy.y + (velocityY / magnitude) * nudgePx
    );
    enemy.body?.updateFromGameObject?.();
  }

  spawnRivetImpactFx(x, y, velocityX, velocityY, enemyId) {
    const scene = this.scene;
    const angle = Math.atan2(velocityY, velocityX);
    const accent = IMPACT_ACCENT_COLORS[enemyId] ?? 0xf1b66f;
    const core = scene.add.circle(x, y, 3.1, 0xfff1c9, .96)
      .setDepth(33)
      .setBlendMode(Phaser.BlendModes.ADD);
    const streak = scene.add.rectangle(x, y, 10, 1.8, accent, .9)
      .setOrigin(.18, .5)
      .setRotation(angle)
      .setDepth(32)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: core,
      scale: 1.75,
      alpha: 0,
      duration: 58,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy()
    });
    scene.tweens.add({
      targets: streak,
      x: x + Math.cos(angle) * 7,
      y: y + Math.sin(angle) * 7,
      scaleX: .28,
      alpha: 0,
      duration: 64,
      ease: 'Quad.easeOut',
      onComplete: () => streak.destroy()
    });

    for (let i = 0; i < 2; i += 1) {
      const spark = scene.add.circle(x, y, 1.15, i ? accent : 0xffdf9c, .92)
        .setDepth(32)
        .setBlendMode(Phaser.BlendModes.ADD);
      const sparkAngle = angle + Math.PI + Phaser.Math.FloatBetween(-.72, .72);
      const distance = Phaser.Math.Between(7, 13);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(sparkAngle) * distance,
        y: y + Math.sin(sparkAngle) * distance,
        alpha: 0,
        scale: .2,
        duration: Phaser.Math.Between(65, 92),
        onComplete: () => spark.destroy()
      });
    }
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

  spawnSawbugHitFx(x, y, velocityX, velocityY) {
    const scene = this.scene;
    const impactAngle = Math.atan2(velocityY, velocityX) + Math.PI;
    const ring = scene.add.circle(x, y, 4.5, 0xc7d96f, .06)
      .setStrokeStyle(1, 0xdce98d, .68)
      .setDepth(30);
    scene.tweens.add({
      targets: ring,
      scale: 1.7,
      alpha: 0,
      duration: 90,
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < 4; i += 1) {
      const droplet = scene.add.circle(
        x,
        y,
        i === 0 ? 1.9 : 1.25,
        i % 2 ? 0x70873b : 0xc6d76a,
        .88
      ).setDepth(30);
      const angle = impactAngle + Phaser.Math.FloatBetween(-.65, .65);
      const distance = Phaser.Math.Between(7, 15);
      scene.tweens.add({
        targets: droplet,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: .2,
        duration: Phaser.Math.Between(85, 120),
        onComplete: () => droplet.destroy()
      });
    }
  }

  spawnRustHoundHitFx(x, y, velocityX, velocityY) {
    const scene = this.scene;
    const impactAngle = Math.atan2(velocityY, velocityX) + Math.PI;
    const ring = scene.add.circle(x, y, 5.5, 0xc8794a, .06)
      .setStrokeStyle(1, 0xe6a36f, .7)
      .setDepth(30);
    scene.tweens.add({
      targets: ring,
      scale: 1.65,
      alpha: 0,
      duration: 100,
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < 4; i += 1) {
      const spark = scene.add.circle(
        x,
        y,
        i < 2 ? 1.8 : 1.2,
        i % 2 ? 0x7b4636 : 0xe0a06b,
        .92
      ).setDepth(30);
      const angle = impactAngle + Phaser.Math.FloatBetween(-.5, .5);
      const distance = Phaser.Math.Between(9, 18);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: .2,
        duration: Phaser.Math.Between(100, 135),
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

  spawnSawbugDeathFx(x, y, elite) {
    const scene = this.scene;
    const count = elite ? 8 : 6;
    for (let i = 0; i < count; i += 1) {
      const droplet = scene.add.circle(
        x,
        y,
        i % 3 === 0 ? 2.4 : 1.55,
        i % 2 ? 0x6f8739 : 0xb8c95d,
        .88
      ).setDepth(30);
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-.22, .22);
      const distance = Phaser.Math.Between(elite ? 20 : 14, elite ? 32 : 25);
      scene.tweens.add({
        targets: droplet,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: .16,
        duration: Phaser.Math.Between(140, 205),
        onComplete: () => droplet.destroy()
      });
    }
  }

  spawnRustHoundDeathFx(x, y, elite) {
    const scene = this.scene;
    const count = elite ? 10 : 7;
    for (let i = 0; i < count; i += 1) {
      const shard = scene.add.circle(
        x,
        y,
        i % 3 === 0 ? 2.6 : 1.7,
        i % 2 ? 0x744235 : 0xc9784c,
        .92
      ).setDepth(30);
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-.18, .18);
      const distance = Phaser.Math.Between(elite ? 23 : 16, elite ? 38 : 29);
      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: .16,
        duration: Phaser.Math.Between(150, 220),
        onComplete: () => shard.destroy()
      });
    }
  }

  killEnemy(enemy) {
    if (!enemy?.active) return null;
    const x = enemy.x;
    const y = enemy.y;
    const elite = Boolean(enemy.elite);
    const enemyId = enemy.enemyId;
    const isScrapRat = enemyId === SCRAP_RAT_ID;
    const isSawbug = enemyId === SAWBUG_ID;
    const isRustHound = enemyId === RUST_HOUND_ID;

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

    const burstColor = DEATH_BURST_COLORS[enemyId] ?? 0xd8954f;
    const burstRadius = isRustHound ? (elite ? 31 : 22) : isSawbug ? (elite ? 27 : 19) : (elite ? 28 : 18);
    const burst = this.scene.add.circle(x, y, burstRadius, burstColor, .52).setDepth(13);
    this.scene.tweens.add({ targets: burst, scale: 2.3, alpha: 0, duration: 180, onComplete: () => burst.destroy() });

    if (isScrapRat) this.spawnScrapRatDeathFx(x, y, elite);
    else if (isSawbug) this.spawnSawbugDeathFx(x, y, elite);
    else if (isRustHound) this.spawnRustHoundDeathFx(x, y, elite);

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

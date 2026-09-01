import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const game = fs.readFileSync(new URL('../../src/game.js', import.meta.url), 'utf8');
const system = fs.readFileSync(new URL('../../src/enemies/enemy-system.js', import.meta.url), 'utf8');
const combat = fs.readFileSync(new URL('../../src/combat/combat-system.js', import.meta.url), 'utf8');
const enemyCombat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');
const projectileSystem = fs.readFileSync(new URL('../../src/combat/projectile-system.js', import.meta.url), 'utf8');

describe('authoritative CombatSystem integration', () => {
  it('owns bullet/enemy overlap instead of the base scene', () => {
    expect(game).not.toContain('this.physics.add.overlap(this.bullets, this.enemies');
    expect(game).not.toContain('onBulletHit(bullet, enemy)');
    expect(game).not.toContain('killEnemy(enemy)');
    expect(system).toContain("import { CombatSystem } from '../combat/combat-system.js?v=12'");
    expect(system).toContain('scene.combatSystem = new CombatSystem(scene)');
    expect(system).toContain('scene.combatSystem.installOverlaps()');
    expect(system).not.toContain('scene.onBulletHit');
    expect(combat).toContain('scene.__enemyProjectileOverlap = scene.physics.add.overlap(');
    expect(combat).toContain('this.handleProjectileOverlap');
    expect(combat).toContain('return result');
  });

  it('routes swept projectile hits directly from ProjectileSystem to CombatSystem, including pierce, ricochet and impact-shrapnel chains', () => {
    expect(enemyCombat).toContain('resolveEnemyProjectileHit');
    expect(enemyCombat).toContain('resolveEnemyScrapDropCount');
    expect(projectileSystem).toContain('const hitEnemy = scene.combatSystem?.hitEnemyByProjectile');
    expect(projectileSystem).toContain('hitEnemy.call(scene.combatSystem, bullet, enemy)');
    expect(projectileSystem).toContain('while (bullet.active)');
    expect(projectileSystem).toContain('this.redirectRicochet(bullet, originX, originY)');
    expect(combat).toContain('bullet.ricochetPending = { x: Number(enemy?.x) || 0, y: Number(enemy?.y) || 0 }');
    expect(combat).toContain('this.scene.projectileSystem?.spawnImpactShrapnel?.({');
    expect(projectileSystem).toContain('spawnImpactShrapnel({');
    expect(projectileSystem).toContain("fragment.projectileKind = 'shrapnel'");
    expect(enemyCombat).toContain('const ricochetRemaining = Math.max(0, Math.floor(Number(bullet.ricochetRemaining) || 0))');
    expect(projectileSystem).not.toContain('this.onBulletHit(bullet, enemy)');
  });

  it('gives all three live enemies texture-preserving hit and death feedback', () => {
    expect(enemyCombat).toContain("const SCRAP_RAT_ID = 'scrap-rat'");
    expect(enemyCombat).toContain("const SAWBUG_ID = 'sawbug'");
    expect(enemyCombat).toContain("const RUST_HOUND_ID = 'rust-hound'");
    expect(enemyCombat).toContain('this.applyTexturePreservingHitTint(enemy, SCRAP_RAT_HIT_TINT');
    expect(enemyCombat).toContain('this.applyTexturePreservingHitTint(enemy, SAWBUG_HIT_TINT');
    expect(enemyCombat).toContain('this.applyTexturePreservingHitTint(enemy, RUST_HOUND_HIT_TINT');
    expect(enemyCombat).toContain('const impactX = Number.isFinite(Number(bullet.x)) ? Number(bullet.x) : Number(enemy.x) || 0');
    expect(enemyCombat).toContain('this.spawnRivetImpactFx(impactX, impactY, velocityX, velocityY, enemyId)');
    expect(enemyCombat).toContain('this.spawnScrapRatHitFx(impactX, impactY, velocityX, velocityY)');
    expect(enemyCombat).toContain('this.spawnSawbugHitFx(impactX, impactY, velocityX, velocityY)');
    expect(enemyCombat).toContain('this.spawnRustHoundHitFx(impactX, impactY, velocityX, velocityY)');
    expect(enemyCombat).toContain('if (isScrapRat) this.spawnScrapRatDeathFx(x, y, elite)');
    expect(enemyCombat).toContain('else if (isSawbug) this.spawnSawbugDeathFx(x, y, elite)');
    expect(enemyCombat).toContain('else if (isRustHound) this.spawnRustHoundDeathFx(x, y, elite)');
  });
});

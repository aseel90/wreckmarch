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
    expect(system).toContain("import { CombatSystem } from '../combat/combat-system.js?v=3'");
    expect(system).toContain('scene.combatSystem = new CombatSystem(scene)');
    expect(system).toContain('scene.combatSystem.installOverlaps()');
    expect(system).not.toContain('scene.onBulletHit');
    expect(combat).toContain('scene.__enemyProjectileOverlap = scene.physics.add.overlap(');
    expect(combat).toContain('this.handleProjectileOverlap');
    expect(combat).toContain('return this.enemy.hitByProjectile(bullet, enemy)');
  });

  it('routes swept projectile hits directly from ProjectileSystem to CombatSystem', () => {
    expect(enemyCombat).toContain('resolveEnemyProjectileHit');
    expect(enemyCombat).toContain('resolveEnemyScrapDropCount');
    expect(projectileSystem).toContain('scene.combatSystem?.hitEnemyByProjectile?.(bullet, enemy)');
    expect(projectileSystem).not.toContain('this.onBulletHit(bullet, enemy)');
  });

  it('gives Scrap Rat a texture-preserving hit flash, light nudge, and distinct death burst', () => {
    expect(enemyCombat).toContain("const SCRAP_RAT_ID = 'scrap-rat'");
    expect(enemyCombat).toContain('enemy.setTint(SCRAP_RAT_HIT_TINT)');
    expect(enemyCombat).toContain('this.applyScrapRatKnockback(enemy, velocityX, velocityY)');
    expect(enemyCombat).toContain('this.spawnScrapRatHitFx(enemy.x, enemy.y, velocityX, velocityY)');
    expect(enemyCombat).toContain('if (isScrapRat) this.spawnScrapRatDeathFx(x, y, elite)');
  });
});

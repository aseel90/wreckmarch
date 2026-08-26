import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const game = fs.readFileSync(new URL('../../src/game.js', import.meta.url), 'utf8');
const combat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');

describe('live EnemyCombatSystem integration', () => {
  it('routes the Phaser overlap callback through the combat system', () => {
    expect(game).toContain("import { EnemyCombatSystem } from './combat/enemy-combat-system.js?v=1'");
    expect(game).toContain('this.enemyCombatSystem = new EnemyCombatSystem(this)');
    expect(game).toContain('this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, undefined, this)');
    expect(game).toContain('return this.enemyCombatSystem.hitByProjectile(bullet, enemy)');
    expect(game).toContain('return this.enemyCombatSystem.killEnemy(enemy)');
  });

  it('removes enemy damage/drop ownership from game.js', () => {
    const hitStart = game.indexOf('  onBulletHit(bullet, enemy) {');
    const hitEnd = game.indexOf('  spawnHitFx(', hitStart);
    const deathStart = game.indexOf('  killEnemy(enemy) {');
    const deathEnd = game.indexOf('  collectScrap(', deathStart);
    expect(game.slice(hitStart, hitEnd)).not.toContain('enemy.hp -=');
    expect(game.slice(deathStart, deathEnd)).not.toContain('this.scraps.create');
    expect(combat).toContain('resolveEnemyProjectileHit');
    expect(combat).toContain('resolveEnemyScrapDropCount');
  });
});

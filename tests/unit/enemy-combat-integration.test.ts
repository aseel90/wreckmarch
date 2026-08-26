import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const game = fs.readFileSync(new URL('../../src/game.js', import.meta.url), 'utf8');
const system = fs.readFileSync(new URL('../../src/enemies/enemy-system.js', import.meta.url), 'utf8');
const combat = fs.readFileSync(new URL('../../src/combat/combat-system.js', import.meta.url), 'utf8');
const enemyCombat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');
const phaseC = fs.readFileSync(new URL('../../src/phase-c-runtime.js', import.meta.url), 'utf8');

describe('authoritative CombatSystem integration', () => {
  it('owns bullet/enemy overlap instead of the base scene', () => {
    expect(game).not.toContain('this.physics.add.overlap(this.bullets, this.enemies');
    expect(game).not.toContain('onBulletHit(bullet, enemy)');
    expect(game).not.toContain('killEnemy(enemy)');
    expect(system).toContain("import { CombatSystem } from '../combat/combat-system.js?v=1'");
    expect(system).toContain('scene.combatSystem = new CombatSystem(scene)');
    expect(system).toContain('scene.combatSystem.installOverlaps()');
    expect(system).not.toContain('scene.onBulletHit');
    expect(combat).toContain('scene.__enemyProjectileOverlap = scene.physics.add.overlap(');
    expect(combat).toContain('this.handleProjectileOverlap');
    expect(combat).toContain('return this.enemy.hitByProjectile(bullet, enemy)');
  });

  it('routes swept projectile hits directly to CombatSystem', () => {
    expect(enemyCombat).toContain('resolveEnemyProjectileHit');
    expect(enemyCombat).toContain('resolveEnemyScrapDropCount');
    expect(phaseC).toContain('this.combatSystem.hitEnemyByProjectile(bullet, bestEnemy)');
    expect(phaseC).not.toContain('this.onBulletHit(bullet, bestEnemy)');
  });
});

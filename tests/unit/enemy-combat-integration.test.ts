import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const system = fs.readFileSync(new URL('../../src/enemies/enemy-system.js', import.meta.url), 'utf8');
const combat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');

describe('live EnemyCombatSystem integration', () => {
  it('moves bullet/enemy overlap ownership into Enemy Foundation', () => {
    expect(system).toContain("import { EnemyCombatSystem } from '../combat/enemy-combat-system.js?v=1'");
    expect(system).toContain('collider.collideCallback === scene.onBulletHit');
    expect(system).toContain('legacyCollider.destroy()');
    expect(system).toContain('scene.enemyCombatSystem = new EnemyCombatSystem(scene)');
    expect(system).toContain('scene.__enemyProjectileOverlap = scene.physics.add.overlap(');
    expect(system).toContain('return this.enemyCombatSystem.hitByProjectile(bullet, enemy)');
    expect(system).toContain('return this.enemyCombatSystem.killEnemy(enemy)');
  });

  it('keeps explicit legacy callbacks for rollback while CombatSystem owns live damage/drop logic', () => {
    expect(system).toContain('scene.__legacyOnBulletHit = scene.onBulletHit.bind(scene)');
    expect(system).toContain('scene.__legacyKillEnemy = scene.killEnemy.bind(scene)');
    expect(system).toContain('__enemyCombatFoundationReady = true');
    expect(combat).toContain('resolveEnemyProjectileHit');
    expect(combat).toContain('resolveEnemyScrapDropCount');
  });
});

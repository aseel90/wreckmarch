import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const system = fs.readFileSync(new URL('../../src/enemies/enemy-system.js', import.meta.url), 'utf8');

describe('live behavior integration', () => {
  it('routes updateEnemies through EnemyBehaviorSystem while preserving rollback access', () => {
    expect(system).toContain("import { EnemyBehaviorSystem } from './enemy-behavior-system.js?v=1'");
    expect(system).toContain('scene.enemyBehaviorSystem = new EnemyBehaviorSystem(scene)');
    expect(system).toContain('scene.__legacyUpdateEnemies = scene.updateEnemies.bind(scene)');
    expect(system).toContain('this.enemyBehaviorSystem.updateAll(this.enemies, this.hero)');
    expect(system).toContain('__enemyBehaviorFoundationReady = true');
  });
});

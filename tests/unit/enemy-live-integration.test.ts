import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Enemy Foundation boot integration', () => {
  it('installs before legacy visual/gameplay phases wrap spawnEnemy', () => {
    const html = read('index.html');
    const game = html.indexOf("await import('./src/game.js?v=8')");
    const enemy = html.indexOf("./src/enemies/enemy-system.js?v=8");
    const e0 = html.indexOf("./src/phase-e0-fast-terrain.js?v=2");
    const phaseC = html.indexOf("./src/phase-c-runtime.js?v=5");
    expect(game).toBeGreaterThan(-1);
    expect(enemy).toBeGreaterThan(game);
    expect(e0).toBeGreaterThan(enemy);
    expect(phaseC).toBeGreaterThan(enemy);
  });

  it('keeps the old spawn method only as an explicit rollback fallback', () => {
    const system = read('src/enemies/enemy-system.js');
    expect(system).toContain('scene.__legacySpawnEnemy = scene.spawnEnemy.bind(scene)');
    expect(system).toContain("this.spawnSystem.spawn('scrap-rat', { elite })");
    expect(system).toContain('__enemyFoundationReady = true');
  });
});

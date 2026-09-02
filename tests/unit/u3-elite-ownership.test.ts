import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const enemyCombat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');
const eliteRuntime = fs.readFileSync(new URL('../../src/rewards/u3-elite-reward-runtime.js', import.meta.url), 'utf8');

describe('U3 Elite reward ownership', () => {
  it('publishes death from canonical combat instead of replacing killEnemy at runtime', () => {
    expect(enemyCombat).toContain("this.scene.events?.emit?.('wreckmarch:enemy-killed', death)");
    expect(eliteRuntime).toContain("scene.events?.on?.('wreckmarch:enemy-killed', onEnemyKilled)");
    expect(eliteRuntime).not.toContain('combat.killEnemy =');
    expect(eliteRuntime).not.toContain('previousKill');
    expect(eliteRuntime).not.toContain('__eliteRewardWrapped');
  });
});

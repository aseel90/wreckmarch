import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listUpgradeDefinitions } from '../../src/upgrades/upgrade-catalog.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS19 armor semantics production ownership', () => {
  it('threads resolved character armor through the canonical player-damage boundary', () => {
    const system = read('src/combat/player-damage-system.js');
    expect(system).toContain('armor: scene.runCombatStats?.armor');
    expect(system).toContain("./player-damage-rules.js?v=3");
  });

  it('keeps Armor Plate and the current card pool from silently granting Armor', () => {
    const armorModifiers = listUpgradeDefinitions().flatMap((definition: any) =>
      (definition.modifiers || []).filter((modifier: any) => modifier.domain === 'character' && modifier.stat === 'armor')
    );
    expect(armorModifiers).toEqual([]);
  });

  it('cache-busts the live armor semantics through CombatSystem -> EnemySystem -> index', () => {
    const combat = read('src/combat/combat-system.js');
    const enemy = read('src/enemies/enemy-system.js');
    const index = read('index.html');

    expect(combat).toContain("./player-damage-system.js?v=5");
    expect(enemy).toContain("../combat/combat-system.js?v=13");
    expect(index).toContain("./src/enemies/enemy-system.js?v=27");
  });
});

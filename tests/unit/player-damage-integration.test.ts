import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const enemySystem = fs.readFileSync(new URL('../../src/enemies/enemy-system.js', import.meta.url), 'utf8');
const characterSystem = fs.readFileSync(new URL('../../src/characters/character-system.js', import.meta.url), 'utf8');
const runner = fs.readFileSync(new URL('../../src/characters/definitions/runner.js', import.meta.url), 'utf8');

describe('live PlayerDamageSystem integration', () => {
  it('moves hero/enemy overlap ownership into PlayerDamageSystem with rollback access', () => {
    expect(enemySystem).toContain("import { PlayerDamageSystem } from '../combat/player-damage-system.js?v=1'");
    expect(enemySystem).toContain('collider.collideCallback === scene.enemyTouchesHero');
    expect(enemySystem).toContain('scene.__legacyEnemyTouchesHero = scene.enemyTouchesHero.bind(scene)');
    expect(enemySystem).toContain('legacyCollider.destroy()');
    expect(enemySystem).toContain('scene.playerDamageSystem = new PlayerDamageSystem(scene)');
    expect(enemySystem).toContain('scene.__playerEnemyOverlap = scene.physics.add.overlap(');
    expect(enemySystem).toContain('return this.playerDamageSystem.hitByContact(hero, enemy)');
    expect(enemySystem).toContain('__playerDamageFoundationReady = true');
  });

  it('keeps Runner combat tuning in the character definition instead of enemy-specific logic', () => {
    expect(runner).toContain('incomingDamageMultiplier: 1');
    expect(runner).toContain('contactKnockbackMultiplier: 1');
    expect(runner).toContain('invulnerabilityMs: 450');
    expect(runner).toContain('contactKnockbackStrength: 190');
    expect(runner).toContain('contactKnockbackDurationMs: 140');
    expect(characterSystem).toContain('scene.playerCombatProfile = definition.combat || scene.playerCombatProfile');
    expect(characterSystem).toContain('scene.heroInvulnMs = definition.combat.invulnerabilityMs');
  });
});

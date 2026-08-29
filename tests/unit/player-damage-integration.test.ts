import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { CharacterSystem } from '../../src/characters/character-system.js';

const game = fs.readFileSync(new URL('../../src/game.js', import.meta.url), 'utf8');
const enemySystem = fs.readFileSync(new URL('../../src/enemies/enemy-system.js', import.meta.url), 'utf8');
const combat = fs.readFileSync(new URL('../../src/combat/combat-system.js', import.meta.url), 'utf8');
const runner = fs.readFileSync(new URL('../../src/characters/definitions/runner.js', import.meta.url), 'utf8');
const playerDamage = fs.readFileSync(new URL('../../src/combat/player-damage-system.js', import.meta.url), 'utf8');

describe('live PlayerDamageSystem integration', () => {
  it('owns hero/enemy contact through CombatSystem instead of the base scene', () => {
    expect(game).not.toContain('this.physics.add.overlap(this.hero, this.enemies');
    expect(game).not.toContain('enemyTouchesHero(hero, enemy)');
    expect(enemySystem).toContain('scene.playerDamageSystem = scene.combatSystem.player');
    expect(combat).toContain('scene.__playerEnemyOverlap = scene.physics.add.overlap(');
    expect(combat).toContain('this.handlePlayerContact');
    expect(combat).toContain('return this.player.hitByContact(hero, enemy)');
    expect(enemySystem).toContain('__playerDamageFoundationReady = true');
  });

  it('keeps Runner combat tuning in the character definition instead of enemy-specific logic', () => {
    expect(runner).toContain('incomingDamageMultiplier: 1');
    expect(runner).toContain('contactKnockbackMultiplier: 1');
    expect(runner).toContain('invulnerabilityMs: 450');
    expect(runner).toContain('contactKnockbackStrength: 190');
    expect(runner).toContain('contactKnockbackDurationMs: 140');
    const scene: any = { heroHp: Number.NaN, hero: { body: { setCircle() {} } } };
    const system = new CharacterSystem(scene, 'runner');
    system.applyGameplayDefaults({ resetHealth: true });
    expect(scene.playerCombatProfile).toEqual(system.definition.combat);
    expect(scene.heroInvulnMs).toBe(450);
  });

  it('uses a brief detail-preserving hit tint instead of a solid red fill', () => {
    expect(playerDamage).toContain('const hitFlashColor = 0xff9a8c');
    expect(playerDamage).toContain('const hitFlashAlpha = .88');
    expect(playerDamage).toContain('const hitFlashRepeats = 0');
    expect(playerDamage).toContain('hero.setTint(hitFlashColor)');
    expect(playerDamage).not.toContain('hero.setTintFill(hitFlashColor)');
  });
});

import { describe, expect, it } from 'vitest';
import { CharacterSystem } from '../../src/characters/character-system.js';
import { getCharacterDefinition, listCharacterDefinitions } from '../../src/characters/character-registry.js';

function makeScene() {
  return {
    heroHp: Number.NaN,
    hero: { x: 100, y: 200 }
  } as any;
}

describe('CharacterSystem', () => {
  it('registers Runner as the canonical playable character definition', () => {
    const runner = getCharacterDefinition('runner');
    expect(listCharacterDefinitions().map(character => character.id)).toEqual(['runner']);
    expect(runner.stats).toEqual({ maxHp: 100, moveSpeed: 255 });
    expect(runner.animations.idle.frames).toEqual(['hunter-idle-0', 'hunter-idle-1']);
    expect(runner.animations.run.frames).toEqual(['hunter-run-0', 'hunter-run-1', 'hunter-run-2']);
    expect(runner.animations.idle.frameRate).toBe(2);
    expect(runner.animations.run.frameRate).toBe(10);
    expect(() => getCharacterDefinition('missing')).toThrow('Unknown character: missing');
  });

  it('applies gameplay stats through the selected definition', () => {
    const scene = makeScene();
    const system = new CharacterSystem(scene, 'runner');
    system.applyGameplayDefaults({ resetHealth: true });
    expect(scene.characterId).toBe('runner');
    expect(scene.heroMaxHp).toBe(100);
    expect(scene.heroHp).toBe(100);
    expect(scene.heroSpeed).toBe(255);
    expect(scene.startingWeaponId).toBe('rivet-gun');
    expect(scene.playerPassive).toEqual({ id: 'runner-baseline', enabled: false });
    expect(scene.runCombatStats).toMatchObject({ armor: 0, critChance: 0, critDamageMultiplier: 1.5 });
    expect(scene.resolvedRunStats.character.maxHp).toBe(100);
  });

  it('owns Runner weapon socket and muzzle geometry', () => {
    const scene = makeScene();
    const system = new CharacterSystem(scene, 'runner');
    expect(system.getWeaponSocket(0)).toEqual({ x: 110, y: 203 });
    expect(system.getWeaponSocket(4)).toEqual({ x: 90, y: 203 });
    expect(system.getMuzzleReach(0)).toBe(52);
    expect(system.getMuzzleReach(1)).toBe(49);
  });
});

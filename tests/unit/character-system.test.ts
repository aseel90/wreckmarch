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
    expect(runner.animations.run.frames).toEqual(['runner-run-0', 'runner-run-1', 'runner-run-2', 'runner-run-3']);
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
  });

  it('owns Runner weapon socket and muzzle geometry', () => {
    const scene = makeScene();
    const system = new CharacterSystem(scene, 'runner');
    expect(system.getWeaponSocket(0)).toEqual({ x: 115, y: 195 });
    expect(system.getWeaponSocket(4)).toEqual({ x: 85, y: 195 });
    expect(system.getMuzzleReach(0)).toBe(76);
    expect(system.getMuzzleReach(1)).toBe(70);
  });
});

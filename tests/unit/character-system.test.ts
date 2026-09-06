import { describe, expect, it } from 'vitest';
import { CharacterSystem } from '../../src/characters/character-system.js';
import {
  CHARACTER_AVAILABILITY,
  getCharacterDefinition,
  getCharacterEntry,
  isCharacterSelectable,
  listCharacterDefinitions,
  listCharacterEntries,
} from '../../src/characters/character-registry.js';

function makeScene() {
  return {
    heroHp: Number.NaN,
    hero: { x: 100, y: 200 }
  } as any;
}

describe('CharacterSystem', () => {
  it('registers Runner as the canonical playable character definition', () => {
    const runner = getCharacterDefinition('runner');
    expect(listCharacterDefinitions().map(character => character.id)).toEqual(['runner', 'shotgun']);
    expect(runner.stats).toEqual({ maxHp: 100, moveSpeed: 255 });
    expect(runner.animations.idle.frames).toEqual(['hunter-idle-0', 'hunter-idle-1']);
    expect(runner.animations.run.frames).toEqual(['hunter-run-0', 'hunter-run-1', 'hunter-run-2']);
    expect(runner.animations.idle.frameRate).toBe(2);
    expect(runner.animations.run.frameRate).toBe(10);
    expect(() => getCharacterDefinition('missing')).toThrow('Unknown character: missing');
  });

  it('exposes Wrecker as a canonical selectable character definition', () => {
    expect(listCharacterEntries().map(character => [character.id, character.availability])).toEqual([
      ['runner', CHARACTER_AVAILABILITY.SELECTABLE],
      ['shotgun', CHARACTER_AVAILABILITY.SELECTABLE],
    ]);
    const shotgun = getCharacterEntry('shotgun');
    expect(shotgun.definition).toMatchObject({
      id: 'shotgun',
      stats: { maxHp: 110, moveSpeed: 255 },
      startingWeapon: { id: 'shotgun' },
    });
    expect(shotgun.preview).toMatchObject({
      bodyAsset: 'assets/hero/shotgun/idle-0.svg',
      weaponAsset: 'assets/weapons/shotgun.svg',
      artStatus: 'production-active',
    });
    expect(isCharacterSelectable('runner')).toBe(true);
    expect(isCharacterSelectable('shotgun')).toBe(true);
    expect(getCharacterDefinition('shotgun')).toBe(shotgun.definition);
    expect(new CharacterSystem(makeScene(), 'shotgun').characterId).toBe('shotgun');
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
    expect(scene.activeWeaponId).toBe('rivet-gun');
    expect(scene.weaponDefinition.id).toBe('rivet-gun');
    expect(scene.primaryWeapon).toMatchObject({ id: 'rivet-gun', damage: 24, fireDelay: 390, projectileSpeed: 760, range: 570, muzzleDistance: 38 });
    expect(scene.resolvedRunStats.weapon).toMatchObject({ damage: 24, fireDelay: 390, projectileSpeed: 760, range: 570 });
    expect(scene.playerPassive).toEqual({ id: 'runner-baseline', enabled: false });
    expect(scene.runCombatStats).toMatchObject({ armor: 0, critChance: 0, critDamageMultiplier: 1.5 });
    expect(scene.resolvedRunStats.character.maxHp).toBe(100);
  });

  it('resets current HP exactly once when production presentation changes the playable character identity', () => {
    const scene: any = {
      heroHp: 100,
      heroMaxHp: 100,
      hero: {
        body: { setCircle() {} },
        stop() { return this; },
        setTexture() { return this; },
        setOrigin() { return this; },
        setScale() { return this; },
        setFlipX() { return this; },
        play() { return this; },
      },
      anims: { exists: () => false, create() {} },
    };
    const system = new CharacterSystem(scene, 'shotgun');
    scene.characterSystem = system;

    system.installProductionVisuals();
    expect(scene.heroMaxHp).toBe(110);
    expect(scene.heroHp).toBe(110);

    scene.heroHp = 73;
    system.installProductionVisuals();
    expect(scene.heroMaxHp).toBe(110);
    expect(scene.heroHp).toBe(73);
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

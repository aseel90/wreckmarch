import { describe, expect, it } from 'vitest';
import { getEnemyDefinition, listEnemyDefinitions } from '../../src/enemies/enemy-registry.js';
import { EnemyFactory, resolveEnemySpawnStats } from '../../src/enemies/enemy-factory.js';

function fakeEnemy() {
  const enemy: any = {
    setDepth(value: number) { this.depth = value; return this; },
    setScale(value: number) { this.scale = value; return this; },
    play(value: string) { this.animation = value; return this; },
    setCircle(radius: number, x: number, y: number) { this.circle = [radius, x, y]; return this; },
    setTint(value: number) { this.tint = value; return this; }
  };
  return enemy;
}

describe('enemy foundation', () => {
  it('registers Scrap Rat and Rust Hound as canonical enemies', () => {
    const definitions = listEnemyDefinitions();
    expect(definitions.map(definition => definition.id)).toEqual(['scrap-rat', 'rust-hound']);
    expect(getEnemyDefinition('scrap-rat').behavior).toBe('chase');
    expect(getEnemyDefinition('rust-hound').behavior).toBe('hound-pounce');
    expect(getEnemyDefinition('rust-hound').threatValue).toBe(2);
    expect(() => getEnemyDefinition('missing')).toThrow('Unknown enemy definition: missing');
  });

  it('preserves the current Scrap Rat balance values exactly', () => {
    const rat = getEnemyDefinition('scrap-rat');
    expect(rat.variants.normal).toMatchObject({
      hpBase: 54, hpPerSecond: 1.25, speedMin: 88, speedMax: 122, contactDamage: 10, scrapDrop: 1
    });
    expect(rat.variants.elite).toMatchObject({
      hpBase: 110, hpPerSecond: 2.4, speedMin: 70, speedMax: 88, contactDamage: 19, scrapDrop: 3
    });
  });

  it('resolves time scaling and variant stats without Phaser', () => {
    const rat = getEnemyDefinition('scrap-rat');
    expect(resolveEnemySpawnStats(rat, { runTime: 20, randomBetween: (min: number) => min })).toEqual({
      variantKey: 'normal', hp: 79, speed: 88, damage: 10, scrapDrop: 1
    });
    expect(resolveEnemySpawnStats(rat, { elite: true, runTime: 20, randomBetween: (_min: number, max: number) => max })).toEqual({
      variantKey: 'elite', hp: 158, speed: 88, damage: 19, scrapDrop: 3
    });
  });

  it('creates a tagged enemy through the factory while preserving bootstrap physics', () => {
    const enemy = fakeEnemy();
    const scene: any = {
      runTime: 10,
      enemySerial: 7,
      enemies: { create: () => enemy }
    };
    const factory = new EnemyFactory(scene, { randomBetween: (min: number) => min });
    const created: any = factory.create('scrap-rat', { x: 12, y: 34 });
    expect(created).toBe(enemy);
    expect(created.name).toBe('scraprat-7');
    expect(created.enemyId).toBe('scrap-rat');
    expect(created.variantKey).toBe('normal');
    expect(created.hp).toBe(66.5);
    expect(created.maxHp).toBe(66.5);
    expect(created.speed).toBe(88);
    expect(created.damage).toBe(10);
    expect(created.baseDamage).toBe(10);
    expect(created.threatValue).toBe(1);
    expect(created.scrapDrop).toBe(1);
    expect(created.circle).toEqual([21, 24, 17]);
    expect(scene.enemySerial).toBe(8);
  });
});

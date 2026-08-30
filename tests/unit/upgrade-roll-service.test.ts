import { describe, expect, it } from 'vitest';
import { createSeededUpgradeRng, rollUpgradeChoices } from '../../src/upgrades/upgrade-roll-service.js';

function choice(id: string, weight: number, available = true) {
  return { id, weight, available: () => available };
}

describe('upgrade roll service', () => {
  it('uses deterministic seeded weighted sampling without replacement', () => {
    const pool = [choice('a', 1), choice('b', 2), choice('c', 3), choice('d', 4)];
    const first = rollUpgradeChoices(pool, { count: 3, rng: createSeededUpgradeRng('run-42') }).map(item => ({ id: item.id, rarity: item.rarity }));
    const second = rollUpgradeChoices(pool, { count: 3, rng: createSeededUpgradeRng('run-42') }).map(item => ({ id: item.id, rarity: item.rarity }));

    expect(first).toEqual(second);
    expect(new Set(first.map(item => item.id)).size).toBe(first.length);
    expect(first).toHaveLength(3);
  });

  it('filters unavailable, excluded and zero-weight choices before rolling', () => {
    const pool = [
      choice('maxed', 100, false),
      choice('excluded', 100),
      choice('disabled', 0),
      choice('valid', 1)
    ];

    expect(rollUpgradeChoices(pool, {
      count: 3,
      rng: createSeededUpgradeRng(7),
      excludeIds: ['excluded']
    }).map(item => item.id)).toEqual(['valid']);
  });

  it('assigns rarity after card selection and respects fixed Common constraints', () => {
    const rollable = { ...choice('rollable', 1), apply: (rarity?: string | null) => rarity };
    const rolled = rollUpgradeChoices([rollable], { count: 1, rng: () => 0, rarityRng: () => 0.999 });
    expect(rolled[0].rarity).toBe('LEGENDARY');
    expect(rolled[0].rarityPowerMultiplier).toBe(1.5);
    expect(rolled[0].apply?.()).toBe('LEGENDARY');

    let rarityCalls = 0;
    const fixed = { ...choice('fixed', 1), rarityConstraint: 'COMMON', apply: (rarity?: string | null) => rarity };
    const fixedRoll = rollUpgradeChoices([fixed], {
      count: 1,
      rng: () => 0,
      rarityRng: () => { rarityCalls += 1; return 0.999; }
    });
    expect(fixedRoll[0].rarity).toBe('COMMON');
    expect(fixedRoll[0].apply?.()).toBe('COMMON');
    expect(rarityCalls).toBe(0);
  });

  it('returns an empty list when no valid choices remain', () => {
    expect(rollUpgradeChoices([
      choice('maxed', 1, false),
      choice('disabled', 0)
    ], { rng: createSeededUpgradeRng('none') })).toEqual([]);
  });

  it('keeps weighting data-driven and validates bad roll contracts', () => {
    const pool = [choice('common', 1), choice('rare', 9)];
    expect(rollUpgradeChoices(pool, { count: 1, rng: () => 0.95 })[0].id).toBe('rare');
    expect(() => rollUpgradeChoices(pool, { count: 1, rng: () => 1 })).toThrow(/\[0, 1\)/);
    expect(() => rollUpgradeChoices(pool, { count: 1, rarityRng: null as any })).toThrow(/rarity rng/);
    expect(() => rollUpgradeChoices([choice('bad', -1)])).toThrow(/weight/);
  });
});

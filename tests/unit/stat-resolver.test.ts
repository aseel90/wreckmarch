import { describe, expect, it } from 'vitest';
import { resolveStat, resolveStatBlock, STAT_MODIFIER_TYPES as T } from '../../src/stats/stat-resolver.js';

describe('Upgrade System 2.0 stat resolver', () => {
  it('resolves FLAT -> ADDITIVE_PERCENT -> MULTIPLICATIVE_PERCENT -> INVERSE_ADDITIVE_PERCENT deterministically', () => {
    const modifiers = [
      { id: 'mult', type: T.MULTIPLICATIVE_PERCENT, value: .2 },
      { id: 'flat', type: T.FLAT, value: 10 },
      { id: 'additive', type: T.ADDITIVE_PERCENT, value: .5 },
      { id: 'rate', type: T.INVERSE_ADDITIVE_PERCENT, value: .1 }
    ];
    expect(resolveStat(100, modifiers)).toBeCloseTo(180);
    expect(resolveStat(100, modifiers.slice().reverse())).toBeCloseTo(180);
  });

  it('models rate increases as base-relative additive gains instead of exponential delay shrinkage', () => {
    const levels = Array.from({ length: 5 }, (_, index) => ({ id: `rate-${index + 1}`, type: T.INVERSE_ADDITIVE_PERCENT, value: .12 }));
    expect(resolveStat(390, levels)).toBeCloseTo(243.75);
    expect(390 / resolveStat(390, levels)).toBeCloseTo(1.6);
    expect(() => resolveStat(100, [{ id: 'invalid-rate', type: T.INVERSE_ADDITIVE_PERCENT, value: -1 }])).toThrow(/divisor greater than zero/);
  });

  it('chooses overrides by priority rather than call order', () => {
    const modifiers = [
      { id: 'low', type: T.OVERRIDE, value: 50, priority: 1 },
      { id: 'high', type: T.OVERRIDE, value: 80, priority: 10 }
    ];
    expect(resolveStat(10, modifiers)).toBe(80);
    expect(resolveStat(10, modifiers.slice().reverse())).toBe(80);
  });

  it('applies caps after resolution', () => {
    expect(resolveStat(255, [{ id: 'fleet', type: T.ADDITIVE_PERCENT, value: .5 }], { max: 280 })).toBe(280);
    expect(resolveStat(100, [{ id: 'damage', type: T.MULTIPLICATIVE_PERCENT, value: -.95 }], { min: 10 })).toBe(10);
  });

  it('resolves an immutable stat block without mutating its inputs', () => {
    const base = Object.freeze({ maxHp: 100, moveSpeed: 255 });
    const resolved = resolveStatBlock(base, {
      maxHp: [{ id: 'armor', type: T.FLAT, value: 15 }],
      moveSpeed: [{ id: 'fleet', type: T.ADDITIVE_PERCENT, value: .03 }]
    }, { moveSpeed: { max: 280 } });
    expect(resolved.maxHp).toBe(115);
    expect(resolved.moveSpeed).toBeCloseTo(262.65);
    expect(base).toEqual({ maxHp: 100, moveSpeed: 255 });
    expect(Object.isFrozen(resolved)).toBe(true);
  });

  it('rejects malformed modifiers and invalid caps', () => {
    expect(() => resolveStat(100, [{ id: 'bad', type: 'UNKNOWN', value: 1 }])).toThrow(/Invalid stat modifier type/);
    expect(() => resolveStat(100, [], { min: 20, max: 10 })).toThrow(/min cannot be greater than max/);
  });
});

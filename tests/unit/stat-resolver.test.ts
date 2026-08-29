import { describe, expect, it } from 'vitest';
import { resolveStat, resolveStatBlock, STAT_MODIFIER_TYPES as T } from '../../src/stats/stat-resolver.js';

describe('Upgrade System 2.0 stat resolver', () => {
  it('resolves FLAT -> ADDITIVE_PERCENT -> MULTIPLICATIVE_PERCENT deterministically', () => {
    const modifiers = [
      { id: 'multi', type: T.MULTIPLICATIVE_PERCENT, value: .25 },
      { id: 'flat', type: T.FLAT, value: 10 },
      { id: 'add', type: T.ADDITIVE_PERCENT, value: .2 }
    ];
    expect(resolveStat(100, modifiers)).toBe(165);
    expect(resolveStat(100, [...modifiers].reverse())).toBe(165);
  });

  it('chooses overrides by priority rather than call order', () => {
    const modifiers = [
      { id: 'low', type: T.OVERRIDE, value: 50, priority: 1 },
      { id: 'high', type: T.OVERRIDE, value: 80, priority: 10 },
      { id: 'flat', type: T.FLAT, value: 999 }
    ];
    expect(resolveStat(100, modifiers)).toBe(80);
    expect(resolveStat(100, [...modifiers].reverse())).toBe(80);
  });

  it('applies caps after resolution', () => {
    expect(resolveStat(255, [{ id: 'speed', type: T.ADDITIVE_PERCENT, value: .2 }], { max: 280 })).toBe(280);
  });

  it('resolves an immutable stat block without mutating its inputs', () => {
    const base = { maxHp: 100, moveSpeed: 255 };
    const resolved = resolveStatBlock(base, {
      maxHp: [{ id: 'plate', type: T.FLAT, value: 15 }],
      moveSpeed: [{ id: 'fleet', type: T.ADDITIVE_PERCENT, value: .03 }]
    }, { moveSpeed: { max: 280 } });
    expect(resolved).toEqual({ maxHp: 115, moveSpeed: 262.65 });
    expect(base).toEqual({ maxHp: 100, moveSpeed: 255 });
    expect(Object.isFrozen(resolved)).toBe(true);
  });

  it('rejects malformed modifiers and invalid caps', () => {
    expect(() => resolveStat(100, [{ id: 'bad', type: 'UNKNOWN', value: 1 } as any])).toThrow('Invalid stat modifier type');
    expect(() => resolveStat(100, [], { min: 10, max: 5 })).toThrow('min cannot be greater than max');
  });
});

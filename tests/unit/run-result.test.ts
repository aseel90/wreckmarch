import { describe, expect, it } from 'vitest';
import { createRunResult } from '../../src/ui/run-result.js';

describe('canonical run result', () => {
  it('captures one read-only normalized run snapshot', () => {
    const result = createRunResult({
      characterId: 'runner',
      runTime: 125.9,
      scrap: 87.8,
      level: 6.7,
    }, 'SYSTEM FAILURE');

    expect(result).toMatchObject({
      reason: 'SYSTEM FAILURE',
      characterId: 'runner',
      survivedSeconds: 125,
      scrap: 87,
      level: 6,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('clamps invalid runtime values without creating rewards or gameplay state', () => {
    const result = createRunResult({
      characterId: 'runner',
      runTime: -4,
      scrap: Number.NaN,
      level: 0,
    }, 'RUN COMPLETE');

    expect(result.survivedSeconds).toBe(0);
    expect(result.scrap).toBe(0);
    expect(result.level).toBe(1);
    expect(Object.keys(result).sort()).toEqual([
      'characterId',
      'createdAt',
      'level',
      'reason',
      'scrap',
      'survivedSeconds',
    ]);
  });
});

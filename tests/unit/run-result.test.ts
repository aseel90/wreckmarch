import { describe, expect, it } from 'vitest';
import { createRunResult } from '../../src/ui/run-result.js';

describe('canonical run result', () => {
  it('captures one read-only normalized run snapshot with a stable runId', () => {
    const scene: any = {
      __wmRunId: 'run-stable-001',
      characterId: 'runner',
      runTime: 125.9,
      scrap: 87.8,
      level: 6.7,
    };
    const result = createRunResult(scene, 'SYSTEM FAILURE');
    const second = createRunResult(scene, 'SYSTEM FAILURE');

    expect(result).toMatchObject({
      runId: 'run-stable-001',
      reason: 'SYSTEM FAILURE',
      characterId: 'runner',
      survivedSeconds: 125,
      scrap: 87,
      level: 6,
    });
    expect(second.runId).toBe(result.runId);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('clamps invalid runtime values without creating reward or gameplay state', () => {
    const result = createRunResult({
      __wmRunId: 'run-invalid-001',
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
      'runId',
      'scrap',
      'survivedSeconds',
    ]);
  });
});

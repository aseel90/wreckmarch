import { describe, expect, it } from 'vitest';
import { evaluateProgressionMilestones, getWorkshopRank } from '../../src/progression/progression-milestones.js';

describe('Progression Workshop milestones', () => {
  it('derives milestone state from the canonical progression snapshot without mutating it', () => {
    const profile = Object.freeze({ totalRuns: 3, highestLevel: 6, bestSurvivalSeconds: 145, lifetimeScrapCollected: 500 });
    const milestones = evaluateProgressionMilestones(profile);
    expect(milestones.map(item => [item.id, item.complete])).toEqual([
      ['first-deployment', true],
      ['scrap-hand', true],
      ['stay-moving', true],
      ['field-veteran', false],
      ['long-haul', false],
    ]);
    expect(Object.isFrozen(milestones)).toBe(true);
    expect(profile).toEqual({ totalRuns: 3, highestLevel: 6, bestSurvivalSeconds: 145, lifetimeScrapCollected: 500 });
  });

  it('assigns a display-only Workshop rank from completed milestone count', () => {
    expect(getWorkshopRank({})).toEqual({ label: 'UNTESTED', completed: 0, total: 5 });
    expect(getWorkshopRank({ totalRuns: 1, highestLevel: 5, bestSurvivalSeconds: 120 })).toEqual({ label: 'ROAD PROVEN', completed: 3, total: 5 });
    expect(getWorkshopRank({ totalRuns: 10, highestLevel: 8, bestSurvivalSeconds: 650 })).toEqual({ label: 'WASTELAND HARDENED', completed: 5, total: 5 });
  });
});

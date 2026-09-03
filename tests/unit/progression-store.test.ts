import { describe, expect, it } from 'vitest';
import { ProgressionStore } from '../../src/progression/progression-store.js';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => { values.clear(); },
    key: (index: number) => Array.from(values.keys())[index] ?? null,
  };
}

describe('canonical ProgressionStore', () => {
  it('records persistent run statistics without creating currency or rewards', () => {
    const storage = createStorage();
    const store = new ProgressionStore({ storage });
    store.recordRun({ survivedSeconds: 92, scrap: 70, level: 5, createdAt: '2026-09-03T10:00:00.000Z' });
    const snapshot = store.recordRun({ survivedSeconds: 61, scrap: 40, level: 4, createdAt: '2026-09-03T10:05:00.000Z' });
    expect(snapshot).toEqual({
      version: 1,
      totalRuns: 2,
      bestSurvivalSeconds: 92,
      highestLevel: 5,
      lifetimeScrapCollected: 110,
      lastRunAt: '2026-09-03T10:05:00.000Z',
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect('currency' in snapshot).toBe(false);
    expect('unlockedCharacters' in snapshot).toBe(false);
  });

  it('restores sanitized persisted values and survives corrupt storage', () => {
    const storage = createStorage();
    storage.setItem('wreckmarch.progression.v1', JSON.stringify({ totalRuns: 3.8, bestSurvivalSeconds: 120, highestLevel: 7, lifetimeScrapCollected: 900 }));
    expect(new ProgressionStore({ storage }).snapshot()).toMatchObject({ totalRuns: 3, bestSurvivalSeconds: 120, highestLevel: 7, lifetimeScrapCollected: 900 });

    const broken = createStorage();
    broken.setItem('wreckmarch.progression.v1', '{bad json');
    expect(new ProgressionStore({ storage: broken }).snapshot()).toMatchObject({ totalRuns: 0, bestSurvivalSeconds: 0, highestLevel: 1, lifetimeScrapCollected: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import {
  LEGACY_PROGRESSION_STORAGE_KEY,
  PREVIOUS_PROGRESSION_STORAGE_KEY,
  PROGRESSION_STORAGE_KEY,
  ProgressionStore,
} from '../../src/progression/progression-store.js';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => { values.clear(); },
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => { values.delete(key); },
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
  };
}

function run(runId: string, survivedSeconds = 92, scrap = 70, level = 5) {
  return { runId, survivedSeconds, scrap, level, createdAt: '2026-09-03T10:00:00.000Z' };
}

describe('canonical ProgressionStore v3', () => {
  it('migrates v1 records without converting lifetime Scrap into currency', () => {
    const storage = createStorage();
    storage.setItem(LEGACY_PROGRESSION_STORAGE_KEY, JSON.stringify({
      version: 1,
      totalRuns: 3,
      bestSurvivalSeconds: 120,
      highestLevel: 7,
      lifetimeScrapCollected: 900,
      lastRunAt: '2026-09-03T09:00:00.000Z',
    }));

    const snapshot = new ProgressionStore({ storage }).snapshot();
    expect(snapshot).toMatchObject({
      version: 3,
      totalRuns: 3,
      bestSurvivalSeconds: 120,
      highestLevel: 7,
      lifetimeScrapCollected: 900,
      workshopScrip: 0,
      recordedRunIds: [],
      rewardedRunIds: [],
      ownedWorkshopItemIds: [],
    });
    expect(storage.getItem(PROGRESSION_STORAGE_KEY)).not.toBeNull();
    expect(storage.getItem(LEGACY_PROGRESSION_STORAGE_KEY)).toBeNull();
  });

  it('migrates v2 Scrip and run idempotency state into v3 without inventing ownership', () => {
    const storage = createStorage();
    storage.setItem(PREVIOUS_PROGRESSION_STORAGE_KEY, JSON.stringify({
      version: 2,
      totalRuns: 2,
      bestSurvivalSeconds: 180,
      highestLevel: 5,
      lifetimeScrapCollected: 120,
      workshopScrip: 4,
      recordedRunIds: ['run-a', 'run-b'],
      rewardedRunIds: ['run-a', 'run-b'],
      lastRunAt: '2026-09-03T10:00:00.000Z',
    }));
    const snapshot = new ProgressionStore({ storage }).snapshot();
    expect(snapshot).toMatchObject({ version: 3, workshopScrip: 4, ownedWorkshopItemIds: [] });
    expect(storage.getItem(PREVIOUS_PROGRESSION_STORAGE_KEY)).toBeNull();
  });

  it('records statistics and Workshop Scrip once per canonical runId', () => {
    const storage = createStorage();
    const store = new ProgressionStore({ storage });
    const result = run('run-001');
    const reward = { runId: 'run-001', amount: 2 };

    const first = store.recordRun(result, { workshopReward: reward });
    expect(first).toMatchObject({
      version: 3,
      totalRuns: 1,
      bestSurvivalSeconds: 92,
      highestLevel: 5,
      lifetimeScrapCollected: 70,
      workshopScrip: 2,
      recordedRunIds: ['run-001'],
      rewardedRunIds: ['run-001'],
      ownedWorkshopItemIds: [],
    });

    const duplicate = store.recordRun(result, { workshopReward: reward });
    expect(duplicate.totalRuns).toBe(1);
    expect(duplicate.lifetimeScrapCollected).toBe(70);
    expect(duplicate.workshopScrip).toBe(2);
    expect(Object.isFrozen(duplicate)).toBe(true);
    expect(Object.isFrozen(duplicate.ownedWorkshopItemIds)).toBe(true);
  });

  it('purchases a one-time Workshop item atomically and never double-spends it', () => {
    const storage = createStorage();
    const store = new ProgressionStore({ storage });
    store.recordRun(run('run-buy', 180), { workshopReward: { runId: 'run-buy', amount: 2 } });

    const first = store.purchaseWorkshopItem({ itemId: 'terminal-plate-rustline', cost: 2 });
    expect(first.status).toBe('purchased');
    expect(first.charged).toBe(2);
    expect(first.snapshot.workshopScrip).toBe(0);
    expect(first.snapshot.ownedWorkshopItemIds).toEqual(['terminal-plate-rustline']);

    const duplicate = store.purchaseWorkshopItem({ itemId: 'terminal-plate-rustline', cost: 2 });
    expect(duplicate.status).toBe('already-owned');
    expect(duplicate.charged).toBe(0);
    expect(duplicate.snapshot.workshopScrip).toBe(0);
    expect(duplicate.snapshot.ownedWorkshopItemIds).toEqual(['terminal-plate-rustline']);
  });

  it('does not mutate balance or ownership when Workshop Scrip is insufficient', () => {
    const storage = createStorage();
    const store = new ProgressionStore({ storage });
    store.recordRun(run('run-short'), { workshopReward: { runId: 'run-short', amount: 1 } });
    const transaction = store.purchaseWorkshopItem({ itemId: 'terminal-plate-rustline', cost: 2 });
    expect(transaction.status).toBe('insufficient-funds');
    expect(transaction.snapshot.workshopScrip).toBe(1);
    expect(transaction.snapshot.ownedWorkshopItemIds).toEqual([]);
  });

  it('marks zero-value evaluated rewards idempotently and rejects cross-run rewards', () => {
    const storage = createStorage();
    const store = new ProgressionStore({ storage });
    const result = run('run-002', 20, 5, 1);
    const snapshot = store.recordRun(result, { workshopReward: { runId: 'run-002', amount: 0 } });
    expect(snapshot.workshopScrip).toBe(0);
    expect(snapshot.rewardedRunIds).toEqual(['run-002']);
    expect(() => store.recordRun(run('run-003'), { workshopReward: { runId: 'other-run', amount: 3 } })).toThrow(/runId/);
  });

  it('survives corrupt storage and preserves no character unlock state', () => {
    const storage = createStorage();
    storage.setItem(PROGRESSION_STORAGE_KEY, '{bad json');
    storage.setItem(PREVIOUS_PROGRESSION_STORAGE_KEY, '{also bad');
    storage.setItem(LEGACY_PROGRESSION_STORAGE_KEY, '{still bad');
    const snapshot = new ProgressionStore({ storage }).snapshot();
    expect(snapshot).toMatchObject({ totalRuns: 0, bestSurvivalSeconds: 0, highestLevel: 1, lifetimeScrapCollected: 0, workshopScrip: 0, ownedWorkshopItemIds: [] });
    expect('unlockedCharacters' in snapshot).toBe(false);
  });
});

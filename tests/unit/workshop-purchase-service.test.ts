import { describe, expect, it } from 'vitest';
import { ProgressionStore } from '../../src/progression/progression-store.js';
import { purchaseWorkshopItem } from '../../src/workshop/workshop-purchase-service.js';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };
}

describe('Workshop purchase service', () => {
  it('uses catalog cost rather than caller-controlled pricing', () => {
    const store = new ProgressionStore({ storage: createStorage() });
    store.recordRun({ runId: 'rewarded', survivedSeconds: 180, scrap: 0, level: 1, createdAt: '2026-09-03T10:00:00Z' }, { workshopReward: { runId: 'rewarded', amount: 2 } });
    const transaction = purchaseWorkshopItem('terminal-plate-rustline', store);
    expect(transaction.status).toBe('purchased');
    expect(transaction.charged).toBe(2);
    expect(transaction.snapshot.workshopScrip).toBe(0);
  });

  it('rejects unknown catalog ids without mutating permanent state', () => {
    const store = new ProgressionStore({ storage: createStorage() });
    const transaction = purchaseWorkshopItem('shotgun-unlock', store);
    expect(transaction.status).toBe('unavailable');
    expect(transaction.charged).toBe(0);
    expect(transaction.snapshot.ownedWorkshopItemIds).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { ProgressionStore } from '../../src/progression/progression-store.js';
import {
  WORKSHOP_ITEM_IDS,
  WORKSHOP_ITEM_TYPES,
  getActiveTerminalPlate,
  getWorkshopCatalogItem,
  listWorkshopCatalogItems,
} from '../../src/workshop/workshop-catalog.js';
import { purchaseWorkshopItem } from '../../src/workshop/workshop-purchase-service.js';

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

describe('canonical Workshop catalog and purchase service', () => {
  it('ships only non-power terminal cosmetics and never exposes Shotgun as a purchasable item', () => {
    const items = listWorkshopCatalogItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE,
      type: WORKSHOP_ITEM_TYPES.TERMINAL_PLATE,
      cost: 2,
      availability: 'available',
    });
    expect(items[0].description.toLowerCase()).toContain('cosmetic only');
    expect(JSON.stringify(items).toLowerCase()).not.toContain('shotgun');
  });

  it('uses the catalog-owned cost, persists ownership, and activates the owned terminal plate', () => {
    const store = new ProgressionStore({ storage: createStorage() });
    store.recordRun(
      { runId: 'run-workshop-fund', survivedSeconds: 180, scrap: 0, level: 1, createdAt: '2026-09-03T10:00:00.000Z' },
      { workshopReward: { runId: 'run-workshop-fund', amount: 2 } },
    );

    const item = getWorkshopCatalogItem(WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE);
    expect(item).not.toBeNull();
    const transaction = purchaseWorkshopItem(WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE, store);
    expect(transaction).toMatchObject({ status: 'purchased', charged: 2 });
    expect(transaction.snapshot.workshopScrip).toBe(0);
    expect(transaction.snapshot.ownedWorkshopItemIds).toEqual([WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE]);
    expect(getActiveTerminalPlate(transaction.snapshot)?.id).toBe(WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE);

    const duplicate = purchaseWorkshopItem(WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE, store);
    expect(duplicate).toMatchObject({ status: 'already-owned', charged: 0 });
  });

  it('rejects unknown catalog ids without charging the store', () => {
    const store = new ProgressionStore({ storage: createStorage() });
    const transaction = purchaseWorkshopItem('shotgun', store);
    expect(transaction).toMatchObject({ status: 'unavailable', charged: 0, item: null });
    expect(transaction.snapshot.workshopScrip).toBe(0);
    expect(transaction.snapshot.ownedWorkshopItemIds).toEqual([]);
  });
});

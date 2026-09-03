import { describe, expect, it } from 'vitest';
import { listWorkshopCatalogItems, WORKSHOP_ITEM_IDS, WORKSHOP_ITEM_TYPES } from '../../src/workshop/workshop-catalog.js';

describe('Workshop catalog v1', () => {
  it('contains unique canonical non-power items with positive Scrip costs', () => {
    const items = listWorkshopCatalogItems();
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map(item => item.id)).size).toBe(items.length);
    for (const item of items) {
      expect(item.cost).toBeGreaterThan(0);
      expect(item.availability).toBe('available');
      expect(item.description.toLowerCase()).toContain('cosmetic');
      expect(JSON.stringify(item).toLowerCase()).not.toContain('damage');
      expect(JSON.stringify(item).toLowerCase()).not.toContain('shotgun');
    }
  });

  it('starts with the Rustline terminal plate and no character unlock content', () => {
    const items = listWorkshopCatalogItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE,
      type: WORKSHOP_ITEM_TYPES.TERMINAL_PLATE,
      cost: 2,
    });
  });
});

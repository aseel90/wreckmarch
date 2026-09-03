import { progressionStore } from '../progression/progression-store.js?v=3';
import { getWorkshopCatalogItem } from './workshop-catalog.js?v=1';

export function purchaseWorkshopItem(itemId, store = progressionStore) {
  const item = getWorkshopCatalogItem(itemId);
  if (!item || item.availability !== 'available') {
    return Object.freeze({ status: 'unavailable', itemId, charged: 0, item: item || null, snapshot: store.snapshot() });
  }
  const transaction = store.purchaseWorkshopItem({ itemId: item.id, cost: item.cost });
  return Object.freeze({ ...transaction, item });
}

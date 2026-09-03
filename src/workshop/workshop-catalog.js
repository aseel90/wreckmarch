export const WORKSHOP_CATALOG_VERSION = 'workshop-catalog-v1';
export const WORKSHOP_ITEM_TYPES = Object.freeze({ TERMINAL_PLATE: 'terminal-plate' });
export const WORKSHOP_ITEM_IDS = Object.freeze({ RUSTLINE_TERMINAL_PLATE: 'terminal-plate-rustline' });

const ITEMS = Object.freeze([
  Object.freeze({
    id: WORKSHOP_ITEM_IDS.RUSTLINE_TERMINAL_PLATE,
    type: WORKSHOP_ITEM_TYPES.TERMINAL_PLATE,
    name: 'RUSTLINE SIGNAL PLATE',
    cost: 2,
    availability: 'available',
    description: 'A road-worn deployment-terminal plate. Cosmetic only; no combat or card effect.',
    presentation: Object.freeze({ label: 'RUSTLINE // FIELD WORN', tone: 'rustline' }),
  }),
]);

const BY_ID = new Map(ITEMS.map(item => [item.id, item]));

export function listWorkshopCatalogItems() {
  return ITEMS;
}

export function getWorkshopCatalogItem(itemId) {
  return BY_ID.get(itemId) || null;
}

export function getActiveTerminalPlate(profile) {
  const owned = Array.isArray(profile?.ownedWorkshopItemIds) ? profile.ownedWorkshopItemIds : [];
  return ITEMS.find(item => item.type === WORKSHOP_ITEM_TYPES.TERMINAL_PLATE && owned.includes(item.id)) || null;
}

import {
  getCharacterEntry,
  isCharacterSelectable,
  listCharacterEntries,
} from '../characters/character-registry.js?v=5';

export function listCharacterSelectOptions() {
  return listCharacterEntries().map(entry => Object.freeze({
    id: entry.id,
    displayName: entry.displayName,
    availability: entry.availability,
    selectable: isCharacterSelectable(entry.id),
    lockReason: entry.lockReason || null,
    preview: entry.preview,
  }));
}

export function resolveCharacterSelection(characterId) {
  const entry = getCharacterEntry(characterId);
  return Object.freeze({
    characterId: entry.id,
    selectable: isCharacterSelectable(entry.id),
    availability: entry.availability,
    entry,
  });
}

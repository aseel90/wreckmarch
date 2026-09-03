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

export function resolveFirstSelectableCharacter() {
  const option = listCharacterSelectOptions().find(candidate => candidate.selectable);
  if (!option) throw new Error('No selectable character is registered');
  return resolveCharacterSelection(option.id);
}

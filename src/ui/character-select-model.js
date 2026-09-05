import {
  listCharacterAccess,
  resolveCharacterAccess,
  resolveFirstAccessibleCharacter,
} from '../characters/character-access.js?v=2';

function toSelection(access) {
  return Object.freeze({
    characterId: access.characterId,
    displayName: access.entry.displayName,
    selectable: access.selectable,
    availability: access.availability,
    productionAvailability: access.productionAvailability,
    productionReady: access.productionReady,
    playerOwned: access.playerOwned,
    lockReason: access.lockReason,
    entry: access.entry,
  });
}

export function listCharacterSelectOptions(playerProfile) {
  return listCharacterAccess(playerProfile).map(access => Object.freeze({
    id: access.entry.id,
    displayName: access.entry.displayName,
    availability: access.availability,
    productionAvailability: access.productionAvailability,
    productionReady: access.productionReady,
    playerOwned: access.playerOwned,
    selectable: access.selectable,
    lockReason: access.lockReason,
    preview: access.entry.preview,
  }));
}

export function resolveCharacterSelection(characterId, playerProfile) {
  return toSelection(resolveCharacterAccess(characterId, playerProfile));
}

export function resolveFirstSelectableCharacter(playerProfile) {
  return toSelection(resolveFirstAccessibleCharacter(playerProfile));
}

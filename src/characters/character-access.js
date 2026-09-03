/* WRECKMARCH — canonical effective character access = production readiness × player ownership */
import {
  CHARACTER_AVAILABILITY,
  getCharacterEntry,
  isCharacterSelectable,
  listCharacterEntries,
} from './character-registry.js?v=5';
import { characterOwnershipStore } from './character-ownership-store.js?v=1';

export const CHARACTER_ACCESS_LOCK_REASONS = Object.freeze({
  PRODUCTION_GATE: 'production-gate',
  NOT_OWNED: 'not-owned',
});

function normalizePlayerProfile(playerProfile) {
  const ownedCharacterIds = Array.isArray(playerProfile?.ownedCharacterIds)
    ? [...new Set(playerProfile.ownedCharacterIds.filter(id => typeof id === 'string' && id))]
    : [];
  return { ownedCharacterIds };
}

export function resolveCharacterAccess(characterId, playerProfile = characterOwnershipStore.snapshot()) {
  const entry = getCharacterEntry(characterId);
  const profile = normalizePlayerProfile(playerProfile);
  const productionReady = isCharacterSelectable(entry.id);
  const playerOwned = profile.ownedCharacterIds.includes(entry.id);
  const selectable = productionReady && playerOwned;
  const lockReason = !productionReady
    ? (entry.lockReason || CHARACTER_ACCESS_LOCK_REASONS.PRODUCTION_GATE)
    : (!playerOwned ? CHARACTER_ACCESS_LOCK_REASONS.NOT_OWNED : null);

  return Object.freeze({
    characterId: entry.id,
    productionAvailability: entry.availability,
    productionReady,
    playerOwned,
    selectable,
    availability: selectable ? CHARACTER_AVAILABILITY.SELECTABLE : CHARACTER_AVAILABILITY.LOCKED,
    lockReason,
    entry,
  });
}

export function listCharacterAccess(playerProfile = characterOwnershipStore.snapshot()) {
  return listCharacterEntries().map(entry => resolveCharacterAccess(entry.id, playerProfile));
}

export function resolveFirstAccessibleCharacter(playerProfile = characterOwnershipStore.snapshot()) {
  const access = listCharacterAccess(playerProfile).find(candidate => candidate.selectable);
  if (!access) throw new Error('No player-accessible character is registered');
  return access;
}

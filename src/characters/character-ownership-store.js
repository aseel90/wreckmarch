/* WRECKMARCH — persistent player character ownership, separate from production readiness */

export const CHARACTER_OWNERSHIP_STORAGE_KEY = 'wreckmarch.character-ownership.v1';

const DEFAULT_OWNED_CHARACTER_IDS = Object.freeze(['runner']);

function getDefaultStorage() {
  try { return globalThis.localStorage || null; }
  catch { return null; }
}

function normalizeOwnedCharacterIds(value) {
  const ids = Array.isArray(value) ? value : [];
  return [...new Set([
    ...DEFAULT_OWNED_CHARACTER_IDS,
    ...ids.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()),
  ])];
}

function freezeSnapshot(state) {
  return Object.freeze({
    version: 1,
    ownedCharacterIds: Object.freeze([...state.ownedCharacterIds]),
  });
}

export class CharacterOwnershipStore {
  constructor({ storage = getDefaultStorage(), storageKey = CHARACTER_OWNERSHIP_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.listeners = new Set();
    this.state = this.#load();
  }

  #load() {
    if (!this.storage) return { version: 1, ownedCharacterIds: normalizeOwnedCharacterIds([]) };
    try {
      const raw = this.storage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        version: 1,
        ownedCharacterIds: normalizeOwnedCharacterIds(parsed?.ownedCharacterIds),
      };
    } catch {
      return { version: 1, ownedCharacterIds: normalizeOwnedCharacterIds([]) };
    }
  }

  #persist() {
    if (!this.storage) return;
    try { this.storage.setItem(this.storageKey, JSON.stringify(this.state)); }
    catch { /* Ownership persistence failure must not block the core game. */ }
  }

  #publish() {
    const snapshot = this.snapshot();
    this.listeners.forEach(listener => listener(snapshot));
    return snapshot;
  }

  snapshot() {
    return freezeSnapshot(this.state);
  }

  owns(characterId) {
    return this.state.ownedCharacterIds.includes(characterId);
  }

  grant(characterId) {
    const id = typeof characterId === 'string' ? characterId.trim() : '';
    if (!id) throw new TypeError('Character ownership grant requires a character id');
    if (this.owns(id)) return this.snapshot();
    this.state = {
      version: 1,
      ownedCharacterIds: normalizeOwnedCharacterIds([...this.state.ownedCharacterIds, id]),
    };
    this.#persist();
    return this.#publish();
  }

  reset() {
    this.state = { version: 1, ownedCharacterIds: normalizeOwnedCharacterIds([]) };
    this.#persist();
    return this.#publish();
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('CharacterOwnershipStore subscriber must be a function');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const characterOwnershipStore = new CharacterOwnershipStore();

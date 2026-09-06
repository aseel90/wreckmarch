import { describe, expect, it } from 'vitest';
import { CharacterOwnershipStore } from '../../src/characters/character-ownership-store.js';

function memoryStorage(seed: Record<string, string> = {}) {
  const state = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => state.get(key) ?? null,
    setItem: (key: string, value: string) => { state.set(key, value); },
  };
}

describe('character ownership store', () => {
  it('keeps both launch characters owned by default', () => {
    const store = new CharacterOwnershipStore({ storage: memoryStorage() as any, storageKey: 'test' });
    expect(store.snapshot().ownedCharacterIds).toEqual(['runner', 'shotgun']);
    expect(store.owns('runner')).toBe(true);
    expect(store.owns('shotgun')).toBe(true);
  });

  it('persists explicit ownership independently of production readiness', () => {
    const storage = memoryStorage();
    const first = new CharacterOwnershipStore({ storage: storage as any, storageKey: 'test' });
    first.grant('future-character');
    const second = new CharacterOwnershipStore({ storage: storage as any, storageKey: 'test' });
    expect(second.snapshot().ownedCharacterIds).toEqual(['runner', 'shotgun', 'future-character']);
  });

  it('repairs a corrupt snapshot that omitted launch characters', () => {
    const storage = memoryStorage({ test: JSON.stringify({ version: 1, ownedCharacterIds: ['other'] }) });
    const store = new CharacterOwnershipStore({ storage: storage as any, storageKey: 'test' });
    expect(store.snapshot().ownedCharacterIds).toEqual(['runner', 'shotgun', 'other']);
  });
});

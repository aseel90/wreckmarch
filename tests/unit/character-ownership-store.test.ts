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
  it('keeps Runner owned by default', () => {
    const store = new CharacterOwnershipStore({ storage: memoryStorage() as any, storageKey: 'test' });
    expect(store.snapshot().ownedCharacterIds).toEqual(['runner']);
    expect(store.owns('runner')).toBe(true);
  });

  it('persists explicit ownership independently of production readiness', () => {
    const storage = memoryStorage();
    const first = new CharacterOwnershipStore({ storage: storage as any, storageKey: 'test' });
    first.grant('shotgun');
    const second = new CharacterOwnershipStore({ storage: storage as any, storageKey: 'test' });
    expect(second.snapshot().ownedCharacterIds).toEqual(['runner', 'shotgun']);
  });

  it('repairs a corrupt snapshot that omitted Runner', () => {
    const storage = memoryStorage({ test: JSON.stringify({ version: 1, ownedCharacterIds: ['other'] }) });
    const store = new CharacterOwnershipStore({ storage: storage as any, storageKey: 'test' });
    expect(store.snapshot().ownedCharacterIds).toEqual(['runner', 'other']);
  });
});

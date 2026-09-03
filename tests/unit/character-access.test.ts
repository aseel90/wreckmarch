import { describe, expect, it } from 'vitest';
import { resolveCharacterAccess } from '../../src/characters/character-access.js';

describe('canonical character access resolver', () => {
  it('allows the default-owned production-ready Runner', () => {
    expect(resolveCharacterAccess('runner')).toMatchObject({
      characterId: 'runner',
      productionReady: true,
      playerOwned: true,
      selectable: true,
      lockReason: null,
    });
  });

  it('blocks a production-ready character when the player does not own it', () => {
    expect(resolveCharacterAccess('runner', { ownedCharacterIds: [] })).toMatchObject({
      productionReady: true,
      playerOwned: false,
      selectable: false,
      availability: 'locked',
      lockReason: 'not-owned',
    });
  });

  it('keeps a production-locked character blocked even when ownership is mocked true', () => {
    expect(resolveCharacterAccess('shotgun', { ownedCharacterIds: ['shotgun'] })).toMatchObject({
      productionReady: false,
      playerOwned: true,
      selectable: false,
      availability: 'locked',
      lockReason: 'production-gate',
    });
  });

  it('blocks a production-locked and unowned character at the production gate first', () => {
    expect(resolveCharacterAccess('shotgun', { ownedCharacterIds: [] })).toMatchObject({
      productionReady: false,
      playerOwned: false,
      selectable: false,
      lockReason: 'production-gate',
    });
  });

  it('hard-fails unknown character ids instead of falling back', () => {
    expect(() => resolveCharacterAccess('unknown-survivor')).toThrow('Unknown character: unknown-survivor');
  });
});

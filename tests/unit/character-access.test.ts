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

  it('allows the production-approved owned Wrecker', () => {
    expect(resolveCharacterAccess('shotgun')).toMatchObject({
      characterId: 'shotgun',
      productionReady: true,
      playerOwned: true,
      selectable: true,
      availability: 'selectable',
      lockReason: null,
    });
  });

  it('blocks Wrecker only when ownership is explicitly absent', () => {
    expect(resolveCharacterAccess('shotgun', { ownedCharacterIds: [] })).toMatchObject({
      productionReady: true,
      playerOwned: false,
      selectable: false,
      lockReason: 'not-owned',
    });
  });

  it('hard-fails unknown character ids instead of falling back', () => {
    expect(() => resolveCharacterAccess('unknown-survivor')).toThrow('Unknown character: unknown-survivor');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import {
  activateCharacterProductionValidation,
  getCharacterProductionValidationDefinition,
  isCharacterProductionValidationActive,
  resolveCharacterProductionValidationRequest
} from '../../src/characters/character-production-validation.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';

const clearMarker = () => {
  delete (globalThis as any).__WM_CHARACTER_PRODUCTION_VALIDATION__;
};

afterEach(clearMarker);

describe('character production validation boundary', () => {
  it('requires an explicit autotest validation request', () => {
    expect(resolveCharacterProductionValidationRequest('?autotest=1')).toBeNull();
    expect(() => resolveCharacterProductionValidationRequest('?characterValidation=shotgun')).toThrow('requires autotest=1');
  });

  it('admits the locked Shotgun definition without changing canonical selectability', () => {
    const request = resolveCharacterProductionValidationRequest('?autotest=1&characterValidation=shotgun');
    expect(request?.characterId).toBe('shotgun');
    activateCharacterProductionValidation(request);

    expect(isCharacterProductionValidationActive('shotgun')).toBe(true);
    expect(getCharacterProductionValidationDefinition('shotgun')).toBe(getCharacterEntry('shotgun').definition);
    expect(getCharacterEntry('shotgun').availability).toBe('locked');
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
  });

  it('does not validate selectable Runner through the locked-character harness', () => {
    expect(() => resolveCharacterProductionValidationRequest('?autotest=1&characterValidation=runner')).toThrow('requires a locked character');
  });
});

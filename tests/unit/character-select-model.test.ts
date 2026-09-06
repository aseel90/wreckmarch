import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  listCharacterSelectOptions,
  resolveCharacterSelection,
  resolveFirstSelectableCharacter,
} from '../../src/ui/character-select-model.js';

type CharacterSelectOption = {
  id: string;
  displayName: string;
  availability: string;
};

describe('Character Select canonical model', () => {
  it('renders both launch characters from canonical character access without screen-specific identity logic', () => {
    expect(listCharacterSelectOptions().map((option: CharacterSelectOption) => [option.id, option.displayName, option.availability])).toEqual([
      ['runner', 'Runner', 'selectable'],
      ['shotgun', 'Wrecker', 'selectable'],
    ]);
    expect(resolveCharacterSelection('runner')).toMatchObject({
      characterId: 'runner', selectable: true, playerOwned: true, productionReady: true,
    });
    expect(resolveCharacterSelection('shotgun')).toMatchObject({
      characterId: 'shotgun', selectable: true, availability: 'selectable', productionReady: true, playerOwned: true,
    });
    expect(resolveFirstSelectableCharacter()).toMatchObject({ selectable: true, availability: 'selectable' });
  });

  it('keeps ownership separate from production readiness after activation', () => {
    expect(resolveCharacterSelection('runner', { ownedCharacterIds: [] })).toMatchObject({
      selectable: false,
      availability: 'locked',
      productionAvailability: 'selectable',
      productionReady: true,
      playerOwned: false,
      lockReason: 'not-owned',
    });
    expect(resolveCharacterSelection('shotgun', { ownedCharacterIds: [] })).toMatchObject({
      selectable: false,
      productionReady: true,
      playerOwned: false,
      lockReason: 'not-owned',
    });
  });

  it('keeps character-specific branching out of the screen and autotest selection implementations', () => {
    const screenSource = fs.readFileSync(new URL('../../src/ui/character-select-screen.js', import.meta.url), 'utf8');
    const runtimeSource = fs.readFileSync(new URL('../../src/ui/frontend-runtime.js', import.meta.url), 'utf8');
    for (const source of [screenSource, runtimeSource]) {
      expect(source).not.toContain("'shotgun'");
      expect(source).not.toContain('"shotgun"');
      expect(source).not.toContain("'runner'");
      expect(source).not.toContain('"runner"');
    }
    expect(screenSource).toContain('option.availability');
    expect(screenSource).toContain('option.selectable');
    expect(runtimeSource).toContain('resolveFirstSelectableCharacter');
    expect(runtimeSource).toContain('resolveCharacterAccess');
    expect(runtimeSource).not.toContain('character-production-validation');
  });
});

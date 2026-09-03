import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  listCharacterSelectOptions,
  resolveCharacterSelection,
  resolveFirstSelectableCharacter,
} from '../../src/ui/character-select-model.js';

type CharacterSelectOption = {
  id: string;
  availability: string;
};

describe('Character Select canonical model', () => {
  it('renders registry-owned availability without creating a Shotgun runtime definition', () => {
    expect(listCharacterSelectOptions().map((option: CharacterSelectOption) => [option.id, option.availability])).toEqual([
      ['runner', 'selectable'],
      ['shotgun', 'locked'],
    ]);
    expect(resolveCharacterSelection('runner')).toMatchObject({ characterId: 'runner', selectable: true });
    expect(resolveCharacterSelection('shotgun')).toMatchObject({ characterId: 'shotgun', selectable: false, availability: 'locked' });
    expect(resolveFirstSelectableCharacter()).toMatchObject({ selectable: true, availability: 'selectable' });
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
  });
});
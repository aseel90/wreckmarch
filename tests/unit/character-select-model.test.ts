import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listCharacterSelectOptions, resolveCharacterSelection } from '../../src/ui/character-select-model.js';

describe('Character Select canonical model', () => {
  it('renders registry-owned availability without creating a Shotgun runtime definition', () => {
    expect(listCharacterSelectOptions().map(option => [option.id, option.availability])).toEqual([
      ['runner', 'selectable'],
      ['shotgun', 'locked'],
    ]);
    expect(resolveCharacterSelection('runner')).toMatchObject({ characterId: 'runner', selectable: true });
    expect(resolveCharacterSelection('shotgun')).toMatchObject({ characterId: 'shotgun', selectable: false, availability: 'locked' });
  });

  it('keeps character-specific branching out of the screen implementation', () => {
    const source = fs.readFileSync(new URL('../../src/ui/character-select-screen.js', import.meta.url), 'utf8');
    expect(source).not.toContain("'shotgun'");
    expect(source).not.toContain('"shotgun"');
    expect(source).toContain('option.availability');
    expect(source).toContain('option.selectable');
  });
});

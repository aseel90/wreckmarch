import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasCharacterRuntimePresentation } from '../../src/characters/character-runtime-presentation.js';
import { getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('character runtime presentation registry', () => {
  it('registers character-owned presenters without bypassing locked character access', () => {
    expect(hasCharacterRuntimePresentation('runner', 'c5')).toBe(true);
    expect(hasCharacterRuntimePresentation('runner', 'd1')).toBe(true);
    expect(hasCharacterRuntimePresentation('shotgun', 'c5')).toBe(true);
    expect(hasCharacterRuntimePresentation('shotgun', 'd1')).toBe(true);
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(() => getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
  });

  it('keeps phase layers free of character-specific selection branches', () => {
    for (const path of ['src/phase-c5-runtime.js', 'src/phase-d1-runtime.js']) {
      const source = read(path);
      expect(source).not.toContain("=== 'runner'");
      expect(source).not.toContain("=== 'shotgun'");
      expect(source).not.toContain("||'runner'");
    }
  });

  it('keeps Shotgun presentation inside its character-owned adapter', () => {
    const shotgun = read('src/characters/shotgun-production-presentation.js');
    expect(shotgun).toContain('SHOTGUN_RUNTIME_PRESENTATION');
    expect(shotgun).toContain('setMuzzleResolver');
    expect(shotgun).toContain('setFireFeedback');
    expect(shotgun).toContain('.setCrop()');
    expect(shotgun).toContain('.setFlipY(false)');
    expect(shotgun).not.toContain('runner-production-presentation');
    expect(shotgun).not.toContain('maxHp');
    expect(shotgun).not.toContain('moveSpeed');
  });
});

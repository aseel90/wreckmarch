import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasCharacterRuntimePresentation } from '../../src/characters/character-runtime-presentation.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('character runtime presentation registry', () => {
  it('registers the production Runner phases without registering locked Shotgun gameplay', () => {
    expect(hasCharacterRuntimePresentation('runner', 'c5')).toBe(true);
    expect(hasCharacterRuntimePresentation('runner', 'd1')).toBe(true);
    expect(hasCharacterRuntimePresentation('shotgun', 'c5')).toBe(false);
    expect(hasCharacterRuntimePresentation('shotgun', 'd1')).toBe(false);
  });

  it('keeps phase layers free of character-specific selection branches', () => {
    for (const path of ['src/phase-c5-runtime.js', 'src/phase-d1-runtime.js']) {
      const source = read(path);
      expect(source).not.toContain("=== 'runner'");
      expect(source).not.toContain("=== 'shotgun'");
      expect(source).not.toContain("||'runner'");
    }
  });
});

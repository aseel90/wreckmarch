import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Runner live integration boundary', () => {
  it('routes final Runner visuals, locomotion, and weapon socket through CharacterSystem', () => {
    const d1 = read('src/phase-d1-runtime.js');
    expect(d1).toContain("new CharacterSystem(s,s.characterId||'runner')");
    expect(d1).toContain('character.installProductionVisuals()');
    expect(d1).toContain('this.characterSystem.updateLocomotionVisuals()');
    expect(d1).toContain('this.characterSystem.getWeaponSocket(q)');
    expect(d1).toContain('this.characterSystem.getMuzzleReach(q)');
    expect(d1).not.toContain("moving?'d1-hero-run':'d1-hero-idle'");
    expect(d1).not.toContain('const reach=q%2?70:76');
  });
});

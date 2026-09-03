import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('playable character presentation integration boundary', () => {
  it('keeps C5/D1 character-agnostic and routes Runner presentation through the canonical dispatcher', () => {
    const c5 = read('src/phase-c5-runtime.js');
    const d1 = read('src/phase-d1-runtime.js');
    const dispatcher = read('src/characters/character-runtime-presentation.js');
    const runner = read('src/characters/runner-production-presentation.js');

    expect(c5).toContain("installCharacterPresentationPhase(s,'c5')");
    expect(d1).toContain("installCharacterPresentationPhase(s,'d1')");
    expect(c5).not.toContain("characterId==='runner'");
    expect(c5).not.toContain("characterId==='shotgun'");
    expect(d1).not.toContain("characterId==='runner'");
    expect(d1).not.toContain("characterId==='shotgun'");
    expect(dispatcher).toContain('new CharacterSystem(scene, definition.id)');
    expect(dispatcher).toContain('system.select(definition.id)');
    expect(dispatcher).not.toContain("if (definition.id === 'shotgun')");

    expect(runner).toContain('character.installProductionVisuals()');
    expect(runner).toContain('this.characterSystem.updateLocomotionVisuals()');
    expect(runner).toContain('this.characterSystem.getWeaponSocket(q)');
    expect(runner).toContain('this.characterSystem.getMuzzleReach(q)');
    expect(runner).not.toContain("moving?'d1-hero-run':'d1-hero-idle'");
    expect(runner).not.toContain('const reach=q%2?70:76');
  });
});

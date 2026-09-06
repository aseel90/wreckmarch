import { describe, expect, it } from 'vitest';
import { SHOTGUN_CHARACTER } from '../../src/characters/definitions/shotgun.js';
import { getCharacterEntry, isCharacterSelectable } from '../../src/characters/character-registry.js';
import { evaluateShotgunProductionGate } from '../../src/characters/shotgun-production-gate.js';


describe('canonical Wrecker character definition', () => {
  it('owns the approved V1 character baseline without duplicating weapon balance', () => {
    expect(SHOTGUN_CHARACTER.id).toBe('shotgun');
    expect(SHOTGUN_CHARACTER.displayName).toBe('Wrecker');
    expect(SHOTGUN_CHARACTER.stats).toEqual({ maxHp: 110, moveSpeed: 255 });
    expect(SHOTGUN_CHARACTER.startingWeapon).toEqual({ id: 'shotgun' });
    expect(SHOTGUN_CHARACTER.passive).toEqual({ id: 'shotgun-baseline', enabled: false });

    expect(SHOTGUN_CHARACTER).not.toHaveProperty('damage');
    expect(SHOTGUN_CHARACTER).not.toHaveProperty('fireProfile');
    expect(SHOTGUN_CHARACTER.startingWeapon).not.toHaveProperty('damage');
  });

  it('registers the approved Wrecker definition as selectable', () => {
    const entry = getCharacterEntry('shotgun');
    expect(entry).toMatchObject({
      id: 'shotgun',
      availability: 'selectable',
      definition: SHOTGUN_CHARACTER
    });
    expect(isCharacterSelectable('shotgun')).toBe(true);
  });

  it('records approved full-run evidence and exposes no activation blockers', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.requirements.characterDefinition).toBe(true);
    expect(gate.requirements.fullRunValidation).toBe(true);
    expect(gate.readyForActivation).toBe(true);
    expect(gate.selectableNow).toBe(true);
    expect(gate.lockedPreviewSafety).toBe(false);
    expect(gate.blockers).toEqual([]);
  });
});

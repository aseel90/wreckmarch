import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SHOTGUN_FULL_RUN_VALIDATION,
  SHOTGUN_PRODUCTION_GATE_VERSION,
  evaluateShotgunProductionGate
} from '../../src/characters/shotgun-production-gate.js';
import { getCharacterEntry, isCharacterSelectable } from '../../src/characters/character-registry.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('canonical Shotgun production gate', () => {
  it('recognizes completed weapon/art/composition/compatibility foundations', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.version).toBe(SHOTGUN_PRODUCTION_GATE_VERSION);
    expect(gate.requirements).toMatchObject({
      canonicalWeapon: true,
      runtimePresentation: true,
      runtimeComposition: true,
      upgradeCompatibility: true
    });
  });

  it('keeps activation blocked only on unfinished gameplay production requirements', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.readyForActivation).toBe(false);
    expect(gate.blockers).toEqual([
      'characterDefinition',
      'c5Presentation',
      'd1Presentation',
      'fullRunValidation'
    ]);
    expect(gate.requirements).toMatchObject({
      characterDefinition: false,
      c5Presentation: false,
      d1Presentation: false,
      fullRunValidation: false
    });
    expect(SHOTGUN_FULL_RUN_VALIDATION).toEqual({ status: 'pending', evidence: null });
  });

  it('preserves the locked preview boundary until the production gate is complete', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.lockedPreviewSafety).toBe(true);
    expect(gate.selectableNow).toBe(false);
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(getCharacterEntry('shotgun')).toMatchObject({
      availability: 'locked',
      definition: null,
      lockReason: 'production-gate'
    });
  });

  it('does not duplicate Runner gameplay values or register a Shotgun phase hack', () => {
    const gateSource = read('src/characters/shotgun-production-gate.js');
    const dispatcherSource = read('src/characters/character-runtime-presentation.js');
    const d1Source = read('src/phase-d1-runtime.js');
    const c5Source = read('src/phase-c5-runtime.js');

    expect(gateSource).not.toContain('maxHp');
    expect(gateSource).not.toContain('moveSpeed');
    expect(gateSource).not.toContain('runner-production-presentation');
    expect(dispatcherSource).not.toContain("['shotgun'");
    expect(d1Source).not.toContain("=== 'shotgun'");
    expect(c5Source).not.toContain("=== 'shotgun'");
  });
});

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SHOTGUN_FULL_RUN_VALIDATION,
  SHOTGUN_PRODUCTION_GATE_VERSION,
  evaluateShotgunProductionGate
} from '../../src/characters/shotgun-production-gate.js';
import { getCharacterEntry, isCharacterSelectable } from '../../src/characters/character-registry.js';
import { SHOTGUN_CHARACTER } from '../../src/characters/definitions/shotgun.js';
import { resolveShotgunPresentationPose } from '../../src/characters/shotgun-production-presentation.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('canonical Shotgun production gate', () => {
  it('recognizes completed weapon/art/composition/compatibility/presenter foundations', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.version).toBe(SHOTGUN_PRODUCTION_GATE_VERSION);
    expect(gate.requirements).toMatchObject({
      canonicalWeapon: true,
      runtimePresentation: true,
      runtimeComposition: true,
      upgradeCompatibility: true,
      c5Presentation: true,
      d1Presentation: true
    });
  });

  it('records the approved real-run evidence and clears every activation blocker', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.readyForActivation).toBe(true);
    expect(gate.blockers).toEqual([]);
    expect(gate.requirements).toMatchObject({
      characterDefinition: true,
      fullRunValidation: true
    });
    expect(SHOTGUN_FULL_RUN_VALIDATION.status).toBe('approved');
    expect(SHOTGUN_FULL_RUN_VALIDATION.evidence).toContain('run_reports.id=57');
  });

  it('exposes Wrecker as canonically selectable after gate approval', () => {
    const gate = evaluateShotgunProductionGate();
    expect(gate.lockedPreviewSafety).toBe(false);
    expect(gate.selectableNow).toBe(true);
    expect(isCharacterSelectable('shotgun')).toBe(true);
    expect(getCharacterEntry('shotgun')).toMatchObject({
      availability: 'selectable',
      definition: SHOTGUN_CHARACTER
    });
  });

  it('derives right/left grip and muzzle placement from the Shotgun presentation contract', () => {
    const right = resolveShotgunPresentationPose(100, 80, 0);
    const left = resolveShotgunPresentationPose(100, 80, Math.PI);
    expect(right.facing).toBe('right');
    expect(left.facing).toBe('left');
    expect(right.grip.x).toBeGreaterThan(100);
    expect(left.grip.x).toBeLessThan(100);
    expect(right.muzzle.x).toBeGreaterThan(right.grip.x);
    expect(left.muzzle.x).toBeLessThan(left.grip.x);
    expect(Number.isFinite(right.muzzle.y)).toBe(true);
    expect(Number.isFinite(left.muzzle.y)).toBe(true);
  });

  it('does not duplicate Runner gameplay values or add a Shotgun phase hack', () => {
    const gateSource = read('src/characters/shotgun-production-gate.js');
    const presenterSource = read('src/characters/shotgun-production-presentation.js');
    const d1Source = read('src/phase-d1-runtime.js');
    const c5Source = read('src/phase-c5-runtime.js');

    expect(gateSource).not.toContain('maxHp');
    expect(gateSource).not.toContain('moveSpeed');
    expect(presenterSource).not.toContain('maxHp');
    expect(presenterSource).not.toContain('moveSpeed');
    expect(d1Source).not.toContain("=== 'shotgun'");
    expect(c5Source).not.toContain("=== 'shotgun'");
  });
});

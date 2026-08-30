import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

const BASE_MULTIPLIER = 1;
const LEVEL_PERCENT = .25;
const BASE_RADIUS = 135;

function expectedMultiplier(level: number) {
  return BASE_MULTIPLIER * ((1 + LEVEL_PERCENT) ** level);
}

function makeScene(): any {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255, pickupRadiusMultiplier: BASE_MULTIPLIER },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    magnetRadius: BASE_RADIUS,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  };
}

describe('Upgrade System 2.0 Scrap Magnet migration', () => {
  it('publishes Scrap Magnet as a canonical character pickup-radius stat', () => {
    const definition = getUpgradeDefinition('scrap-magnet');
    if (!definition) throw new Error('Scrap Magnet definition is missing');

    expect(definition.name).toBe('SCRAP MAGNET');
    expect(definition.description).toBe('Increase Scrap pickup radius by 25%.');
    expect(definition.maxLevel).toBe(4);
    expect(definition.weight).toBe(1);
    expect(definition.scope).toBe('CHARACTER');
    expect(definition.modifiers).toHaveLength(1);
    expect(definition.modifiers[0]).toMatchObject({
      domain: 'character',
      stat: 'pickupRadiusMultiplier',
      type: 'MULTIPLICATIVE_PERCENT',
      value: LEVEL_PERCENT
    });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('resolves +25% multiplicatively at every level without mutating the 135px base radius', () => {
    const definition = getUpgradeDefinition('scrap-magnet');
    if (!definition) throw new Error('Scrap Magnet definition is missing');
    const scene = makeScene();

    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      expect(resolved.character.pickupRadiusMultiplier).toBeCloseTo(expectedMultiplier(level));
      expect(scene.runCombatStats.pickupRadiusMultiplier).toBeCloseTo(expectedMultiplier(level));
      expect(scene.magnetRadius).toBe(BASE_RADIUS);
    }

    expect(scene.runStatState.state.base.character.pickupRadiusMultiplier).toBe(BASE_MULTIPLIER);
    expect(scene.runStatState.state.modifiers.character.pickupRadiusMultiplier).toHaveLength(definition.maxLevel);
    expect(BASE_RADIUS * scene.runCombatStats.pickupRadiusMultiplier).toBeCloseTo(BASE_RADIUS * expectedMultiplier(4));
  });

  it('keeps Phase C as the base-radius owner and consumes the resolved multiplier at pickup time', () => {
    const phaseC = fs.readFileSync(new URL('../../src/phase-c-runtime.js', import.meta.url), 'utf8');
    const phaseC1 = fs.readFileSync(new URL('../../src/phase-c1-runtime.js', import.meta.url), 'utf8');

    expect(phaseC).toContain('scene.magnetRadius = 135;');
    expect(phaseC).toContain('const pickupRadiusMultiplier = Number(this.runCombatStats?.pickupRadiusMultiplier) || 1;');
    expect(phaseC).toContain('const magnetRadius = this.magnetRadius * pickupRadiusMultiplier;');
    expect(phaseC).not.toContain('scene.magnetRadius *= 1.25');
    expect(phaseC1).not.toContain('scene.magnetRadius*=1.25');
  });

  it('rejects accidental duplicate level application', () => {
    const definition = getUpgradeDefinition('scrap-magnet');
    if (!definition) throw new Error('Scrap Magnet definition is missing');
    const scene = makeScene();

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(() => applyUpgradeStatModifiers(scene, definition, 1)).toThrow(/already applied/);
    expect(scene.runStatState.state.modifiers.character.pickupRadiusMultiplier).toHaveLength(1);
  });
});

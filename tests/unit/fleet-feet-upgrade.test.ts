import { describe, expect, it } from 'vitest';
import { RUN_BALANCE, getPlayerMoveSpeed } from '../../src/balance/run-balance.js';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene(moveSpeed: number = RUN_BALANCE.player.baseMoveSpeed) {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    heroSpeed: moveSpeed,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  };
}

describe('Upgrade System 2.0 Fleet Feet migration', () => {
  it('publishes Fleet Feet from the canonical player balance contract', () => {
    const definition = getUpgradeDefinition('fleet-feet');
    if (!definition) throw new Error('Fleet Feet definition is missing');

    expect(definition.name).toBe('FLEET FEET');
    expect(definition.description).toBe('+3% movement speed.');
    expect(definition.maxLevel).toBe(RUN_BALANCE.player.fleetFeetMaxLevel);
    expect(definition.weight).toBe(1.05);
    expect(definition.scope).toBe('CHARACTER');
    expect(definition.modifiers).toHaveLength(1);
    expect(definition.modifiers[0]).toMatchObject({
      domain: 'character',
      stat: 'moveSpeed',
      value: RUN_BALANCE.player.fleetFeetPercent,
      max: RUN_BALANCE.player.moveSpeedHardCap
    });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('matches getPlayerMoveSpeed at every supported level without mutating base speed', () => {
    const definition = getUpgradeDefinition('fleet-feet');
    if (!definition) throw new Error('Fleet Feet definition is missing');
    const scene = makeScene();

    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      expect(resolved.character.moveSpeed).toBeCloseTo(getPlayerMoveSpeed(RUN_BALANCE.player.baseMoveSpeed, level));
      expect(scene.heroSpeed).toBeCloseTo(resolved.character.moveSpeed);
    }

    expect(scene.runStatState.state.base.character.moveSpeed).toBe(RUN_BALANCE.player.baseMoveSpeed);
    expect(scene.runStatState.state.modifiers.character.moveSpeed).toHaveLength(definition.maxLevel);
    expect(scene.runStatState.state.caps.character.moveSpeed).toEqual({ max: RUN_BALANCE.player.moveSpeedHardCap });
  });

  it('enforces the canonical hard cap through RunStatState', () => {
    const definition = getUpgradeDefinition('fleet-feet');
    if (!definition) throw new Error('Fleet Feet definition is missing');
    const scene = makeScene(279);

    const resolved = applyUpgradeStatModifiers(scene, definition, 1);
    expect(resolved.character.moveSpeed).toBe(RUN_BALANCE.player.moveSpeedHardCap);
    expect(scene.heroSpeed).toBe(RUN_BALANCE.player.moveSpeedHardCap);
  });

  it('rejects accidental duplicate level application', () => {
    const definition = getUpgradeDefinition('fleet-feet');
    if (!definition) throw new Error('Fleet Feet definition is missing');
    const scene = makeScene();

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(() => applyUpgradeStatModifiers(scene, definition, 1)).toThrow(/already applied/);
    expect(scene.runStatState.state.modifiers.character.moveSpeed).toHaveLength(1);
  });
});

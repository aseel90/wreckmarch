import { describe, expect, it } from 'vitest';
import { WeaponSystem } from '../../src/combat/weapon-system.js';
import {
  WS22_INTERACTION_CASES,
  runWs22InteractionMatrix
} from '../../src/balance/ws22-interaction-matrix.js';

describe('WS22 deterministic interaction matrix', () => {
  it('locks the approved high-risk chained mechanic cases', () => {
    expect(WS22_INTERACTION_CASES.map(entry => entry.id)).toEqual([
      'TRIPLE_PIERCE',
      'TRIPLE_SHRAPNEL',
      'PIERCE_RICOCHET',
      'SHRAPNEL_RICOCHET_PIERCE',
      'TRIPLE_EXPLOSIVE',
      'EXPLOSIVE_PIERCE_RICOCHET',
      'MAX_CHAINED_PROJECTILE_BUILD'
    ]);
  });

  it('keeps every chained secondary package inside the canonical 1.0 added-damage budget', () => {
    const results = runWs22InteractionMatrix();
    expect(results).toHaveLength(7);
    for (const result of results) {
      expect(result.invariants.combinedSecondaryBudgetBounded).toBe(true);
      expect(result.invariants.countsBounded).toBe(true);
      expect(result.secondaryBudget.combinedAddedDamage).toBeLessThanOrEqual(1.000000001);
    }
  });

  it('locks Triple Riveter to three symmetric shots sharing the 1.60x volley budget', () => {
    const scene: any = {
      upgradeMechanicalState: {
        'triple-riveter': {
          projectileCount: 3,
          projectileDamageScale: 1.6 / 3
        }
      },
      primaryWeapon: {}
    };
    const weapon = new WeaponSystem(scene, { projectileSystem: {} as any });
    const profile = weapon.heroVolleyProfile();
    expect(profile.projectileCount).toBe(3);
    expect(profile.volleyDamageMultiplier).toBeCloseTo(1.6, 10);
    expect(profile.spreads[1]).toBe(0);
    expect(profile.spreads[0]).toBeCloseTo(-profile.spreads[2], 10);
  });

  it('locks Explosive Rivet to at most one projectile owner per multi-shot volley', () => {
    for (const result of runWs22InteractionMatrix().filter(entry => entry.secondaryBudget.explosionLevel > 0)) {
      expect(result.invariants.explosiveVolleySingleOwner).toBe(true);
      expect(result.explosiveProjectilesPerVolley).toBe(1);
    }
  });

  it('scales the fully chained package instead of allowing additive mechanics to exceed the shared budget', () => {
    const max = runWs22InteractionMatrix().find(entry => entry.id === 'MAX_CHAINED_PROJECTILE_BUILD');
    expect(max).toBeTruthy();
    expect(max!.secondaryBudget.requestedCombinedAddedDamage).toBeGreaterThan(1);
    expect(max!.secondaryBudget.combinedScale).toBeLessThan(1);
    expect(max!.secondaryBudget.combinedAddedDamage).toBeCloseTo(1, 10);
    expect(max!.secondaryBudget.pierceCount).toBe(3);
    expect(max!.secondaryBudget.ricochetCount).toBe(2);
    expect(max!.secondaryBudget.shrapnelCount).toBe(4);
    expect(max!.secondaryBudget.explosionLevel).toBe(3);
  });
});

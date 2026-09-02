import { describe, expect, it } from 'vitest';
import { classifyWs20ProductionReport, WS20_ARCHETYPES } from '../../src/balance/ws20-production-classifier.js';

function report(overrides: any = {}) {
  return {
    reportId: 'fixture',
    run: { finalWave: 8 },
    combat: {
      damageDealt: 1000,
      healingReceived: 0,
      shieldDamagePrevented: 0,
      damageByProjectilePath: { primary: 1000, pierce: 0, ricochet: 0, shrapnel: 0, explosion: 0, support: 0 }
    },
    upgrades: {
      finalLevels: {},
      resolvedStats: {
        character: { maxHp: 100, moveSpeed: 255, critChance: 0, critDamageMultiplier: 1.5 },
        weapon: { damage: 24, fireDelay: 390 }
      }
    },
    ...overrides,
    combat: { ...{
      damageDealt: 1000,
      healingReceived: 0,
      shieldDamagePrevented: 0,
      damageByProjectilePath: { primary: 1000, pierce: 0, ricochet: 0, shrapnel: 0, explosion: 0, support: 0 }
    }, ...(overrides.combat || {}) },
    upgrades: {
      finalLevels: { ...(overrides.upgrades?.finalLevels || {}) },
      resolvedStats: {
        character: { maxHp: 100, moveSpeed: 255, critChance: 0, critDamageMultiplier: 1.5, ...(overrides.upgrades?.resolvedStats?.character || {}) },
        weapon: { damage: 24, fireDelay: 390, ...(overrides.upgrades?.resolvedStats?.weapon || {}) }
      }
    }
  };
}

describe('WS20 Production run classifier', () => {
  it('accepts a clean scalar/precision Wave-8 run only when direct concentration stays bounded', () => {
    const result = classifyWs20ProductionReport(report({
      upgrades: {
        finalLevels: { 'heavy-rivets': 4, overclock: 4, 'critical-rivet': 4, 'twin-riveter': 2 },
        resolvedStats: {
          character: { critChance: 0.20 },
          weapon: { damage: 43.2, fireDelay: 263.728 }
        }
      }
    }));

    expect(result.accepted).toBe(true);
    expect(result.acceptedArchetype).toBe(WS20_ARCHETYPES.SCALAR_PRECISION);
    expect(result.concentration.maxEntry?.share).toBeLessThanOrEqual(0.35);
  });

  it('accepts RUN-0039-like crowd evidence and preserves the narrow real Overclock margin below 35%', () => {
    const result = classifyWs20ProductionReport(report({
      reportId: 'wm-9518c391-90ae-4c70-ba18-d58fa99e4f0e',
      combat: {
        damageDealt: 52333.754,
        healingReceived: 32.5,
        damageByProjectilePath: {
          primary: 41363.676,
          pierce: 6177.998,
          ricochet: 0,
          shrapnel: 4411.877,
          explosion: 421.853,
          support: 0
        }
      },
      upgrades: {
        finalLevels: {
          overclock: 4,
          'twin-riveter': 2,
          'piercing-rivets': 1,
          'critical-rivet': 2,
          'explosive-rivet': 1,
          'shrapnel-impact': 2,
          'field-repair': 1,
          'heavy-rivets': 1
        },
        resolvedStats: {
          character: { maxHp: 100, moveSpeed: 255, critChance: 0.115 },
          weapon: { damage: 26.88, fireDelay: 254.23728813559322 }
        }
      }
    }));

    expect(result.accepted).toBe(true);
    expect(result.acceptedArchetype).toBe(WS20_ARCHETYPES.CROWD_CHAIN);
    expect(result.pathShares.secondary).toBeGreaterThan(0.20);
    expect(result.concentration.entries.find((entry: any) => entry.id === 'overclock')?.share).toBeCloseTo(0.348109, 5);
  });

  it('rejects historical strong-scalar RUN-0013-like evidence when Overclock concentration exceeds PB1', () => {
    const result = classifyWs20ProductionReport(report({
      combat: { damageDealt: 65796.537, damageByProjectilePath: undefined },
      upgrades: {
        finalLevels: { 'twin-riveter': 2, 'heavy-rivets': 4, overclock: 5, ricochet: 2, 'critical-rivet': 1, 'piercing-rivets': 1, 'shrapnel-impact': 1 },
        resolvedStats: { character: { critChance: 0.05 }, weapon: { damage: 49.7664, fireDelay: 193.35808487423998 } }
      }
    }));

    expect(result.accepted).toBe(false);
    expect(result.concentration.passes).toBe(false);
    expect(result.rejectionReasons).toContain('DIRECT_POWER_CONCENTRATION_ABOVE_35_PERCENT');
    expect(result.rejectionReasons).toContain('PATH_TELEMETRY_UNAVAILABLE_FOR_OFFENSIVE_IDENTITY');
  });

  it('rejects RUN-0021-like hybrid support/crowd evidence when rarity-driven Overclock concentration exceeds 35%', () => {
    const result = classifyWs20ProductionReport(report({
      combat: {
        damageDealt: 57456.307,
        damageByProjectilePath: { primary: 41299.614, pierce: 7984.28, ricochet: 2451.628, shrapnel: 694.437, explosion: 0, support: 5071.048 }
      },
      upgrades: {
        finalLevels: { 'piercing-rivets': 2, 'twin-riveter': 1, 'call-rig': 1, overclock: 4, 'critical-rivet': 2, 'heavy-rivets': 2, ricochet: 1, 'armor-plate': 1, 'shrapnel-impact': 1 },
        resolvedStats: { character: { maxHp: 115, critChance: 0.115 }, weapon: { damage: 30.192, fireDelay: 247.46192893401013 } }
      }
    }));

    expect(result.accepted).toBe(false);
    expect(result.matches).toContain(WS20_ARCHETYPES.CROWD_CHAIN);
    expect(result.matches).toContain(WS20_ARCHETYPES.SURVIVAL_SUPPORT);
    expect(result.concentration.passes).toBe(false);
  });

  it('rejects RUN-0026-like Wave-10 hybrid evidence rather than double-counting one run toward two archetypes', () => {
    const result = classifyWs20ProductionReport(report({
      run: { finalWave: 10 },
      combat: {
        damageDealt: 84471.753,
        healingReceived: 47.5,
        shieldDamagePrevented: 11,
        damageByProjectilePath: { primary: 61124.546, pierce: 10165.384, ricochet: 4869.526, shrapnel: 8538.957, explosion: 0, support: 0 }
      },
      upgrades: {
        finalLevels: { 'shrapnel-impact': 1, 'twin-riveter': 2, 'piercing-rivets': 2, overclock: 5, ricochet: 1, 'critical-rivet': 3, 'heavy-rivets': 2, 'field-repair': 1, 'armor-plate': 1, 'impact-shield': 1 },
        resolvedStats: { character: { maxHp: 122.5, critChance: 0.1575 }, weapon: { damage: 30.624, fireDelay: 217.63392857142856 } }
      }
    }));

    expect(result.waveEligible).toBe(true);
    expect(result.matches).toContain(WS20_ARCHETYPES.CROWD_CHAIN);
    expect(result.matches).toContain(WS20_ARCHETYPES.SURVIVAL_SUPPORT);
    expect(result.uniqueIdentity).toBe(false);
    expect(result.accepted).toBe(false);
    expect(result.rejectionReasons).toContain('AMBIGUOUS_HYBRID_IDENTITY');
    expect(result.rejectionReasons).toContain('DIRECT_POWER_CONCENTRATION_ABOVE_35_PERCENT');
  });

  it('accepts a survival/support run only with multiple survival cards and multiple observed survival/support signals', () => {
    const result = classifyWs20ProductionReport(report({
      combat: {
        damageDealt: 30000,
        healingReceived: 60,
        shieldDamagePrevented: 40,
        damageByProjectilePath: { primary: 27000, pierce: 0, ricochet: 0, shrapnel: 0, explosion: 0, support: 3000 }
      },
      upgrades: {
        finalLevels: { 'heavy-rivets': 4, 'fleet-feet': 3, 'armor-plate': 4, 'field-repair': 3, 'impact-shield': 2, 'call-rig': 1 },
        resolvedStats: { character: { maxHp: 160, moveSpeed: 278 }, weapon: { damage: 43.2, fireDelay: 390 } }
      }
    }));

    expect(result.accepted).toBe(true);
    expect(result.acceptedArchetype).toBe(WS20_ARCHETYPES.SURVIVAL_SUPPORT);
    expect(result.survivalSignalCount).toBeGreaterThanOrEqual(4);
  });
});

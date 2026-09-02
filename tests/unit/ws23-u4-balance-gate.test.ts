import { describe, expect, it } from 'vitest';
import {
  WS23_REQUIRED_GATES,
  evaluateWs23U4BalanceGate
} from '../../src/balance/ws23-u4-balance-gate.js';

describe('WS23 U4 balance reintegration gate', () => {
  it('requires every canonical closeout gate', () => {
    expect(WS23_REQUIRED_GATES).toEqual([
      'productionEvidence',
      'buildDiversity',
      'interactionMatrix',
      'mobilePerformance',
      'repositoryValidation'
    ]);
  });

  it('passes only when all evidence gates are satisfied', () => {
    const result = evaluateWs23U4BalanceGate({
      productionEvidence: true,
      buildDiversity: true,
      interactionMatrix: true,
      mobilePerformance: true,
      repositoryValidation: true
    });

    expect(result.readyForReintegration).toBe(true);
    expect(result.failed).toEqual([]);
    expect(result.decision).toBe('u4_balance_gate_passed');
    expect(result.protectedGameplayChange).toBe(true);
  });

  it('holds reintegration when any required gate is missing', () => {
    const result = evaluateWs23U4BalanceGate({
      productionEvidence: true,
      buildDiversity: true,
      interactionMatrix: false,
      mobilePerformance: true,
      repositoryValidation: true
    });

    expect(result.readyForReintegration).toBe(false);
    expect(result.failed).toEqual(['interactionMatrix']);
    expect(result.decision).toBe('hold_reintegration_until_all_gates_pass');
  });

  it('treats unspecified evidence as failed instead of assuming success', () => {
    const result = evaluateWs23U4BalanceGate({});
    expect(result.readyForReintegration).toBe(false);
    expect(result.failed).toEqual(WS23_REQUIRED_GATES);
  });
});

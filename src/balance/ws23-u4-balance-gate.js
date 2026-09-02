/* WRECKMARCH — WS23 final U4 balance reintegration gate */

export const WS23_REQUIRED_GATES = Object.freeze([
  'productionEvidence',
  'buildDiversity',
  'interactionMatrix',
  'mobilePerformance',
  'repositoryValidation'
]);

export function evaluateWs23U4BalanceGate(evidence = {}) {
  const gates = Object.freeze({
    productionEvidence: evidence.productionEvidence === true,
    buildDiversity: evidence.buildDiversity === true,
    interactionMatrix: evidence.interactionMatrix === true,
    mobilePerformance: evidence.mobilePerformance === true,
    repositoryValidation: evidence.repositoryValidation === true
  });
  const failed = Object.freeze(
    WS23_REQUIRED_GATES.filter(key => gates[key] !== true)
  );

  return Object.freeze({
    gates,
    failed,
    readyForReintegration: failed.length === 0,
    protectedGameplayChange: true,
    decision: failed.length === 0
      ? 'u4_balance_gate_passed'
      : 'hold_reintegration_until_all_gates_pass'
  });
}

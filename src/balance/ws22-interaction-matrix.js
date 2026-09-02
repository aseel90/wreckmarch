/* WRECKMARCH — WS22 deterministic combat interaction regression matrix */
import { resolveProjectileSecondaryDamageBudget } from '../combat/projectile-system.js';

export const WS22_INTERACTION_CASES = Object.freeze([
  Object.freeze({ id: 'TRIPLE_PIERCE', projectileCount: 3, pierceCount: 3, ricochetCount: 0, shrapnelCount: 0, explosionLevel: 0 }),
  Object.freeze({ id: 'TRIPLE_SHRAPNEL', projectileCount: 3, pierceCount: 0, ricochetCount: 0, shrapnelCount: 4, explosionLevel: 0 }),
  Object.freeze({ id: 'PIERCE_RICOCHET', projectileCount: 1, pierceCount: 3, ricochetCount: 2, shrapnelCount: 0, explosionLevel: 0 }),
  Object.freeze({ id: 'SHRAPNEL_RICOCHET_PIERCE', projectileCount: 1, pierceCount: 3, ricochetCount: 2, shrapnelCount: 4, explosionLevel: 0 }),
  Object.freeze({ id: 'TRIPLE_EXPLOSIVE', projectileCount: 3, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0, explosionLevel: 3, explosiveProjectilesPerVolley: 1 }),
  Object.freeze({ id: 'EXPLOSIVE_PIERCE_RICOCHET', projectileCount: 1, pierceCount: 3, ricochetCount: 2, shrapnelCount: 0, explosionLevel: 3, explosiveProjectilesPerVolley: 1 }),
  Object.freeze({ id: 'MAX_CHAINED_PROJECTILE_BUILD', projectileCount: 3, pierceCount: 3, ricochetCount: 2, shrapnelCount: 4, explosionLevel: 3, explosiveProjectilesPerVolley: 1 })
]);

export function evaluateWs22InteractionCase(definition) {
  const secondaryBudget = resolveProjectileSecondaryDamageBudget(definition);
  const projectileCount = Math.max(1, Math.floor(Number(definition?.projectileCount) || 1));
  const explosiveProjectilesPerVolley = Math.min(
    projectileCount,
    Math.max(0, Math.floor(Number(definition?.explosiveProjectilesPerVolley) || 0))
  );
  return Object.freeze({
    id: definition.id,
    projectileCount,
    explosiveProjectilesPerVolley,
    secondaryBudget,
    invariants: Object.freeze({
      combinedSecondaryBudgetBounded: secondaryBudget.combinedAddedDamage <= 1.000000001,
      countsBounded:
        secondaryBudget.pierceCount <= 3 &&
        secondaryBudget.ricochetCount <= 2 &&
        secondaryBudget.shrapnelCount <= 4 &&
        secondaryBudget.explosionLevel <= 3,
      explosiveVolleySingleOwner: explosiveProjectilesPerVolley <= 1
    })
  });
}

export function runWs22InteractionMatrix() {
  return Object.freeze(WS22_INTERACTION_CASES.map(evaluateWs22InteractionCase));
}

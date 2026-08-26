/* WRECKMARCH — enemy behavior registry */
import { updateChaseBehavior } from './behaviors/chase.js';

const ENEMY_BEHAVIORS = new Map([
  ['chase', updateChaseBehavior]
]);

export function getEnemyBehavior(behaviorKey) {
  const behavior = ENEMY_BEHAVIORS.get(behaviorKey);
  if (!behavior) throw new Error(`Unknown enemy behavior: ${behaviorKey}`);
  return behavior;
}

export function listEnemyBehaviorKeys() {
  return Array.from(ENEMY_BEHAVIORS.keys());
}

/* WRECKMARCH — enemy behavior registry */
import { updateChaseBehavior } from './behaviors/chase.js';
import { updateHoundPounceBehavior } from './behaviors/hound-pounce.js?v=3';
import { updateAcidSpitterBehavior } from './behaviors/acid-spitter.js?v=1';

const ENEMY_BEHAVIORS = new Map([
  ['chase', updateChaseBehavior],
  ['hound-pounce', updateHoundPounceBehavior],
  ['acid-spitter', updateAcidSpitterBehavior]
]);

export function getEnemyBehavior(behaviorKey) {
  const behavior = ENEMY_BEHAVIORS.get(behaviorKey);
  if (!behavior) throw new Error(`Unknown enemy behavior: ${behaviorKey}`);
  return behavior;
}

export function listEnemyBehaviorKeys() {
  return Array.from(ENEMY_BEHAVIORS.keys());
}

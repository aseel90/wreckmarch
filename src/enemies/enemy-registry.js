/* WRECKMARCH — stable enemy content registry */
import { SCRAP_RAT_DEFINITION } from './definitions/scrap-rat.js';
import { RUST_HOUND_DEFINITION } from './definitions/rust-hound.js?v=2';
import { SAWBUG_DEFINITION } from './definitions/sawbug.js?v=2';

const ENEMY_DEFINITIONS = new Map([
  [SCRAP_RAT_DEFINITION.id, SCRAP_RAT_DEFINITION],
  [RUST_HOUND_DEFINITION.id, RUST_HOUND_DEFINITION],
  [SAWBUG_DEFINITION.id, SAWBUG_DEFINITION]
]);

export function getEnemyDefinition(enemyId) {
  const definition = ENEMY_DEFINITIONS.get(enemyId);
  if (!definition) throw new Error(`Unknown enemy definition: ${enemyId}`);
  return definition;
}

export function listEnemyDefinitions() {
  return Array.from(ENEMY_DEFINITIONS.values());
}

/* WRECKMARCH — stable enemy content registry */
import { SCRAP_RAT_DEFINITION } from './definitions/scrap-rat.js';

const ENEMY_DEFINITIONS = new Map([
  [SCRAP_RAT_DEFINITION.id, SCRAP_RAT_DEFINITION]
]);

export function getEnemyDefinition(enemyId) {
  const definition = ENEMY_DEFINITIONS.get(enemyId);
  if (!definition) throw new Error(`Unknown enemy definition: ${enemyId}`);
  return definition;
}

export function listEnemyDefinitions() {
  return Array.from(ENEMY_DEFINITIONS.values());
}

/* WRECKMARCH F0 — data-driven playable character registry */
import { RUNNER_CHARACTER } from './definitions/runner.js';

const DEFINITIONS = new Map([[RUNNER_CHARACTER.id, RUNNER_CHARACTER]]);

export function getCharacterDefinition(characterId = 'runner') {
  const definition = DEFINITIONS.get(characterId);
  if (!definition) throw Error(`Unknown character: ${characterId}`);
  return definition;
}

export function listCharacterDefinitions() {
  return [...DEFINITIONS.values()];
}

export function hasCharacterDefinition(characterId) {
  return DEFINITIONS.has(characterId);
}

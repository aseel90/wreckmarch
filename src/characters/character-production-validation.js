/* WRECKMARCH WS14-E — temporary production validation boundary for locked characters.
 * This does not change CharacterRegistry availability. It only permits an explicit
 * autotest URL to exercise a production-gated definition before final activation.
 * Remove this boundary when Shotgun full-run validation is approved.
 */
import { getCharacterEntry } from './character-registry.js?v=5';

const VALIDATION_PARAM = 'characterValidation';
const REQUIRED_AUTOTEST_VALUE = '1';

function readSearch(search) {
  if (typeof search === 'string') return search;
  return globalThis.location?.search || '';
}

function validateEntry(characterId) {
  const entry = getCharacterEntry(characterId);
  if (entry.availability !== 'locked') {
    throw Error(`Production validation requires a locked character: ${characterId}`);
  }
  if (entry.lockReason !== 'production-gate') {
    throw Error(`Production validation requires production-gate lock: ${characterId}`);
  }
  if (!entry.definition) {
    throw Error(`Production validation requires a canonical definition: ${characterId}`);
  }
  return entry;
}

export function resolveCharacterProductionValidationRequest(search) {
  const params = new URLSearchParams(readSearch(search));
  const characterId = params.get(VALIDATION_PARAM);
  if (!characterId) return null;
  if (params.get('autotest') !== REQUIRED_AUTOTEST_VALUE) {
    throw Error('Character production validation requires autotest=1');
  }
  const entry = validateEntry(characterId);
  return Object.freeze({
    characterId,
    entry,
    definition: entry.definition,
    mode: 'production-validation'
  });
}

export function activateCharacterProductionValidation(request) {
  if (!request?.characterId || request.mode !== 'production-validation') {
    throw Error('Invalid character production validation request');
  }
  const entry = validateEntry(request.characterId);
  const marker = Object.freeze({
    characterId: entry.id,
    mode: 'production-validation'
  });
  globalThis.__WM_CHARACTER_PRODUCTION_VALIDATION__ = marker;
  return marker;
}

export function isCharacterProductionValidationActive(characterId) {
  const marker = globalThis.__WM_CHARACTER_PRODUCTION_VALIDATION__;
  return Boolean(
    marker
    && marker.mode === 'production-validation'
    && marker.characterId === characterId
  );
}

export function getCharacterProductionValidationDefinition(characterId) {
  if (!isCharacterProductionValidationActive(characterId)) {
    throw Error(`Character production validation is not active: ${characterId}`);
  }
  return validateEntry(characterId).definition;
}

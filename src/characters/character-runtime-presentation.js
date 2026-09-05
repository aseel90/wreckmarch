/* WRECKMARCH — canonical runtime presentation dispatcher.
 * Character identity/access comes from CharacterRegistry. Phase layers call this
 * boundary and never select a concrete character or signature weapon themselves.
 */
import { getCharacterDefinition } from './character-registry.js?v=5';
import { CharacterSystem } from './character-system.js?v=11';
import {
  getCharacterProductionValidationDefinition,
  isCharacterProductionValidationActive
} from './character-production-validation.js?v=1';
import { installRunnerC5Presentation, installRunnerD1Presentation } from './runner-production-presentation.js?v=1';
import { installShotgunC5Presentation, installShotgunD1Presentation } from './shotgun-production-presentation.js?v=3&wrecker=4';

const PRESENTATION_PHASES = Object.freeze({
  c5: 'c5',
  d1: 'd1'
});

const PRESENTERS = new Map([
  ['runner', Object.freeze({
    c5: installRunnerC5Presentation,
    d1: installRunnerD1Presentation
  })],
  ['shotgun', Object.freeze({
    c5: installShotgunC5Presentation,
    d1: installShotgunD1Presentation
  })]
]);

function requirePhase(phase) {
  const normalized = String(phase || '').toLowerCase();
  if (!Object.values(PRESENTATION_PHASES).includes(normalized)) {
    throw Error(`Unsupported character presentation phase: ${phase}`);
  }
  return normalized;
}

function resolveDefinition(scene) {
  if (isCharacterProductionValidationActive('shotgun')) {
    const validation = getCharacterProductionValidationDefinition('shotgun');
    if (validation) return validation;
  }
  return scene?.characterDefinition || getCharacterDefinition(scene?.characterId || 'runner');
}

function ensureCharacterSystem(scene, definition) {
  if (scene?.characterSystem?.characterId === definition.id) return scene.characterSystem;
  scene.characterSystem = new CharacterSystem(scene, definition);
  return scene.characterSystem;
}

export async function installCharacterPresentationPhase(scene, phase) {
  const normalizedPhase = requirePhase(phase);
  const definition = resolveDefinition(scene);
  if (!definition?.id) throw Error('Character presentation requires a canonical definition');
  const presenter = PRESENTERS.get(definition.id)?.[normalizedPhase];
  if (!presenter) throw Error(`No ${normalizedPhase} presentation registered for character: ${definition.id}`);

  scene.characterId = definition.id;
  scene.characterDefinition = definition;
  const system = ensureCharacterSystem(scene, definition);
  if (normalizedPhase === 'd1' && !scene.__characterSystemReady) system.installProductionVisuals();
  const result = await presenter(scene, definition);
  const checks = Object.freeze({ ...(result?.checks || {}) });
  const ok = Object.values(checks).every(Boolean);
  const payload = Object.freeze({
    phase: normalizedPhase,
    characterId: definition.id,
    checks,
    ok
  });
  if (normalizedPhase === 'c5') scene.__characterPresentationC5 = payload;
  if (normalizedPhase === 'd1') scene.__characterPresentationD1 = payload;
  return payload;
}

export function listRegisteredCharacterPresentations() {
  return Object.freeze([...PRESENTERS.keys()]);
}

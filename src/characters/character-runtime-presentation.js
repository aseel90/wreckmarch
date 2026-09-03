/* WRECKMARCH — canonical runtime presentation dispatcher.
 * Character identity/access comes from CharacterRegistry. Phase layers call this
 * boundary and never select a concrete character or signature weapon themselves.
 */
import { getCharacterDefinition } from './character-registry.js?v=5';
import { CharacterSystem } from './character-system.js?v=10';
import { installRunnerC5Presentation, installRunnerD1Presentation } from './runner-production-presentation.js?v=1';

const PRESENTATION_PHASES = Object.freeze({
  c5: 'c5',
  d1: 'd1'
});

const PRESENTERS = new Map([
  ['runner', Object.freeze({
    c5: installRunnerC5Presentation,
    d1: installRunnerD1Presentation
  })]
]);

function resolveBoundDefinition(scene) {
  const characterId = scene?.characterDefinition?.id || scene?.characterId;
  if (!characterId) throw Error('Gameplay scene has no bound character id');
  const definition = getCharacterDefinition(characterId);
  if (scene.characterDefinition?.id && scene.characterDefinition.id !== definition.id) {
    throw Error(`Character definition mismatch: ${scene.characterDefinition.id} != ${definition.id}`);
  }
  scene.characterId = definition.id;
  scene.characterDefinition = definition;
  return definition;
}

function ensureCharacterSystem(scene, definition) {
  const system = scene.characterSystem || new CharacterSystem(scene, definition.id);
  if (system.characterId !== definition.id) system.select(definition.id);
  scene.characterSystem = system;
  return system;
}

export function hasCharacterRuntimePresentation(characterId, phase) {
  return Boolean(PRESENTERS.get(characterId)?.[phase]);
}

export async function installCharacterPresentationPhase(scene, phase) {
  if (!Object.prototype.hasOwnProperty.call(PRESENTATION_PHASES, phase)) {
    throw Error(`Unknown character presentation phase: ${phase}`);
  }
  const definition = resolveBoundDefinition(scene);
  const presenter = PRESENTERS.get(definition.id);
  const install = presenter?.[phase];
  if (!install) throw Error(`No ${phase} production presentation registered for character: ${definition.id}`);
  if (phase === PRESENTATION_PHASES.d1) ensureCharacterSystem(scene, definition);
  const result = await install(scene, definition);
  const checks = Object.freeze({ ...(result?.checks || {}) });
  const marker = Object.freeze({
    characterId: definition.id,
    phase,
    ok: Object.keys(checks).length > 0 && Object.values(checks).every(Boolean),
    checks
  });
  if (phase === PRESENTATION_PHASES.c5) scene.__characterPresentationC5 = marker;
  if (phase === PRESENTATION_PHASES.d1) scene.__characterPresentationD1 = marker;
  return marker;
}

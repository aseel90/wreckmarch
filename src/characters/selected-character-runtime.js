import { getCharacterDefinition } from './character-registry.js?v=5';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function applySelectedCharacterToGame(game, characterId, timeoutMs = 5000) {
  const definition = getCharacterDefinition(characterId);
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene) {
      scene.characterId = definition.id;
      globalThis.__WM_LOG__?.(`Selected character bound to gameplay scene: ${definition.id}`);
      return definition;
    }
    await wait(16);
  }

  throw new Error(`Selected character scene binding timed out: ${definition.id}`);
}

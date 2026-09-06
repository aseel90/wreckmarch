import { resolveCharacterAccess } from './character-access.js?v=1&wreckerActivation=1';
import { getCharacterDefinition } from './character-registry.js?v=5&wreckerActivation=1';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function applySelectedCharacterToGame(game, characterId, timeoutMs = 5000, playerProfile) {
  const access = resolveCharacterAccess(characterId, playerProfile);
  if (!access.selectable) {
    throw new Error(`Character is not selectable: ${characterId} (${access.lockReason})`);
  }
  const definition = getCharacterDefinition(characterId);
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene) {
      scene.characterId = definition.id;
      scene.characterDefinition = definition;
      globalThis.__WM_LOG__?.(`Selected character bound to gameplay scene: ${definition.id}`);
      return definition;
    }
    await wait(16);
  }

  throw new Error(`Selected character scene binding timed out: ${definition.id}`);
}

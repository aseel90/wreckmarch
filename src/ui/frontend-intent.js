import { SCREEN_IDS } from './screen-registry.js?v=2';

export const FRONTEND_INTENT_KEY = 'wreckmarch.frontend.intent.v1';
export const RUN_RESTART_INTENT_KEY = 'wreckmarch.frontend.restart-character.v1';
const ALLOWED_BOOT_TARGETS = new Set([SCREEN_IDS.MAIN, SCREEN_IDS.CHARACTER_SELECT]);

function getSessionStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

export function requestNextBootScreen(screenId) {
  if (!ALLOWED_BOOT_TARGETS.has(screenId)) throw new Error(`Unsupported boot intent: ${screenId}`);
  const storage = getSessionStorage();
  if (!storage) return screenId;
  storage.setItem(FRONTEND_INTENT_KEY, screenId);
  return screenId;
}

export function consumeNextBootScreen() {
  const storage = getSessionStorage();
  if (!storage) return null;
  const screenId = storage.getItem(FRONTEND_INTENT_KEY);
  storage.removeItem(FRONTEND_INTENT_KEY);
  return ALLOWED_BOOT_TARGETS.has(screenId) ? screenId : null;
}

export function requestRunRestart(characterId) {
  const normalized = String(characterId || '').trim();
  if (!normalized) throw new Error('Run restart intent requires a character id');
  const storage = getSessionStorage();
  if (storage) storage.setItem(RUN_RESTART_INTENT_KEY, normalized);
  return normalized;
}

export function consumeRunRestartCharacterId() {
  const storage = getSessionStorage();
  if (!storage) return null;
  const characterId = storage.getItem(RUN_RESTART_INTENT_KEY);
  storage.removeItem(RUN_RESTART_INTENT_KEY);
  return characterId ? String(characterId) : null;
}

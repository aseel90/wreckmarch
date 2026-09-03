import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCREEN_IDS } from '../../src/ui/screen-registry.js';
import {
  FRONTEND_INTENT_KEY,
  RUN_RESTART_INTENT_KEY,
  consumeNextBootScreen,
  consumeRunRestartCharacterId,
  requestNextBootScreen,
  requestRunRestart,
} from '../../src/ui/frontend-intent.js';

function createSessionStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('frontend boot intent', () => {
  it('persists and consumes Character Select exactly once', () => {
    const storage = createSessionStorage();
    vi.stubGlobal('sessionStorage', storage);
    expect(requestNextBootScreen(SCREEN_IDS.CHARACTER_SELECT)).toBe(SCREEN_IDS.CHARACTER_SELECT);
    expect(storage.getItem(FRONTEND_INTENT_KEY)).toBe(SCREEN_IDS.CHARACTER_SELECT);
    expect(consumeNextBootScreen()).toBe(SCREEN_IDS.CHARACTER_SELECT);
    expect(consumeNextBootScreen()).toBeNull();
  });

  it('allows Main but rejects post-run and gameplay routes as boot intents', () => {
    vi.stubGlobal('sessionStorage', createSessionStorage());
    expect(requestNextBootScreen(SCREEN_IDS.MAIN)).toBe(SCREEN_IDS.MAIN);
    expect(() => requestNextBootScreen(SCREEN_IDS.RESULTS)).toThrow('Unsupported boot intent: results');
    expect(() => requestNextBootScreen(SCREEN_IDS.GAMEPLAY)).toThrow('Unsupported boot intent: gameplay');
  });

  it('stores restart character identity separately and consumes it once', () => {
    const storage = createSessionStorage();
    vi.stubGlobal('sessionStorage', storage);
    expect(requestRunRestart('runner')).toBe('runner');
    expect(storage.getItem(RUN_RESTART_INTENT_KEY)).toBe('runner');
    expect(consumeRunRestartCharacterId()).toBe('runner');
    expect(consumeRunRestartCharacterId()).toBeNull();
    expect(() => requestRunRestart('')).toThrow('Run restart intent requires a character id');
  });
});

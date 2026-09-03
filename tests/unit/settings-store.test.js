import { describe, expect, it, vi } from 'vitest';
import { createSettingsStore, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../../src/ui/settings-store.js';

function makeStorage(initial = null) {
  let value = initial;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((key, next) => {
      expect(key).toBe(SETTINGS_STORAGE_KEY);
      value = next;
    }),
  };
}

describe('canonical SettingsStore', () => {
  it('starts from defaults and persists typed changes', () => {
    const storage = makeStorage();
    const store = createSettingsStore({ storage });
    expect(store.getSnapshot()).toEqual(DEFAULT_SETTINGS);

    store.set('audioEnabled', false);
    expect(store.getSnapshot()).toEqual({ audioEnabled: false, screenShakeEnabled: true });
    expect(JSON.parse(storage.setItem.mock.calls.at(-1)[1])).toEqual({ audioEnabled: false, screenShakeEnabled: true });
  });

  it('restores valid persisted state and sanitizes invalid fields', () => {
    const storage = makeStorage(JSON.stringify({ audioEnabled: false, screenShakeEnabled: 'nope' }));
    const store = createSettingsStore({ storage });
    expect(store.getSnapshot()).toEqual({ audioEnabled: false, screenShakeEnabled: true });
  });

  it('notifies subscribers once and can reset to canonical defaults', () => {
    const storage = makeStorage();
    const store = createSettingsStore({ storage });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set('screenShakeEnabled', false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual({ audioEnabled: true, screenShakeEnabled: false });
    store.reset();
    expect(store.getSnapshot()).toEqual(DEFAULT_SETTINGS);
  });

  it('rejects unknown keys and non-boolean values', () => {
    const store = createSettingsStore({ storage: null });
    expect(() => store.set('unknown', true)).toThrow('Unknown setting');
    expect(() => store.set('audioEnabled', 'yes')).toThrow(TypeError);
  });
});

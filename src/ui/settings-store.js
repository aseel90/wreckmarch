export const SETTINGS_STORAGE_KEY = 'wreckmarch.settings.v1';

export const DEFAULT_SETTINGS = Object.freeze({
  audioEnabled: true,
  screenShakeEnabled: true,
});

const BOOLEAN_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

function resolveStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function sanitizeSettings(value) {
  const input = value && typeof value === 'object' ? value : {};
  return Object.freeze({
    audioEnabled: typeof input.audioEnabled === 'boolean' ? input.audioEnabled : DEFAULT_SETTINGS.audioEnabled,
    screenShakeEnabled: typeof input.screenShakeEnabled === 'boolean' ? input.screenShakeEnabled : DEFAULT_SETTINGS.screenShakeEnabled,
  });
}

function loadSettings(storage) {
  if (!storage) return DEFAULT_SETTINGS;
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? sanitizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function createSettingsStore({ storage = resolveStorage() } = {}) {
  let state = loadSettings(storage);
  const listeners = new Set();

  const persist = () => {
    if (!storage) return;
    try {
      storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistence failure must never block gameplay or menus.
    }
  };

  const emit = previous => {
    listeners.forEach(listener => listener(state, previous));
  };

  return Object.freeze({
    getSnapshot() {
      return state;
    },

    get(key) {
      if (!BOOLEAN_KEYS.has(key)) throw new Error(`Unknown setting: ${key}`);
      return state[key];
    },

    set(key, value) {
      if (!BOOLEAN_KEYS.has(key)) throw new Error(`Unknown setting: ${key}`);
      if (typeof value !== 'boolean') throw new TypeError(`Setting ${key} must be boolean`);
      if (state[key] === value) return state;
      const previous = state;
      state = Object.freeze({ ...state, [key]: value });
      persist();
      emit(previous);
      return state;
    },

    reset() {
      const previous = state;
      state = DEFAULT_SETTINGS;
      persist();
      emit(previous);
      return state;
    },

    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('SettingsStore subscriber must be a function');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}

export const settingsStore = createSettingsStore();

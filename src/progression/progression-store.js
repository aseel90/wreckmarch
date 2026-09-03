export const PROGRESSION_STORAGE_KEY = 'wreckmarch.progression.v1';

const DEFAULT_STATE = Object.freeze({
  version: 1,
  totalRuns: 0,
  bestSurvivalSeconds: 0,
  highestLevel: 1,
  lifetimeScrapCollected: 0,
  lastRunAt: null,
});

function getDefaultStorage() {
  try { return globalThis.localStorage || null; }
  catch { return null; }
}

function nonNegativeInt(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function normalizeState(value = {}) {
  return {
    version: 1,
    totalRuns: nonNegativeInt(value.totalRuns),
    bestSurvivalSeconds: nonNegativeInt(value.bestSurvivalSeconds),
    highestLevel: Math.max(1, nonNegativeInt(value.highestLevel, 1)),
    lifetimeScrapCollected: nonNegativeInt(value.lifetimeScrapCollected),
    lastRunAt: typeof value.lastRunAt === 'string' && value.lastRunAt ? value.lastRunAt : null,
  };
}

function freezeSnapshot(state) {
  return Object.freeze({ ...state });
}

export class ProgressionStore {
  constructor({ storage = getDefaultStorage(), storageKey = PROGRESSION_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.listeners = new Set();
    this.state = this.#load();
  }

  #load() {
    if (!this.storage) return normalizeState(DEFAULT_STATE);
    try {
      const raw = this.storage.getItem(this.storageKey);
      return raw ? normalizeState(JSON.parse(raw)) : normalizeState(DEFAULT_STATE);
    } catch {
      return normalizeState(DEFAULT_STATE);
    }
  }

  #persist() {
    if (!this.storage) return;
    try { this.storage.setItem(this.storageKey, JSON.stringify(this.state)); }
    catch { /* Persistence failure must never block the core game. */ }
  }

  snapshot() {
    return freezeSnapshot(this.state);
  }

  recordRun(result) {
    if (!result || typeof result !== 'object') throw new TypeError('ProgressionStore.recordRun requires a canonical run result');
    const survivedSeconds = nonNegativeInt(result.survivedSeconds);
    const level = Math.max(1, nonNegativeInt(result.level, 1));
    const scrap = nonNegativeInt(result.scrap);
    const createdAt = typeof result.createdAt === 'string' && result.createdAt ? result.createdAt : new Date().toISOString();

    this.state = normalizeState({
      ...this.state,
      totalRuns: this.state.totalRuns + 1,
      bestSurvivalSeconds: Math.max(this.state.bestSurvivalSeconds, survivedSeconds),
      highestLevel: Math.max(this.state.highestLevel, level),
      lifetimeScrapCollected: this.state.lifetimeScrapCollected + scrap,
      lastRunAt: createdAt,
    });
    this.#persist();
    const snapshot = this.snapshot();
    this.listeners.forEach(listener => listener(snapshot));
    return snapshot;
  }

  reset() {
    this.state = normalizeState(DEFAULT_STATE);
    this.#persist();
    const snapshot = this.snapshot();
    this.listeners.forEach(listener => listener(snapshot));
    return snapshot;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('ProgressionStore subscriber must be a function');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const progressionStore = new ProgressionStore();

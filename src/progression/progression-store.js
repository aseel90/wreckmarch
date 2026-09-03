export const PROGRESSION_STORAGE_KEY = 'wreckmarch.progression.v2';
export const LEGACY_PROGRESSION_STORAGE_KEY = 'wreckmarch.progression.v1';

const DEFAULT_STATE = Object.freeze({
  version: 2,
  totalRuns: 0,
  bestSurvivalSeconds: 0,
  highestLevel: 1,
  lifetimeScrapCollected: 0,
  workshopScrip: 0,
  recordedRunIds: Object.freeze([]),
  rewardedRunIds: Object.freeze([]),
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

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && id))];
}

function normalizeState(value = {}) {
  return {
    version: 2,
    totalRuns: nonNegativeInt(value.totalRuns),
    bestSurvivalSeconds: nonNegativeInt(value.bestSurvivalSeconds),
    highestLevel: Math.max(1, nonNegativeInt(value.highestLevel, 1)),
    lifetimeScrapCollected: nonNegativeInt(value.lifetimeScrapCollected),
    workshopScrip: nonNegativeInt(value.workshopScrip),
    recordedRunIds: normalizeIdList(value.recordedRunIds),
    rewardedRunIds: normalizeIdList(value.rewardedRunIds),
    lastRunAt: typeof value.lastRunAt === 'string' && value.lastRunAt ? value.lastRunAt : null,
  };
}

function freezeSnapshot(state) {
  return Object.freeze({
    ...state,
    recordedRunIds: Object.freeze([...state.recordedRunIds]),
    rewardedRunIds: Object.freeze([...state.rewardedRunIds]),
  });
}

function canonicalRunId(result) {
  if (!result || typeof result !== 'object') throw new TypeError('ProgressionStore.recordRun requires a canonical run result');
  if (typeof result.runId !== 'string' || !result.runId) throw new TypeError('Canonical run result must include runId');
  return result.runId;
}

export class ProgressionStore {
  constructor({ storage = getDefaultStorage(), storageKey = PROGRESSION_STORAGE_KEY, legacyStorageKey = LEGACY_PROGRESSION_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.legacyStorageKey = legacyStorageKey;
    this.listeners = new Set();
    const loaded = this.#load();
    this.state = loaded.state;
    if (loaded.migrated) this.#persist();
  }

  #read(key) {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  #load() {
    if (!this.storage) return { state: normalizeState(DEFAULT_STATE), migrated: false };
    const current = this.#read(this.storageKey);
    if (current) return { state: normalizeState(current), migrated: Number(current.version) !== 2 };

    const legacy = this.#read(this.legacyStorageKey);
    if (legacy) return { state: normalizeState(legacy), migrated: true };
    return { state: normalizeState(DEFAULT_STATE), migrated: false };
  }

  #persist() {
    if (!this.storage) return;
    try { this.storage.setItem(this.storageKey, JSON.stringify(this.state)); }
    catch { /* Persistence failure must never block the core game. */ }
  }

  #publish() {
    const snapshot = this.snapshot();
    this.listeners.forEach(listener => listener(snapshot));
    return snapshot;
  }

  snapshot() {
    return freezeSnapshot(this.state);
  }

  recordRun(result, { workshopReward = null } = {}) {
    const runId = canonicalRunId(result);
    const alreadyRecorded = this.state.recordedRunIds.includes(runId);
    const rewardAlreadyProcessed = this.state.rewardedRunIds.includes(runId);
    let changed = false;
    const next = { ...this.state, recordedRunIds: [...this.state.recordedRunIds], rewardedRunIds: [...this.state.rewardedRunIds] };

    if (!alreadyRecorded) {
      const survivedSeconds = nonNegativeInt(result.survivedSeconds);
      const level = Math.max(1, nonNegativeInt(result.level, 1));
      const scrap = nonNegativeInt(result.scrap);
      const createdAt = typeof result.createdAt === 'string' && result.createdAt ? result.createdAt : new Date().toISOString();
      next.totalRuns += 1;
      next.bestSurvivalSeconds = Math.max(next.bestSurvivalSeconds, survivedSeconds);
      next.highestLevel = Math.max(next.highestLevel, level);
      next.lifetimeScrapCollected += scrap;
      next.lastRunAt = createdAt;
      next.recordedRunIds.push(runId);
      changed = true;
    }

    if (workshopReward && !rewardAlreadyProcessed) {
      if (workshopReward.runId !== runId) throw new Error('Workshop reward runId must match canonical run result');
      next.workshopScrip += nonNegativeInt(workshopReward.amount);
      next.rewardedRunIds.push(runId);
      changed = true;
    }

    if (!changed) return this.snapshot();
    this.state = normalizeState(next);
    this.#persist();
    return this.#publish();
  }

  reset() {
    this.state = normalizeState(DEFAULT_STATE);
    if (this.storage) {
      try { this.storage.removeItem(this.legacyStorageKey); }
      catch { /* Ignore unavailable storage mutations. */ }
    }
    this.#persist();
    return this.#publish();
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('ProgressionStore subscriber must be a function');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const progressionStore = new ProgressionStore();

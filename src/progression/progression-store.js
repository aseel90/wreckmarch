/**
 * @typedef {{ runId: string, amount: number }} WorkshopReward
 * @typedef {{ workshopReward?: WorkshopReward | null }} RecordRunOptions
 * @typedef {{ itemId: string, cost: number }} WorkshopPurchaseRequest
 */

export const PROGRESSION_STORAGE_KEY = 'wreckmarch.progression.v3';
export const PREVIOUS_PROGRESSION_STORAGE_KEY = 'wreckmarch.progression.v2';
export const LEGACY_PROGRESSION_STORAGE_KEY = 'wreckmarch.progression.v1';

const DEFAULT_STATE = Object.freeze({
  version: 3,
  totalRuns: 0,
  bestSurvivalSeconds: 0,
  highestLevel: 1,
  lifetimeScrapCollected: 0,
  workshopScrip: 0,
  recordedRunIds: Object.freeze([]),
  rewardedRunIds: Object.freeze([]),
  ownedWorkshopItemIds: Object.freeze([]),
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
    version: 3,
    totalRuns: nonNegativeInt(value.totalRuns),
    bestSurvivalSeconds: nonNegativeInt(value.bestSurvivalSeconds),
    highestLevel: Math.max(1, nonNegativeInt(value.highestLevel, 1)),
    lifetimeScrapCollected: nonNegativeInt(value.lifetimeScrapCollected),
    workshopScrip: nonNegativeInt(value.workshopScrip),
    recordedRunIds: normalizeIdList(value.recordedRunIds),
    rewardedRunIds: normalizeIdList(value.rewardedRunIds),
    ownedWorkshopItemIds: normalizeIdList(value.ownedWorkshopItemIds),
    lastRunAt: typeof value.lastRunAt === 'string' && value.lastRunAt ? value.lastRunAt : null,
  };
}

function freezeSnapshot(state) {
  return Object.freeze({
    ...state,
    recordedRunIds: Object.freeze([...state.recordedRunIds]),
    rewardedRunIds: Object.freeze([...state.rewardedRunIds]),
    ownedWorkshopItemIds: Object.freeze([...state.ownedWorkshopItemIds]),
  });
}

function canonicalRunId(result) {
  if (!result || typeof result !== 'object') throw new TypeError('ProgressionStore.recordRun requires a canonical run result');
  if (typeof result.runId !== 'string' || !result.runId) throw new TypeError('Canonical run result must include runId');
  return result.runId;
}

function canonicalPurchaseRequest(request) {
  if (!request || typeof request !== 'object') throw new TypeError('ProgressionStore.purchaseWorkshopItem requires a canonical purchase request');
  const itemId = typeof request.itemId === 'string' ? request.itemId.trim() : '';
  const cost = nonNegativeInt(request.cost, -1);
  if (!itemId) throw new TypeError('Workshop purchase requires itemId');
  if (cost < 1) throw new TypeError('Workshop purchase requires a positive integer cost');
  return { itemId, cost };
}

export class ProgressionStore {
  constructor({
    storage = getDefaultStorage(),
    storageKey = PROGRESSION_STORAGE_KEY,
    previousStorageKey = PREVIOUS_PROGRESSION_STORAGE_KEY,
    legacyStorageKey = LEGACY_PROGRESSION_STORAGE_KEY,
  } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.previousStorageKey = previousStorageKey;
    this.legacyStorageKey = legacyStorageKey;
    this.listeners = new Set();
    const loaded = this.#load();
    this.state = loaded.state;
    if (loaded.migrated) {
      this.#persist();
      this.#removeStorageKey(loaded.sourceKey);
    }
  }

  #read(key) {
    if (!this.storage || !key) return null;
    try {
      const raw = this.storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  #removeStorageKey(key) {
    if (!this.storage || !key || key === this.storageKey) return;
    try { this.storage.removeItem(key); }
    catch { /* Ignore unavailable storage mutations. */ }
  }

  #load() {
    if (!this.storage) return { state: normalizeState(DEFAULT_STATE), migrated: false, sourceKey: null };
    const current = this.#read(this.storageKey);
    if (current) return { state: normalizeState(current), migrated: Number(current.version) !== 3, sourceKey: null };

    const previous = this.#read(this.previousStorageKey);
    if (previous) return { state: normalizeState(previous), migrated: true, sourceKey: this.previousStorageKey };

    const legacy = this.#read(this.legacyStorageKey);
    if (legacy) return { state: normalizeState(legacy), migrated: true, sourceKey: this.legacyStorageKey };
    return { state: normalizeState(DEFAULT_STATE), migrated: false, sourceKey: null };
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

  /**
   * @param {object} result
   * @param {RecordRunOptions} [options]
   */
  recordRun(result, { workshopReward = null } = {}) {
    const runId = canonicalRunId(result);
    const alreadyRecorded = this.state.recordedRunIds.includes(runId);
    const rewardAlreadyProcessed = this.state.rewardedRunIds.includes(runId);
    let changed = false;
    const next = {
      ...this.state,
      recordedRunIds: [...this.state.recordedRunIds],
      rewardedRunIds: [...this.state.rewardedRunIds],
      ownedWorkshopItemIds: [...this.state.ownedWorkshopItemIds],
    };

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

  /** @param {WorkshopPurchaseRequest} request */
  purchaseWorkshopItem(request) {
    const { itemId, cost } = canonicalPurchaseRequest(request);
    if (this.state.ownedWorkshopItemIds.includes(itemId)) {
      return Object.freeze({ status: 'already-owned', itemId, charged: 0, snapshot: this.snapshot() });
    }
    if (this.state.workshopScrip < cost) {
      return Object.freeze({ status: 'insufficient-funds', itemId, charged: 0, snapshot: this.snapshot() });
    }

    const next = {
      ...this.state,
      workshopScrip: this.state.workshopScrip - cost,
      recordedRunIds: [...this.state.recordedRunIds],
      rewardedRunIds: [...this.state.rewardedRunIds],
      ownedWorkshopItemIds: [...this.state.ownedWorkshopItemIds, itemId],
    };
    this.state = normalizeState(next);
    this.#persist();
    const snapshot = this.#publish();
    return Object.freeze({ status: 'purchased', itemId, charged: cost, snapshot });
  }

  reset() {
    this.state = normalizeState(DEFAULT_STATE);
    this.#removeStorageKey(this.previousStorageKey);
    this.#removeStorageKey(this.legacyStorageKey);
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

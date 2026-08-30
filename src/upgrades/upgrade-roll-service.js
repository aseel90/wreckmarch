function hashSeed(seed) {
  const text = typeof seed === 'string' ? seed : String(seed);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeededUpgradeRng(seed) {
  let state = hashSeed(seed);
  return function seededUpgradeRng() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function requireCount(count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new TypeError(`Upgrade roll count must be a non-negative integer: ${String(count)}`);
  }
  return count;
}

function requireRng(rng) {
  if (typeof rng !== 'function') throw new TypeError('Upgrade roll rng must be a function');
  return rng;
}

function normalizeExcludeIds(excludeIds) {
  if (excludeIds == null) return new Set();
  if (!Array.isArray(excludeIds) && !(excludeIds instanceof Set)) {
    throw new TypeError('Upgrade roll excludeIds must be an array or Set');
  }
  const ids = new Set();
  for (const id of excludeIds) {
    if (typeof id !== 'string' || !id.trim()) throw new TypeError('Upgrade roll excludeIds must contain non-empty strings');
    ids.add(id);
  }
  return ids;
}

function normalizeChoice(choice, index) {
  if (!choice || typeof choice !== 'object') throw new TypeError(`Invalid upgrade roll choice at index ${index}`);
  if (typeof choice.id !== 'string' || !choice.id.trim()) throw new TypeError(`Upgrade roll choice ${index} requires an id`);
  if (typeof choice.available !== 'function') throw new TypeError(`Upgrade roll choice ${choice.id} requires available()`);
  if (!Number.isFinite(choice.weight) || choice.weight < 0) {
    throw new TypeError(`Upgrade roll choice ${choice.id} requires a finite weight >= 0`);
  }
  return choice;
}

function readRoll(rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`Upgrade roll rng must return a value in [0, 1): ${String(value)}`);
  }
  return value;
}

export function rollUpgradeChoices(choices, { count = 3, rng = Math.random, excludeIds = [] } = {}) {
  if (!Array.isArray(choices)) throw new TypeError('Upgrade roll choices must be an array');
  requireCount(count);
  requireRng(rng);
  const excluded = normalizeExcludeIds(excludeIds);

  const available = choices
    .map(normalizeChoice)
    .filter(choice => !excluded.has(choice.id) && choice.available() && choice.weight > 0);

  const chosen = [];
  while (chosen.length < count && available.length) {
    const totalWeight = available.reduce((sum, choice) => sum + choice.weight, 0);
    if (!(totalWeight > 0)) break;

    let roll = readRoll(rng) * totalWeight;
    let index = available.length - 1;
    for (let candidate = 0; candidate < available.length; candidate += 1) {
      roll -= available[candidate].weight;
      if (roll <= 0) {
        index = candidate;
        break;
      }
    }
    chosen.push(available.splice(index, 1)[0]);
  }
  return chosen;
}

import { normalizeUpgradeDefinition } from './upgrade-schema.js?v=2';

export class UpgradeRegistry {
  #definitions = new Map();

  constructor(definitions = []) {
    if (!Array.isArray(definitions)) throw new TypeError('UpgradeRegistry definitions must be an array');
    for (const definition of definitions) this.register(definition);
  }

  register(definition) {
    const normalized = normalizeUpgradeDefinition(definition);
    if (this.#definitions.has(normalized.id)) throw new Error(`Duplicate upgrade id: ${normalized.id}`);
    this.#definitions.set(normalized.id, normalized);
    return normalized;
  }

  get(id) {
    return this.#definitions.get(id) || null;
  }

  has(id) {
    return this.#definitions.has(id);
  }

  list() {
    return Object.freeze([...this.#definitions.values()]);
  }

  get size() {
    return this.#definitions.size;
  }
}

export function createUpgradeRegistry(definitions = []) {
  return new UpgradeRegistry(definitions);
}

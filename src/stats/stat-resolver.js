/* WRECKMARCH U1 — canonical deterministic stat calculation primitives */
export const STAT_MODIFIER_TYPES = Object.freeze({
  FLAT: 'FLAT',
  ADDITIVE_PERCENT: 'ADDITIVE_PERCENT',
  MULTIPLICATIVE_PERCENT: 'MULTIPLICATIVE_PERCENT',
  OVERRIDE: 'OVERRIDE'
});

const TYPE_SET = new Set(Object.values(STAT_MODIFIER_TYPES));

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number`);
  return number;
}

function normalizeModifier(modifier, index) {
  if (!modifier || !TYPE_SET.has(modifier.type)) throw new TypeError(`Invalid stat modifier type at index ${index}`);
  return {
    id: String(modifier.id ?? `modifier-${index}`),
    type: modifier.type,
    value: finiteNumber(modifier.value, `modifier[${index}].value`),
    priority: Number.isFinite(Number(modifier.priority)) ? Number(modifier.priority) : 0
  };
}

function pickOverride(modifiers) {
  const overrides = modifiers.filter(modifier => modifier.type === STAT_MODIFIER_TYPES.OVERRIDE);
  if (!overrides.length) return null;
  return [...overrides].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0];
}

export function resolveStat(baseValue, modifiers = [], { min = -Infinity, max = Infinity } = {}) {
  const base = finiteNumber(baseValue, 'baseValue');
  if (!Array.isArray(modifiers)) throw new TypeError('modifiers must be an array');
  const normalized = modifiers.map(normalizeModifier);

  const flat = normalized
    .filter(modifier => modifier.type === STAT_MODIFIER_TYPES.FLAT)
    .reduce((sum, modifier) => sum + modifier.value, 0);
  const additivePercent = normalized
    .filter(modifier => modifier.type === STAT_MODIFIER_TYPES.ADDITIVE_PERCENT)
    .reduce((sum, modifier) => sum + modifier.value, 0);
  const multiplicativePercent = normalized
    .filter(modifier => modifier.type === STAT_MODIFIER_TYPES.MULTIPLICATIVE_PERCENT)
    .reduce((product, modifier) => product * (1 + modifier.value), 1);

  let resolved = (base + flat) * (1 + additivePercent) * multiplicativePercent;
  const override = pickOverride(normalized);
  if (override) resolved = override.value;

  const lower = finiteNumber(min === -Infinity ? Number.MIN_SAFE_INTEGER : min, 'min');
  const upper = finiteNumber(max === Infinity ? Number.MAX_SAFE_INTEGER : max, 'max');
  if (lower > upper) throw new RangeError('min cannot be greater than max');
  return Math.min(upper, Math.max(lower, resolved));
}

export function resolveStatBlock(baseStats, modifiersByStat = {}, capsByStat = {}) {
  if (!baseStats || typeof baseStats !== 'object' || Array.isArray(baseStats)) throw new TypeError('baseStats must be an object');
  return Object.freeze(Object.fromEntries(Object.entries(baseStats).map(([stat, baseValue]) => [
    stat,
    resolveStat(baseValue, modifiersByStat[stat] || [], capsByStat[stat] || {})
  ])));
}

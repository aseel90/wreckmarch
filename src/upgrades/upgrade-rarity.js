import { STAT_MODIFIER_TYPES } from '../stats/stat-resolver.js';

export const UPGRADE_RARITIES = Object.freeze({
  COMMON: 'COMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY'
});

export const UPGRADE_RARITY_RULES = Object.freeze({
  [UPGRADE_RARITIES.COMMON]: Object.freeze({
    id: UPGRADE_RARITIES.COMMON,
    label: 'COMMON',
    weight: 65,
    powerMultiplier: 1,
    color: 0x8f9aa5
  }),
  [UPGRADE_RARITIES.RARE]: Object.freeze({
    id: UPGRADE_RARITIES.RARE,
    label: 'RARE',
    weight: 24,
    powerMultiplier: 1.15,
    color: 0x55aaff
  }),
  [UPGRADE_RARITIES.EPIC]: Object.freeze({
    id: UPGRADE_RARITIES.EPIC,
    label: 'EPIC',
    weight: 9,
    powerMultiplier: 1.3,
    color: 0xb66cf0
  }),
  [UPGRADE_RARITIES.LEGENDARY]: Object.freeze({
    id: UPGRADE_RARITIES.LEGENDARY,
    label: 'LEGENDARY',
    weight: 2,
    powerMultiplier: 1.5,
    color: 0xf0b84a
  })
});

const RARITY_ORDER = Object.freeze([
  UPGRADE_RARITIES.COMMON,
  UPGRADE_RARITIES.RARE,
  UPGRADE_RARITIES.EPIC,
  UPGRADE_RARITIES.LEGENDARY
]);
const RARITY_IDS = new Set(RARITY_ORDER);
const RARITY_RANK = new Map(RARITY_ORDER.map((rarity, index) => [rarity, index]));
const RARITY_TIERS = Object.freeze(RARITY_ORDER.map(rarity => UPGRADE_RARITY_RULES[rarity]));

function cleanScaledNumber(value) {
  return Math.round(value * 1e9) / 1e9;
}

export function normalizeUpgradeRarity(rarity) {
  if (typeof rarity !== 'string' || !rarity.trim()) {
    throw new TypeError(`Upgrade rarity must be a non-empty string: ${String(rarity)}`);
  }
  const normalized = rarity.trim().toUpperCase();
  if (!RARITY_IDS.has(normalized)) throw new TypeError(`Unknown upgrade rarity: ${rarity}`);
  return normalized;
}

export function getUpgradeRarityRule(rarity) {
  return UPGRADE_RARITY_RULES[normalizeUpgradeRarity(rarity)];
}

export function isUpgradeRarityAtLeast(rarity, minimumRarity) {
  const resolved = normalizeUpgradeRarity(rarity);
  const minimum = normalizeUpgradeRarity(minimumRarity);
  return RARITY_RANK.get(resolved) >= RARITY_RANK.get(minimum);
}

export function resolveUpgradeRarityForDefinition(definition, requestedRarity = null) {
  const fixedRarity = definition?.rarity == null ? null : normalizeUpgradeRarity(definition.rarity);
  const resolved = requestedRarity == null
    ? (fixedRarity || UPGRADE_RARITIES.COMMON)
    : normalizeUpgradeRarity(requestedRarity);
  if (fixedRarity && resolved !== fixedRarity) {
    throw new RangeError(`${definition.id} is fixed to ${fixedRarity} rarity`);
  }
  return resolved;
}

export function rollUpgradeRarity(rng = Math.random, fixedRarity = null, minimumRarity = null) {
  const minimum = minimumRarity == null ? null : normalizeUpgradeRarity(minimumRarity);
  if (fixedRarity != null) {
    const fixed = normalizeUpgradeRarity(fixedRarity);
    if (minimum && !isUpgradeRarityAtLeast(fixed, minimum)) {
      throw new RangeError(`Fixed upgrade rarity ${fixed} is below minimum reward rarity ${minimum}`);
    }
    return fixed;
  }
  if (typeof rng !== 'function') throw new TypeError('Upgrade rarity rng must be a function');
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`Upgrade rarity rng must return a value in [0, 1): ${String(value)}`);
  }

  const totalWeight = RARITY_TIERS.reduce((sum, tier) => sum + tier.weight, 0);
  let roll = value * totalWeight;
  let rolledRarity = RARITY_TIERS[RARITY_TIERS.length - 1].id;
  for (const tier of RARITY_TIERS) {
    roll -= tier.weight;
    if (roll <= 0) {
      rolledRarity = tier.id;
      break;
    }
  }

  if (minimum && !isUpgradeRarityAtLeast(rolledRarity, minimum)) return minimum;
  return rolledRarity;
}

export function scaleUpgradeModifierValue(modifier, rarity) {
  if (!modifier || typeof modifier !== 'object') throw new TypeError('Upgrade rarity scaling requires a modifier');
  const value = Number(modifier.value);
  if (!Number.isFinite(value)) throw new TypeError('Upgrade rarity scaling requires a finite modifier value');
  const { powerMultiplier } = getUpgradeRarityRule(rarity);
  if (powerMultiplier === 1) return value;
  if (modifier.type === STAT_MODIFIER_TYPES.OVERRIDE) {
    throw new RangeError('OVERRIDE modifiers must be fixed to COMMON rarity or define a dedicated scaling owner');
  }
  return cleanScaledNumber(value * powerMultiplier);
}

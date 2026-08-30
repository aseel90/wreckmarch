import { STAT_MODIFIER_TYPES } from '../stats/stat-resolver.js';
import { RUN_STAT_DOMAINS } from '../stats/run-stat-state.js';

export const UPGRADE_SCOPES = Object.freeze({
  GENERAL: 'GENERAL',
  CHARACTER: 'CHARACTER',
  WEAPON: 'WEAPON',
  COMPANION: 'COMPANION'
});

const VALID_SCOPES = new Set(Object.values(UPGRADE_SCOPES));
const VALID_MODIFIER_TYPES = new Set(Object.values(STAT_MODIFIER_TYPES));
const VALID_STAT_DOMAINS = new Set(Object.values(RUN_STAT_DOMAINS));
const UPGRADE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function freezeConfig(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeConfig));
  if (!isPlainObject(value)) return value;
  return Object.freeze(Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, freezeConfig(item)])
  ));
}

function normalizeModifier(modifier) {
  if (!isPlainObject(modifier)) throw new TypeError('Upgrade modifier must be a plain object');
  if (!VALID_STAT_DOMAINS.has(modifier.domain)) throw new TypeError(`Invalid upgrade modifier domain: ${String(modifier.domain)}`);
  if (!nonEmptyString(modifier.stat)) throw new TypeError('Upgrade modifier stat must be a non-empty string');
  if (!VALID_MODIFIER_TYPES.has(modifier.type)) throw new TypeError(`Invalid upgrade modifier type: ${String(modifier.type)}`);
  if (!Number.isFinite(modifier.value)) throw new TypeError('Upgrade modifier value must be finite');
  if (modifier.priority != null && !Number.isFinite(modifier.priority)) throw new TypeError('Upgrade modifier priority must be finite');
  if (modifier.min != null && !Number.isFinite(modifier.min)) throw new TypeError('Upgrade modifier min must be finite');
  if (modifier.max != null && !Number.isFinite(modifier.max)) throw new TypeError('Upgrade modifier max must be finite');
  if (modifier.min != null && modifier.max != null && Number(modifier.min) > Number(modifier.max)) {
    throw new RangeError('Upgrade modifier min cannot be greater than max');
  }
  return Object.freeze({
    domain: modifier.domain,
    stat: modifier.stat.trim(),
    type: modifier.type,
    value: Number(modifier.value),
    ...(modifier.priority == null ? {} : { priority: Number(modifier.priority) }),
    ...(modifier.min == null ? {} : { min: Number(modifier.min) }),
    ...(modifier.max == null ? {} : { max: Number(modifier.max) })
  });
}

function normalizeMechanicalEffect(effect) {
  if (effect == null) return null;
  if (!isPlainObject(effect)) throw new TypeError('Upgrade mechanicalEffect must be a plain object');
  if (!nonEmptyString(effect.id)) throw new TypeError('Upgrade mechanicalEffect id must be a non-empty string');
  if (effect.config != null && !isPlainObject(effect.config)) throw new TypeError('Upgrade mechanicalEffect config must be a plain object');
  return Object.freeze({
    id: effect.id.trim(),
    config: freezeConfig(effect.config || {})
  });
}

function normalizeRequirements(requirements) {
  if (!Array.isArray(requirements)) throw new TypeError('Upgrade requirements must be an array');
  return Object.freeze(requirements.map((requirement) => {
    if (nonEmptyString(requirement)) return requirement.trim();
    if (isPlainObject(requirement)) return freezeConfig(requirement);
    throw new TypeError('Upgrade requirements must contain non-empty strings or plain objects');
  }));
}

export function normalizeUpgradeDefinition(definition) {
  if (!isPlainObject(definition)) throw new TypeError('Upgrade definition must be a plain object');
  if (!nonEmptyString(definition.id) || !UPGRADE_ID_PATTERN.test(definition.id)) {
    throw new TypeError(`Invalid upgrade id: ${String(definition.id)}`);
  }
  if (!nonEmptyString(definition.name)) throw new TypeError('Upgrade name must be a non-empty string');
  if (!nonEmptyString(definition.description)) throw new TypeError('Upgrade description must be a non-empty string');
  if (!Number.isInteger(definition.maxLevel) || definition.maxLevel < 1) throw new TypeError('Upgrade maxLevel must be a positive integer');
  if (!VALID_SCOPES.has(definition.scope)) throw new TypeError(`Invalid upgrade scope: ${String(definition.scope)}`);
  if (definition.rarity != null && !nonEmptyString(definition.rarity)) throw new TypeError('Upgrade rarity must be null or a non-empty string');
  if (!Number.isFinite(definition.weight) || definition.weight < 0) throw new TypeError('Upgrade weight must be a finite number >= 0');

  const tags = definition.tags ?? [];
  if (!Array.isArray(tags) || tags.some((tag) => !nonEmptyString(tag))) throw new TypeError('Upgrade tags must be an array of non-empty strings');
  const normalizedTags = tags.map((tag) => tag.trim());
  if (new Set(normalizedTags).size !== normalizedTags.length) throw new TypeError('Upgrade tags must not contain duplicates');

  const requirements = normalizeRequirements(definition.requirements ?? []);
  const modifiers = definition.modifiers ?? [];
  if (!Array.isArray(modifiers)) throw new TypeError('Upgrade modifiers must be an array');
  const normalizedModifiers = Object.freeze(modifiers.map(normalizeModifier));
  const mechanicalEffect = normalizeMechanicalEffect(definition.mechanicalEffect);
  if (normalizedModifiers.length === 0 && !mechanicalEffect) {
    throw new TypeError('Upgrade definition requires modifiers or mechanicalEffect data');
  }
  if (definition.offerRules != null && !isPlainObject(definition.offerRules)) throw new TypeError('Upgrade offerRules must be a plain object');
  if (definition.artId != null && !nonEmptyString(definition.artId)) throw new TypeError('Upgrade artId must be null or a non-empty string');

  return Object.freeze({
    id: definition.id,
    name: definition.name.trim(),
    description: definition.description.trim(),
    rarity: definition.rarity == null ? null : definition.rarity.trim(),
    maxLevel: definition.maxLevel,
    scope: definition.scope,
    tags: Object.freeze(normalizedTags),
    requirements,
    weight: Number(definition.weight),
    offerRules: freezeConfig(definition.offerRules || {}),
    modifiers: normalizedModifiers,
    mechanicalEffect,
    artId: definition.artId == null ? null : definition.artId.trim()
  });
}

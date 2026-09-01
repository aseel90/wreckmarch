/* WRECKMARCH — canonical Upgrade System prerequisite resolution */

export const UPGRADE_REQUIREMENT_TYPES = Object.freeze({
  UPGRADE_LEVEL: 'upgrade-level'
});

function requireUpgradeLevelRequirement(requirement, definitionId = 'unknown') {
  if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement)) {
    throw new TypeError(`Unsupported upgrade requirement for ${definitionId}`);
  }
  if (requirement.type !== UPGRADE_REQUIREMENT_TYPES.UPGRADE_LEVEL) {
    throw new TypeError(`Unsupported upgrade requirement type for ${definitionId}: ${String(requirement.type)}`);
  }
  if (typeof requirement.id !== 'string' || !requirement.id.trim()) {
    throw new TypeError(`Upgrade-level requirement for ${definitionId} requires a non-empty id`);
  }
  const level = Number(requirement.level);
  if (!Number.isInteger(level) || level < 1) {
    throw new TypeError(`Upgrade-level requirement for ${definitionId} requires level >= 1`);
  }
  return Object.freeze({ type: requirement.type, id: requirement.id.trim(), level });
}

export function resolveUpgradeRequirement(scene, requirement, { definitionId = 'unknown' } = {}) {
  const normalized = requireUpgradeLevelRequirement(requirement, definitionId);
  const currentLevel = Number(scene?.upgradeLevels?.[normalized.id] ?? 0);
  if (!Number.isInteger(currentLevel) || currentLevel < 0) {
    throw new TypeError(`Invalid scene upgrade level for requirement ${normalized.id}: ${String(currentLevel)}`);
  }
  return Object.freeze({ ...normalized, currentLevel, met: currentLevel >= normalized.level });
}

export function resolveUpgradeRequirements(scene, definition) {
  const requirements = definition?.requirements ?? [];
  if (!Array.isArray(requirements)) throw new TypeError(`Upgrade requirements must be an array: ${String(definition?.id)}`);
  return Object.freeze(requirements.map(requirement => resolveUpgradeRequirement(scene, requirement, { definitionId: definition?.id || 'unknown' })));
}

export function meetsUpgradeRequirements(scene, definition) {
  return resolveUpgradeRequirements(scene, definition).every(requirement => requirement.met);
}

export function assertUpgradeRequirements(scene, definition) {
  const unmet = resolveUpgradeRequirements(scene, definition).filter(requirement => !requirement.met);
  if (unmet.length === 0) return true;
  const detail = unmet.map(requirement => `${requirement.id} LV${requirement.level} (current LV${requirement.currentLevel})`).join(', ');
  throw new Error(`${definition?.id || 'upgrade'} requirements not met: ${detail}`);
}

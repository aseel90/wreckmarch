/* WRECKMARCH — canonical Upgrade System character/weapon compatibility filtering */

function normalizeRuntimeId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requireIdList(value, label, definitionId = 'unknown') {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new TypeError(`Upgrade compatibility ${label} must be an array: ${definitionId}`);
  }
  const ids = value.map((id) => {
    if (typeof id !== 'string' || !id.trim()) {
      throw new TypeError(`Upgrade compatibility ${label} must contain non-empty ids: ${definitionId}`);
    }
    return id.trim();
  });
  if (new Set(ids).size !== ids.length) {
    throw new TypeError(`Upgrade compatibility ${label} must not contain duplicates: ${definitionId}`);
  }
  return Object.freeze(ids);
}

export function resolveUpgradeCompatibilityContext(scene) {
  const characterId = normalizeRuntimeId(scene?.characterId ?? scene?.characterDefinition?.id);
  const weaponId = normalizeRuntimeId(
    scene?.activeWeaponId
      ?? scene?.weaponId
      ?? scene?.startingWeaponId
      ?? scene?.characterDefinition?.startingWeapon?.id
  );
  return Object.freeze({ characterId, weaponId });
}

export function resolveUpgradeCompatibility(scene, definition) {
  const compatibility = definition?.compatibility ?? {};
  if (!compatibility || typeof compatibility !== 'object' || Array.isArray(compatibility)) {
    throw new TypeError(`Upgrade compatibility must be an object: ${String(definition?.id)}`);
  }
  const characterIds = requireIdList(compatibility.characterIds, 'characterIds', definition?.id || 'unknown');
  const weaponIds = requireIdList(compatibility.weaponIds, 'weaponIds', definition?.id || 'unknown');
  const { characterId, weaponId } = resolveUpgradeCompatibilityContext(scene);

  // Compatibility is a technical mismatch filter, not a recommendation engine.
  // Missing identity in isolated unit/debug fixtures is neutral; explicit runtime
  // mismatches are rejected.
  const characterMet = characterIds.length === 0 || characterId == null || characterIds.includes(characterId);
  const weaponMet = weaponIds.length === 0 || weaponId == null || weaponIds.includes(weaponId);

  return Object.freeze({
    characterId,
    weaponId,
    characterIds,
    weaponIds,
    characterMet,
    weaponMet,
    met: characterMet && weaponMet
  });
}

export function meetsUpgradeCompatibility(scene, definition) {
  return resolveUpgradeCompatibility(scene, definition).met;
}

export function assertUpgradeCompatibility(scene, definition) {
  const resolved = resolveUpgradeCompatibility(scene, definition);
  if (resolved.met) return true;

  const reasons = [];
  if (!resolved.characterMet) {
    reasons.push(`character ${resolved.characterId} not in [${resolved.characterIds.join(', ')}]`);
  }
  if (!resolved.weaponMet) {
    reasons.push(`weapon ${resolved.weaponId} not in [${resolved.weaponIds.join(', ')}]`);
  }
  throw new Error(`${definition?.id || 'upgrade'} incompatible: ${reasons.join('; ')}`);
}

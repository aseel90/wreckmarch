/* WRECKMARCH — canonical Shotgun production activation gate.
 * This is a readiness boundary, not an activation switch. Shotgun stays locked
 * until every gameplay/presentation/validation requirement is independently ready.
 */
import {
  CHARACTER_AVAILABILITY,
  getCharacterEntry,
  isCharacterSelectable
} from './character-registry.js?v=5';
import { hasCharacterRuntimePresentation } from './character-runtime-presentation.js?v=1';
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=1';
import { SHOTGUN_RUNTIME_COMPOSITION } from './shotgun-runtime-composition.js?v=1';
import { getWeaponDefinition } from '../combat/weapon-registry.js?v=2';
import { getUpgradeDefinition } from '../upgrades/upgrade-catalog.js?v=14';
import { meetsUpgradeCompatibility } from '../upgrades/upgrade-compatibility.js?v=1';

export const SHOTGUN_PRODUCTION_GATE_VERSION = 'shotgun-production-gate-v1';

export const SHOTGUN_FULL_RUN_VALIDATION = Object.freeze({
  status: 'pending',
  evidence: null
});

const RIVET_ONLY_UPGRADES = Object.freeze([
  'twin-riveter',
  'triple-riveter',
  'explosive-rivet'
]);

const SHARED_WEAPON_UPGRADES = Object.freeze([
  'heavy-rivets',
  'overclock',
  'piercing-rivets',
  'ricochet',
  'shrapnel-impact'
]);

function shotgunUpgradeCompatibilityReady() {
  const scene = Object.freeze({ characterId: 'shotgun', startingWeaponId: 'shotgun' });
  const rivetOnlyBlocked = RIVET_ONLY_UPGRADES.every(id => {
    const definition = getUpgradeDefinition(id);
    return definition && !meetsUpgradeCompatibility(scene, definition);
  });
  const sharedAllowed = SHARED_WEAPON_UPGRADES.every(id => {
    const definition = getUpgradeDefinition(id);
    return definition && meetsUpgradeCompatibility(scene, definition);
  });
  return rivetOnlyBlocked && sharedAllowed;
}

export function evaluateShotgunProductionGate() {
  const entry = getCharacterEntry('shotgun');
  const weapon = getWeaponDefinition('shotgun');

  const requirements = Object.freeze({
    canonicalWeapon: weapon.id === 'shotgun',
    runtimePresentation:
      SHOTGUN_RUNTIME_PRESENTATION.id === 'shotgun'
      && SHOTGUN_RUNTIME_PRESENTATION.body.idle.length === 2
      && SHOTGUN_RUNTIME_PRESENTATION.body.run.length === 3
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.key === 'shotgun-weapon'
      && SHOTGUN_RUNTIME_PRESENTATION.activation.previewRegistryEntryAllowed === true,
    runtimeComposition:
      SHOTGUN_RUNTIME_COMPOSITION.id === 'shotgun-inactive-composition'
      && SHOTGUN_RUNTIME_COMPOSITION.motions.idle === 2
      && SHOTGUN_RUNTIME_COMPOSITION.motions.run === 3
      && SHOTGUN_RUNTIME_COMPOSITION.activation.previewRegistryEntryAllowed === true,
    upgradeCompatibility: shotgunUpgradeCompatibilityReady(),
    characterDefinition: Boolean(entry.definition),
    c5Presentation: hasCharacterRuntimePresentation('shotgun', 'c5'),
    d1Presentation: hasCharacterRuntimePresentation('shotgun', 'd1'),
    fullRunValidation:
      SHOTGUN_FULL_RUN_VALIDATION.status === 'approved'
      && typeof SHOTGUN_FULL_RUN_VALIDATION.evidence === 'string'
      && SHOTGUN_FULL_RUN_VALIDATION.evidence.length > 0
  });

  const blockers = Object.freeze(
    Object.entries(requirements)
      .filter(([, ready]) => !ready)
      .map(([requirement]) => requirement)
  );
  const readyForActivation = blockers.length === 0;
  const selectableNow = isCharacterSelectable('shotgun');
  const lockedPreviewSafety =
    entry.availability === CHARACTER_AVAILABILITY.LOCKED
    && entry.lockReason === 'production-gate'
    && !selectableNow;

  return Object.freeze({
    version: SHOTGUN_PRODUCTION_GATE_VERSION,
    characterId: 'shotgun',
    readyForActivation,
    selectableNow,
    lockedPreviewSafety,
    requirements,
    blockers
  });
}

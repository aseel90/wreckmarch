/* WRECKMARCH — canonical Wrecker production activation evidence.
 * This readiness boundary records the independent gameplay/presentation/validation
 * requirements that justified exposing Wrecker through CharacterRegistry.
 */
import {
  CHARACTER_AVAILABILITY,
  getCharacterEntry,
  isCharacterSelectable
} from './character-registry.js?v=5&wreckerActivation=1';
import { hasCharacterRuntimePresentation } from './character-runtime-presentation.js?v=11&wrecker=11&wreckerActivation=1';
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=7&wreckerActivation=1';
import { SHOTGUN_RUNTIME_COMPOSITION } from './shotgun-runtime-composition.js?v=6&wreckerActivation=1';
import { getWeaponDefinition } from '../combat/weapon-registry.js?v=2';
import { getUpgradeDefinition } from '../upgrades/upgrade-catalog.js?v=14';
import { meetsUpgradeCompatibility } from '../upgrades/upgrade-compatibility.js?v=1';

export const SHOTGUN_PRODUCTION_GATE_VERSION = 'shotgun-production-gate-v10';

export const SHOTGUN_FULL_RUN_VALIDATION = Object.freeze({
  status: 'approved',
  evidence: 'D1 run_reports.id=57; 309.379s; wave=6; Wrecker identity/110HP/shotgun/performance approved; telemetry baseline follow-up fixed in PR #366'
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
      && SHOTGUN_RUNTIME_PRESENTATION.status === 'active-runtime-boundary'
      && SHOTGUN_RUNTIME_PRESENTATION.activation.playableOnMain === true
      && SHOTGUN_RUNTIME_PRESENTATION.body.idle.length === 2
      && SHOTGUN_RUNTIME_PRESENTATION.body.run.length === 4
      && SHOTGUN_RUNTIME_PRESENTATION.body.run.every(frame => frame.generated === true)
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.key === 'shotgun-weapon'
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.hold?.mode === 'two-hand-fixed'
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.hold?.runtimeRotation === false
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.hold?.runtimeBodyRotation === false
      && SHOTGUN_RUNTIME_PRESENTATION.layers?.mode === 'body-weapon-front-hands'
      && SHOTGUN_RUNTIME_PRESENTATION.layers?.weaponDepthOffset > SHOTGUN_RUNTIME_PRESENTATION.layers?.bodyDepthOffset
      && SHOTGUN_RUNTIME_PRESENTATION.layers?.handOverlayDepthOffset > SHOTGUN_RUNTIME_PRESENTATION.layers?.weaponDepthOffset
      && SHOTGUN_RUNTIME_PRESENTATION.layers?.runtimeCrop === false
      && [...SHOTGUN_RUNTIME_PRESENTATION.body.idle, ...SHOTGUN_RUNTIME_PRESENTATION.body.run].every(frame => typeof frame.handOverlayKey === 'string')
      && SHOTGUN_RUNTIME_PRESENTATION.body.handOverlay?.runtimeCrop === false
      && SHOTGUN_RUNTIME_PRESENTATION.body.grip?.right?.x === 70
      && SHOTGUN_RUNTIME_PRESENTATION.body.grip?.right?.y === 75
      && SHOTGUN_RUNTIME_PRESENTATION.body.support?.right?.x === 103
      && SHOTGUN_RUNTIME_PRESENTATION.body.support?.right?.y === 78
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.support?.x === 51
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.support?.y === 25
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.supportFromGrip?.x === 33
      && SHOTGUN_RUNTIME_PRESENTATION.weapon.supportFromGrip?.y === 3
      && SHOTGUN_RUNTIME_PRESENTATION.activation.previewRegistryEntryAllowed === true,
    runtimeComposition:
      SHOTGUN_RUNTIME_COMPOSITION.id === 'shotgun-production-composition'
      && SHOTGUN_RUNTIME_COMPOSITION.status === 'active-phaser-composition'
      && SHOTGUN_RUNTIME_COMPOSITION.activation.playableOnMain === true
      && SHOTGUN_RUNTIME_COMPOSITION.motions.idle === 2
      && SHOTGUN_RUNTIME_COMPOSITION.motions.run === 4
      && SHOTGUN_RUNTIME_COMPOSITION.hold?.mode === 'two-hand-fixed'
      && SHOTGUN_RUNTIME_COMPOSITION.hold?.runtimeRotation === false
      && SHOTGUN_RUNTIME_COMPOSITION.hold?.runtimeBodyRotation === false
      && SHOTGUN_RUNTIME_COMPOSITION.layers?.mode === 'body-weapon-front-hands'
      && SHOTGUN_RUNTIME_COMPOSITION.layers?.runtimeCrop === false
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
  const lockedPreviewSafety = entry.availability === CHARACTER_AVAILABILITY.LOCKED && !selectableNow;

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

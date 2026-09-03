/* WRECKMARCH WS14-C — inactive Shotgun runtime presentation boundary.
 * This module gives the approved Shotgun art stable runtime-facing texture/animation
 * ownership without registering a playable character or changing gameplay.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from './shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT } from './shotgun-aim-alignment.js';

const bodyIdle = SHOTGUN_PRODUCTION_ART.body.idle.map((path, index) => Object.freeze({
  key: `shotgun-body-idle-${index}`,
  path
}));
const bodyRun = SHOTGUN_PRODUCTION_ART.body.run.map((path, index) => Object.freeze({
  key: `shotgun-body-run-${index}`,
  path
}));

export const SHOTGUN_RUNTIME_PRESENTATION = Object.freeze({
  id: 'shotgun',
  status: 'inactive-runtime-boundary',
  body: Object.freeze({
    canvas: SHOTGUN_ART_CONTRACT.canvas,
    render: SHOTGUN_ART_CONTRACT.render,
    idle: Object.freeze(bodyIdle),
    run: Object.freeze(bodyRun),
    animationKeys: Object.freeze({
      idle: 'character-shotgun-idle',
      run: 'character-shotgun-run'
    })
  }),
  weapon: Object.freeze({
    key: 'shotgun-weapon',
    path: SHOTGUN_PRODUCTION_ART.weapon.path,
    canvas: SHOTGUN_PRODUCTION_ART.weapon.canvas,
    grip: SHOTGUN_PRODUCTION_ART.weapon.grip,
    muzzle: SHOTGUN_PRODUCTION_ART.weapon.muzzle,
    origin: SHOTGUN_AIM_ALIGNMENT.weaponOrigin,
    muzzleFromGrip: SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip
  }),
  activation: Object.freeze({
    playableOnMain: false,
    registryEntryAllowed: false,
    gameplayDefinitionReady: false
  })
});

export function listShotgunRuntimeAssets() {
  return Object.freeze([
    ...SHOTGUN_RUNTIME_PRESENTATION.body.idle,
    ...SHOTGUN_RUNTIME_PRESENTATION.body.run,
    Object.freeze({ key: SHOTGUN_RUNTIME_PRESENTATION.weapon.key, path: SHOTGUN_RUNTIME_PRESENTATION.weapon.path })
  ]);
}

export function queueShotgunRuntimeAssets(scene) {
  if (!scene?.load?.svg) throw Error('Shotgun runtime asset queue requires a Phaser-like scene.load.svg boundary');
  for (const asset of listShotgunRuntimeAssets()) scene.load.svg(asset.key, asset.path);
  return SHOTGUN_RUNTIME_PRESENTATION;
}

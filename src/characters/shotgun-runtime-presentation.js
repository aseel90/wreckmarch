/* WRECKMARCH WS14-C/WS14-E — locked Shotgun runtime presentation boundary.
 * This module gives the approved Shotgun art stable runtime-facing texture/animation
 * ownership. A canonical gameplay definition may exist while CharacterRegistry keeps
 * the character locked until the production gate and real-run validation are complete.
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
    gripSocket: SHOTGUN_ART_CONTRACT.gripSocket,
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
    previewRegistryEntryAllowed: true,
    playableRegistryDefinitionAllowed: true,
    gameplayDefinitionReady: true
  })
});

export function listShotgunRuntimeAssets() {
  return Object.freeze([
    ...SHOTGUN_RUNTIME_PRESENTATION.body.idle,
    ...SHOTGUN_RUNTIME_PRESENTATION.body.run,
    Object.freeze({ key: SHOTGUN_RUNTIME_PRESENTATION.weapon.key, path: SHOTGUN_RUNTIME_PRESENTATION.weapon.path })
  ]);
}

export function queueShotgunRuntimeAssets(scene, assets = listShotgunRuntimeAssets()) {
  // One canonical loader owner for approved Wrecker textures. The body assets are SVG
  // wrappers around approved PNG rasters, so Phaser must let the browser decode them as
  // ordinary images. This avoids WebKit/Safari losing the nested raster in SVG parsing.
  if (!scene?.load?.image) throw Error('Shotgun runtime asset queue requires a Phaser-like scene.load.image boundary');
  for (const asset of assets) scene.load.image(asset.key, asset.path);
  return SHOTGUN_RUNTIME_PRESENTATION;
}

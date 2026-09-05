/* WRECKMARCH WS14-C/WS14-E — locked Shotgun runtime presentation boundary.
 * Body locomotion is full-frame baked art only; no runtime limb split is allowed.
 * The weapon is composited between the full body and a tiny baked two-hand overlay,
 * so hands can sit over the weapon without putting the weapon behind the whole torso.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js?v=2';
import { SHOTGUN_PRODUCTION_ART } from './shotgun-production-art.js?v=3';
import { SHOTGUN_AIM_ALIGNMENT } from './shotgun-aim-alignment.js?v=3';

const bodyIdle = SHOTGUN_PRODUCTION_ART.body.idle.map((path, index) => Object.freeze({
  key: `shotgun-body-idle-${index}`,
  path,
  handOverlayKey: `shotgun-hands-idle-${index}`,
  generated: false
}));
const bodyRun = SHOTGUN_PRODUCTION_ART.body.runBake.poses.map((pose, index) => Object.freeze({
  key: `shotgun-body-run-${index}`,
  handOverlayKey: `shotgun-hands-run-${index}`,
  pose,
  sourcePath: SHOTGUN_PRODUCTION_ART.body.runBake.source,
  bakeMethod: SHOTGUN_PRODUCTION_ART.body.runBake.method,
  generated: true
}));

export const SHOTGUN_RUNTIME_PRESENTATION = Object.freeze({
  id: 'shotgun',
  status: 'inactive-runtime-boundary',
  layers: Object.freeze({
    mode: 'body-weapon-front-hands',
    bodyDepthOffset: 0,
    weaponDepthOffset: 0.1,
    handOverlayDepthOffset: 0.2,
    runtimeCrop: false
  }),
  body: Object.freeze({
    canvas: SHOTGUN_ART_CONTRACT.canvas,
    render: SHOTGUN_ART_CONTRACT.render,
    gripSocket: SHOTGUN_ART_CONTRACT.gripSocket,
    grip: SHOTGUN_AIM_ALIGNMENT.bodyGrip,
    support: SHOTGUN_AIM_ALIGNMENT.bodySupport,
    idle: Object.freeze(bodyIdle),
    run: Object.freeze(bodyRun),
    runBakeSource: SHOTGUN_PRODUCTION_ART.body.runBake.source,
    handOverlay: Object.freeze({
      mode: 'baked-two-hand-overlay',
      source: 'same-body-raster',
      runtimeCrop: false
    }),
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
    support: SHOTGUN_PRODUCTION_ART.weapon.support,
    muzzle: SHOTGUN_PRODUCTION_ART.weapon.muzzle,
    origin: SHOTGUN_AIM_ALIGNMENT.weaponOrigin,
    supportFromGrip: SHOTGUN_AIM_ALIGNMENT.supportFromGrip,
    muzzleFromGrip: SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip,
    hold: SHOTGUN_AIM_ALIGNMENT.hold
  }),
  activation: Object.freeze({
    playableOnMain: false,
    previewRegistryEntryAllowed: true,
    playableRegistryDefinitionAllowed: true,
    gameplayDefinitionReady: true
  })
});

export function getShotgunHandOverlayKey(bodyTextureKey) {
  const frames = [...SHOTGUN_RUNTIME_PRESENTATION.body.idle, ...SHOTGUN_RUNTIME_PRESENTATION.body.run];
  return frames.find(frame => frame.key === bodyTextureKey)?.handOverlayKey || SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].handOverlayKey;
}

export function listShotgunRuntimeAssets() {
  return Object.freeze([
    ...SHOTGUN_RUNTIME_PRESENTATION.body.idle,
    Object.freeze({ key: SHOTGUN_RUNTIME_PRESENTATION.weapon.key, path: SHOTGUN_RUNTIME_PRESENTATION.weapon.path })
  ]);
}

export function queueShotgunRuntimeAssets(scene, assets = listShotgunRuntimeAssets()) {
  if (!scene?.load?.image) throw Error('Shotgun runtime asset queue requires a Phaser-like scene.load.image boundary');
  for (const asset of assets) scene.load.image(asset.key, asset.path);
  return SHOTGUN_RUNTIME_PRESENTATION;
}

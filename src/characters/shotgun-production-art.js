/* WRECKMARCH WS14-C — active Wrecker production art manifest.
 * Character Select and the canonical runtime both consume this committed production art.
 * Run locomotion is baked from the approved idle raster into complete CanvasTextures.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js?v=3&wreckerActivation=1';

const IDLE_SOURCE = 'assets/hero/shotgun/idle-0.svg';

export const SHOTGUN_PRODUCTION_ART = Object.freeze({
  status: 'production-active',
  body: Object.freeze({
    canvas: SHOTGUN_ART_CONTRACT.canvas,
    footLineY: SHOTGUN_ART_CONTRACT.body.footLineY,
    authoredGripMarker: SHOTGUN_ART_CONTRACT.twoHandHold.bodyRearGrip,
    authoredSupportMarker: SHOTGUN_ART_CONTRACT.twoHandHold.bodySupportGrip,
    idle: Object.freeze([
      IDLE_SOURCE,
      'assets/hero/shotgun/idle-1.svg'
    ]),
    runBake: Object.freeze({
      source: IDLE_SOURCE,
      method: 'full-frame-locomotion-v1',
      poses: Object.freeze(['step-left', 'compress-left', 'step-right', 'compress-right'])
    })
  }),
  weapon: Object.freeze({
    path: 'assets/weapons/shotgun.svg',
    canvas: Object.freeze({ width: 96, height: 40 }),
    grip: SHOTGUN_ART_CONTRACT.twoHandHold.weaponRearGrip,
    support: SHOTGUN_ART_CONTRACT.twoHandHold.weaponSupportGrip,
    muzzle: SHOTGUN_ART_CONTRACT.twoHandHold.weaponMuzzle
  }),
  activation: Object.freeze({ playableOnMain: true })
});

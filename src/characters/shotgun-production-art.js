/* WRECKMARCH WS14-C — inactive Shotgun production art manifest.
 * Locked frontend preview metadata may reference this manifest. Playable runtime activation remains gated.
 * Run locomotion is baked from the approved idle raster into complete CanvasTextures.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js?v=3';

const IDLE_SOURCE = 'assets/hero/shotgun/idle-0.svg';

export const SHOTGUN_PRODUCTION_ART = Object.freeze({
  status: 'art-only',
  body: Object.freeze({
    canvas: SHOTGUN_ART_CONTRACT.canvas,
    footLineY: SHOTGUN_ART_CONTRACT.body.footLineY,
    authoredGripMarker: Object.freeze({ x: 70, y: 75 }),
    authoredSupportMarker: Object.freeze({ x: 93, y: 72 }),
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
    grip: Object.freeze({ x: 18, y: 22 }),
    support: Object.freeze({ x: 41, y: 19 }),
    muzzle: Object.freeze({ x: 90, y: 17 })
  }),
  activation: Object.freeze({ playableOnMain: false })
});

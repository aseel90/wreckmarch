/* WRECKMARCH WS14-C — inactive Shotgun production art manifest.
 * Assets are intentionally not imported by the playable character registry/runtime yet.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js';

export const SHOTGUN_PRODUCTION_ART = Object.freeze({
  status: 'art-only',
  body: Object.freeze({
    canvas: SHOTGUN_ART_CONTRACT.canvas,
    footLineY: SHOTGUN_ART_CONTRACT.body.footLineY,
    idle: Object.freeze([
      'assets/hero/shotgun/idle-0.svg',
      'assets/hero/shotgun/idle-1.svg'
    ]),
    run: Object.freeze([
      'assets/hero/shotgun/run-0.svg',
      'assets/hero/shotgun/run-1.svg',
      'assets/hero/shotgun/run-2.svg'
    ])
  }),
  weapon: Object.freeze({
    path: 'assets/weapons/shotgun.svg',
    canvas: Object.freeze({ width: 96, height: 40 }),
    grip: Object.freeze({ x: 18, y: 22 }),
    muzzle: Object.freeze({ x: 90, y: 17 })
  }),
  activation: Object.freeze({ playableOnMain: false })
});

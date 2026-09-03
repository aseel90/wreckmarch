/* WRECKMARCH WS14-C — inactive Shotgun weapon-hold / aim alignment model.
 * This module is art-only. It derives body-local grip geometry from the frozen
 * production contract and the measured weapon markers; it does not register a
 * playable character or alter combat/runtime behavior.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from './shotgun-production-art.js';

const { width, height } = SHOTGUN_ART_CONTRACT.canvas;
const { originX, originY, scale } = SHOTGUN_ART_CONTRACT.render;
const { offsetX, offsetY } = SHOTGUN_ART_CONTRACT.gripSocket;
const weapon = SHOTGUN_PRODUCTION_ART.weapon;

const localY = (height * originY) + (offsetY / scale);
const localRightX = (width * originX) + (offsetX / scale);
const localLeftX = width - localRightX;

export const SHOTGUN_AIM_ALIGNMENT = Object.freeze({
  bodyGrip: Object.freeze({
    right: Object.freeze({ x: localRightX, y: localY }),
    left: Object.freeze({ x: localLeftX, y: localY })
  }),
  authoredGripMarker: Object.freeze({ x: 77, y: 81 }),
  weaponOrigin: Object.freeze({
    x: weapon.grip.x / weapon.canvas.width,
    y: weapon.grip.y / weapon.canvas.height
  }),
  muzzleFromGrip: Object.freeze({
    x: weapon.muzzle.x - weapon.grip.x,
    y: weapon.muzzle.y - weapon.grip.y
  }),
  activation: Object.freeze({ playableOnMain: false })
});

export function getShotgunWeaponPlacement(facing = 'right') {
  const grip = facing === 'left' ? SHOTGUN_AIM_ALIGNMENT.bodyGrip.left : SHOTGUN_AIM_ALIGNMENT.bodyGrip.right;
  return Object.freeze({
    grip,
    weaponTopLeft: Object.freeze({
      x: grip.x - weapon.grip.x,
      y: grip.y - weapon.grip.y
    }),
    weaponOrigin: SHOTGUN_AIM_ALIGNMENT.weaponOrigin
  });
}

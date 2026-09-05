/* WRECKMARCH WS14-C — locked Wrecker two-hand weapon hold geometry.
 *
 * The approved Wrecker body is a full-body baked pose. Production runtime never
 * rotates the shotgun from aim input. Instead, the gun is pinned to two authored
 * palm contacts and mirrored with the full body when facing changes.
 */
import { SHOTGUN_ART_CONTRACT } from './shotgun-art-contract.js?v=3';
import { SHOTGUN_PRODUCTION_ART } from './shotgun-production-art.js?v=4';

const { width } = SHOTGUN_ART_CONTRACT.canvas;
const weapon = SHOTGUN_PRODUCTION_ART.weapon;
const authoredGrip = SHOTGUN_PRODUCTION_ART.body.authoredGripMarker;
const authoredSupport = SHOTGUN_PRODUCTION_ART.body.authoredSupportMarker;

function mirrorBodyPoint(point) {
  return Object.freeze({ x: width - point.x, y: point.y });
}

const bodyGripRight = authoredGrip;
const bodyGripLeft = mirrorBodyPoint(bodyGripRight);
const bodySupportRight = authoredSupport;
const bodySupportLeft = mirrorBodyPoint(bodySupportRight);
const supportFromGrip = Object.freeze({
  x: weapon.support.x - weapon.grip.x,
  y: weapon.support.y - weapon.grip.y
});
const muzzleFromGrip = Object.freeze({
  x: weapon.muzzle.x - weapon.grip.x,
  y: weapon.muzzle.y - weapon.grip.y
});

export const SHOTGUN_AIM_ALIGNMENT = Object.freeze({
  bodyGrip: Object.freeze({ right: bodyGripRight, left: bodyGripLeft }),
  bodySupport: Object.freeze({ right: bodySupportRight, left: bodySupportLeft }),
  authoredGripMarker: authoredGrip,
  authoredSupportMarker: authoredSupport,
  weaponOrigin: Object.freeze({
    x: weapon.grip.x / weapon.canvas.width,
    y: weapon.grip.y / weapon.canvas.height
  }),
  supportFromGrip,
  muzzleFromGrip,
  hold: Object.freeze({
    mode: 'two-hand-fixed',
    rotationRadians: 0,
    runtimeRotation: false,
    bodyRotationRadians: 0,
    runtimeBodyRotation: false,
    supportTolerancePx: 0.3
  }),
  activation: Object.freeze({ playableOnMain: false })
});

function signedVector(vector, facing) {
  return Object.freeze({
    x: facing === 'left' ? -vector.x : vector.x,
    y: vector.y
  });
}

export function getShotgunWeaponPlacement(facing = 'right') {
  const resolvedFacing = facing === 'left' ? 'left' : 'right';
  const grip = SHOTGUN_AIM_ALIGNMENT.bodyGrip[resolvedFacing];
  const support = SHOTGUN_AIM_ALIGNMENT.bodySupport[resolvedFacing];
  const supportVector = signedVector(SHOTGUN_AIM_ALIGNMENT.supportFromGrip, resolvedFacing);
  const weaponSupport = Object.freeze({
    x: grip.x + supportVector.x,
    y: grip.y + supportVector.y
  });
  const supportError = Math.hypot(weaponSupport.x - support.x, weaponSupport.y - support.y);
  return Object.freeze({
    facing: resolvedFacing,
    grip,
    support,
    weaponSupport,
    supportError,
    weaponTopLeft: Object.freeze({
      x: grip.x - weapon.grip.x,
      y: grip.y - weapon.grip.y
    }),
    weaponOrigin: SHOTGUN_AIM_ALIGNMENT.weaponOrigin,
    flipX: resolvedFacing === 'left',
    rotationRadians: SHOTGUN_AIM_ALIGNMENT.hold.rotationRadians
  });
}

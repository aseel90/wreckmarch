/* WRECKMARCH WS14-C — inactive Phaser composition for Shotgun presentation.
 * Owns body/weapon layering, locomotion frame selection and relative aim only.
 * It intentionally has no registry, input, combat, projectile or gameplay ownership.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js';

const MOTIONS = Object.freeze({
  idle: SHOTGUN_RUNTIME_PRESENTATION.body.idle,
  run: SHOTGUN_RUNTIME_PRESENTATION.body.run
});

export const SHOTGUN_RUNTIME_COMPOSITION = Object.freeze({
  id: 'shotgun-inactive-composition',
  status: 'inactive-phaser-composition',
  motions: Object.freeze({ idle: 2, run: 3 }),
  activation: Object.freeze({ playableOnMain: false, registryEntryAllowed: false })
});

function requireSceneBoundary(scene) {
  if (!scene?.add?.image || !scene?.add?.container) {
    throw Error('Shotgun composition requires a Phaser-like scene.add image/container boundary');
  }
}

function resolveFrame(motion, frameIndex) {
  const frames = MOTIONS[motion];
  if (!frames) throw Error(`Unsupported Shotgun motion: ${motion}`);
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= frames.length) {
    throw Error(`Invalid Shotgun ${motion} frame index: ${frameIndex}`);
  }
  return frames[frameIndex];
}

function requireFacing(facing) {
  if (facing !== 'right' && facing !== 'left') throw Error(`Unsupported Shotgun facing: ${facing}`);
  return facing;
}

function requireAimDegrees(aimDegrees) {
  if (!Number.isFinite(aimDegrees)) throw Error('Shotgun aim degrees must be finite');
  return aimDegrees;
}

export function createShotgunRuntimeComposition(scene, options = {}) {
  requireSceneBoundary(scene);

  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const render = presentation.body.render;
  const gripSocket = presentation.body.gripSocket;
  let motion = options.motion ?? 'idle';
  let frameIndex = options.frameIndex ?? 0;
  let facing = requireFacing(options.facing ?? 'right');
  let aimDegrees = requireAimDegrees(options.aimDegrees ?? 0);
  const initialFrame = resolveFrame(motion, frameIndex);

  const body = scene.add.image(0, 0, initialFrame.key);
  body.setOrigin(render.originX, render.originY);
  body.setScale(render.scale);

  const weapon = scene.add.image(gripSocket.offsetX, gripSocket.offsetY, presentation.weapon.key);
  weapon.setOrigin(presentation.weapon.origin.x, presentation.weapon.origin.y);
  weapon.setScale(render.scale);

  const container = scene.add.container(options.x ?? 0, options.y ?? 0, [body, weapon]);

  function applyFacingAndAim() {
    const left = facing === 'left';
    body.setFlipX(left);
    weapon.setFlipX(left);
    weapon.x = left ? -gripSocket.offsetX : gripSocket.offsetX;
    weapon.y = gripSocket.offsetY;
    weapon.setAngle(left ? -aimDegrees : aimDegrees);
  }

  function setMotion(nextMotion, nextFrameIndex = 0) {
    const frame = resolveFrame(nextMotion, nextFrameIndex);
    motion = nextMotion;
    frameIndex = nextFrameIndex;
    body.setTexture(frame.key);
    return api;
  }

  function setFacing(nextFacing) {
    facing = requireFacing(nextFacing);
    applyFacingAndAim();
    return api;
  }

  function setAimDegrees(nextAimDegrees) {
    aimDegrees = requireAimDegrees(nextAimDegrees);
    applyFacingAndAim();
    return api;
  }

  function setPosition(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw Error('Shotgun composition position must be finite');
    container.setPosition(x, y);
    return api;
  }

  function destroy() {
    container.destroy(true);
  }

  const api = {
    container,
    body,
    weapon,
    get motion() { return motion; },
    get frameIndex() { return frameIndex; },
    get facing() { return facing; },
    get aimDegrees() { return aimDegrees; },
    setMotion,
    setFacing,
    setAimDegrees,
    setPosition,
    destroy
  };

  applyFacingAndAim();
  return api;
}

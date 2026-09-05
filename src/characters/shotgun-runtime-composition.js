/* WRECKMARCH WS14-C/WS14-E — locked Phaser composition for Shotgun presentation.
 * Owns the canonical body -> weapon -> front-hands layer order, locomotion frame
 * selection and fixed two-hand hold only. It intentionally owns no gameplay input.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=6';

const MOTIONS = Object.freeze({
  idle: SHOTGUN_RUNTIME_PRESENTATION.body.idle,
  run: SHOTGUN_RUNTIME_PRESENTATION.body.run
});

export const SHOTGUN_RUNTIME_COMPOSITION = Object.freeze({
  id: 'shotgun-inactive-composition',
  status: 'inactive-phaser-composition',
  motions: Object.freeze({ idle: SHOTGUN_RUNTIME_PRESENTATION.body.idle.length, run: SHOTGUN_RUNTIME_PRESENTATION.body.run.length }),
  hold: SHOTGUN_RUNTIME_PRESENTATION.weapon.hold,
  layers: SHOTGUN_RUNTIME_PRESENTATION.layers,
  activation: Object.freeze({
    playableOnMain: false,
    previewRegistryEntryAllowed: true,
    playableRegistryDefinitionAllowed: true
  })
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
  const canvas = presentation.body.canvas;
  const rightGrip = presentation.body.grip.right;
  const gripOffset = Object.freeze({
    x: (rightGrip.x - (canvas.width * render.originX)) * render.scale,
    y: (rightGrip.y - (canvas.height * render.originY)) * render.scale
  });
  let motion = options.motion ?? 'idle';
  let frameIndex = options.frameIndex ?? 0;
  let facing = requireFacing(options.facing ?? 'right');
  let aimDegrees = requireAimDegrees(options.aimDegrees ?? 0);
  let locomotionElapsedMs = 0;
  const initialFrame = resolveFrame(motion, frameIndex);

  const body = scene.add.image(0, 0, initialFrame.key);
  body.setOrigin(render.originX, render.originY);
  body.setScale(render.scale);

  const weapon = scene.add.image(gripOffset.x, gripOffset.y, presentation.weapon.key);
  weapon.setOrigin(presentation.weapon.origin.x, presentation.weapon.origin.y);
  weapon.setScale(render.scale);

  const hands = scene.add.image(0, 0, initialFrame.handOverlayKey);
  hands.setOrigin(render.originX, render.originY);
  hands.setScale(render.scale);

  const container = scene.add.container(options.x ?? 0, options.y ?? 0, [body, weapon, hands]);

  function applyFacingAndHold() {
    const left = facing === 'left';
    body.setFlipX(left);
    weapon.setFlipX(left);
    hands.setFlipX(left);
    weapon.x = left ? -gripOffset.x : gripOffset.x;
    weapon.y = gripOffset.y;
    weapon.setAngle(0);
  }

  function applyFrame(frame) {
    body.setTexture(frame.key);
    hands.setTexture(frame.handOverlayKey);
  }

  function setMotion(nextMotion, nextFrameIndex = 0) {
    const frame = resolveFrame(nextMotion, nextFrameIndex);
    motion = nextMotion;
    frameIndex = nextFrameIndex;
    locomotionElapsedMs = 0;
    applyFrame(frame);
    return api;
  }

  function advanceLocomotion(deltaMs, options) {
    const nextMotion = options?.motion ?? motion;
    const frameDurationMs = options?.frameDurationMs;
    if (!Number.isFinite(deltaMs) || deltaMs < 0) throw Error('Shotgun locomotion delta must be a finite non-negative number');
    if (!Number.isFinite(frameDurationMs) || frameDurationMs <= 0) throw Error('Shotgun locomotion frame duration must be a finite positive number');
    const frames = MOTIONS[nextMotion];
    if (!frames) throw Error(`Unsupported Shotgun motion: ${nextMotion}`);

    if (nextMotion !== motion) {
      motion = nextMotion;
      frameIndex = 0;
      locomotionElapsedMs = 0;
      applyFrame(frames[0]);
    }

    locomotionElapsedMs += deltaMs;
    const steps = Math.floor(locomotionElapsedMs / frameDurationMs);
    if (steps <= 0) return api;
    locomotionElapsedMs -= steps * frameDurationMs;
    const nextFrameIndex = (frameIndex + steps) % frames.length;
    if (nextFrameIndex !== frameIndex) {
      frameIndex = nextFrameIndex;
      applyFrame(frames[frameIndex]);
    }
    return api;
  }

  function setFacing(nextFacing) {
    facing = requireFacing(nextFacing);
    applyFacingAndHold();
    return api;
  }

  function setAimDegrees(nextAimDegrees) {
    aimDegrees = requireAimDegrees(nextAimDegrees);
    applyFacingAndHold();
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
    hands,
    get motion() { return motion; },
    get frameIndex() { return frameIndex; },
    get facing() { return facing; },
    get aimDegrees() { return aimDegrees; },
    get locomotionElapsedMs() { return locomotionElapsedMs; },
    setMotion,
    advanceLocomotion,
    setFacing,
    setAimDegrees,
    setPosition,
    destroy
  };

  applyFacingAndHold();
  return api;
}

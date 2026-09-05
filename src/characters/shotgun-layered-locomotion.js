/* WRECKMARCH — approved Wrecker layered locomotion presentation.
 *
 * Runtime-only presentation owner for the user-approved 4-direction motion lab.
 * The physics hero remains the canonical gameplay anchor. Three render layers use the
 * approved body texture so locomotion can move the legs/body without redrawing identity
 * or changing collision geometry. The weapon stays a separate layer.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=2';

const DEG = Math.PI / 180;
const STEP_MS = 115;
const MAX_DT_MS = 40;
const LOWER_START_RATIO = .55;
const TORSO_END_RATIO = .72;

const STEP_POSES = Object.freeze([
  Object.freeze({ torsoX: -1, torsoY: 0, torsoDeg: -.5, leftX: -4, leftY: 2, leftDeg: 2.6, rightX: 2, rightY: -1, rightDeg: -1.4 }),
  Object.freeze({ torsoX: 0, torsoY: 2, torsoDeg: 0, leftX: -1, leftY: 0, leftDeg: 0, rightX: 1, rightY: 0, rightDeg: 0 }),
  Object.freeze({ torsoX: 1, torsoY: 0, torsoDeg: .5, leftX: 2, leftY: -1, leftDeg: -1.4, rightX: -4, rightY: 2, rightDeg: 2.6 }),
  Object.freeze({ torsoX: 0, torsoY: 1, torsoDeg: 0, leftX: 0, leftY: 0, leftDeg: 0, rightX: 0, rightY: 0, rightDeg: 0 })
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMove(value) {
  const x = Number(value?.x) || 0;
  const y = Number(value?.y) || 0;
  const length = Math.hypot(x, y);
  if (!length) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

export function resolveShotgunLayeredMotion({
  moving = false,
  move = { x: 0, y: 0 },
  bodyClockMs = 0,
  stepClockMs = 0,
  speedRatio = 1
} = {}) {
  const direction = normalizeMove(move);
  const scaledStepMs = STEP_MS / clamp(Number(speedRatio) || 1, .72, 1.32);
  const poseIndex = moving ? Math.floor(Math.max(0, stepClockMs) / scaledStepMs) % STEP_POSES.length : 3;
  const pose = STEP_POSES[poseIndex];
  const phase = moving ? Math.max(0, bodyClockMs) / scaledStepMs : Math.max(0, bodyClockMs) / 900;

  if (!moving) {
    const breathe = Math.sin(phase * Math.PI * 2);
    return Object.freeze({
      poseIndex,
      bodyBob: breathe * .65,
      bodyRotation: breathe * .12 * DEG,
      torsoScaleY: 1 + breathe * .0025,
      torsoX: 0,
      torsoY: 0,
      torsoRotation: 0,
      leftX: 0,
      leftY: 0,
      leftRotation: 0,
      rightX: 0,
      rightY: 0,
      rightRotation: 0,
      shadowScaleX: 1,
      shadowScaleY: 1
    });
  }

  const bob = Math.sin(phase * Math.PI) * 1.45;
  const sway = Math.sin(phase * Math.PI * .5) * .65;
  const directionalLean = clamp(direction.x * .55 + direction.y * .22, -.75, .75);
  const breathe = 1 + Math.sin(phase * Math.PI) * .003;
  return Object.freeze({
    poseIndex,
    bodyBob: bob,
    bodyRotation: (sway + directionalLean) * DEG,
    torsoScaleY: breathe,
    torsoX: pose.torsoX,
    torsoY: pose.torsoY,
    torsoRotation: pose.torsoDeg * DEG,
    leftX: pose.leftX,
    leftY: pose.leftY,
    leftRotation: pose.leftDeg * DEG,
    rightX: pose.rightX,
    rightY: pose.rightY,
    rightRotation: pose.rightDeg * DEG,
    shadowScaleX: poseIndex === 0 || poseIndex === 2 ? .97 : poseIndex === 1 ? 1.03 : 1.01,
    shadowScaleY: 1 - bob * .018
  });
}

function requireImageBoundary(scene) {
  if (!scene?.hero || !scene?.add?.image) {
    throw Error('Shotgun layered locomotion requires hero and scene.add.image');
  }
}

function configureLayer(image, { x, y, key, originX, originY, scale, depth, crop }) {
  image
    .setTexture?.(key)
    .setOrigin?.(originX, originY)
    .setScale?.(scale)
    .setDepth?.(depth)
    .setFlipX?.(false)
    .setFlipY?.(false)
    .clearTint?.();
  if (crop) image.setCrop?.(...crop);
  image.setPosition?.(x, y);
  return image;
}

function layerList(state) {
  return [state?.legRight, state?.legLeft, state?.torso].filter(Boolean);
}

export function setShotgunLayeredFacing(scene, facing = 'right') {
  const state = scene?.__shotgunLayeredLocomotion;
  if (!state) return false;
  const flip = facing === 'left';
  state.facing = flip ? 'left' : 'right';
  for (const layer of layerList(state)) layer.setFlipX?.(flip);
  return true;
}

export function installShotgunLayeredLocomotion(scene) {
  requireImageBoundary(scene);
  if (scene.__shotgunLayeredLocomotion) return scene.__shotgunLayeredLocomotion;

  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const render = presentation.body.render;
  const canvas = presentation.body.canvas;
  const key = presentation.body.idle[0].key;
  const hero = scene.hero;
  const depth = Number(hero.depth) || 22;
  const lowerStart = Math.round(canvas.height * LOWER_START_RATIO);
  const torsoEnd = Math.round(canvas.height * TORSO_END_RATIO);
  const half = Math.round(canvas.width / 2);
  const overlap = 4;

  const legRight = configureLayer(scene.add.image(hero.x, hero.y, key), {
    x: hero.x,
    y: hero.y,
    key,
    originX: render.originX,
    originY: render.originY,
    scale: render.scale,
    depth: depth - .04,
    crop: [Math.max(0, half - overlap), lowerStart, half + overlap, canvas.height - lowerStart]
  });
  const legLeft = configureLayer(scene.add.image(hero.x, hero.y, key), {
    x: hero.x,
    y: hero.y,
    key,
    originX: render.originX,
    originY: render.originY,
    scale: render.scale,
    depth: depth - .02,
    crop: [0, lowerStart, half + overlap, canvas.height - lowerStart]
  });
  const torso = configureLayer(scene.add.image(hero.x, hero.y, key), {
    x: hero.x,
    y: hero.y,
    key,
    originX: render.originX,
    originY: render.originY,
    scale: render.scale,
    depth,
    crop: [0, 0, canvas.width, torsoEnd]
  });

  hero.stop?.().setTexture?.(key).setRotation?.(0).setVisible?.(false);
  const state = scene.__shotgunLayeredLocomotion = {
    legRight,
    legLeft,
    torso,
    facing: 'right',
    bodyClockMs: 0,
    stepClockMs: 0,
    lastTime: null,
    lastMoving: false,
    baseScale: render.scale
  };
  const aimFacing = Math.cos(Number(scene.weaponAim) || 0) < 0 ? 'left' : 'right';
  setShotgunLayeredFacing(scene, aimFacing);
  updateShotgunLayeredLocomotion(scene, 0);
  return state;
}

function syncLayerEffects(scene, state) {
  const hero = scene.hero;
  const alpha = Number.isFinite(hero?.alpha) ? hero.alpha : 1;
  for (const layer of layerList(state)) layer.setAlpha?.(alpha);
  const tint = Number(hero?.tintTopLeft);
  if (Number.isFinite(tint) && tint !== 0xffffff) {
    for (const layer of layerList(state)) layer.setTint?.(tint);
  } else {
    for (const layer of layerList(state)) layer.clearTint?.();
  }
}

export function updateShotgunLayeredLocomotion(scene, time = 0) {
  const state = scene?.__shotgunLayeredLocomotion || installShotgunLayeredLocomotion(scene);
  const hero = scene.hero;
  const definition = scene.characterDefinition;
  const locomotion = definition?.locomotion || {};
  const now = Number.isFinite(Number(time)) ? Number(time) : 0;
  const dt = state.lastTime == null ? 16 : clamp(now - state.lastTime, 0, MAX_DT_MS);
  state.lastTime = now;

  const move = scene.move || { x: 0, y: 0, lengthSq: () => 0 };
  const lengthSq = typeof move.lengthSq === 'function' ? move.lengthSq() : ((Number(move.x) || 0) ** 2 + (Number(move.y) || 0) ** 2);
  const moving = lengthSq > (Number(locomotion.movingThresholdSq) || .035);
  const baseSpeed = Number(locomotion.animationBaseSpeed) || 255;
  const speedRatio = clamp((Number(scene.heroSpeed) || baseSpeed) / baseSpeed, .72, 1.32);
  state.bodyClockMs += dt;
  if (moving) state.stepClockMs += dt;
  else state.stepClockMs = 0;

  const motion = resolveShotgunLayeredMotion({
    moving,
    move,
    bodyClockMs: state.bodyClockMs,
    stepClockMs: state.stepClockMs,
    speedRatio
  });
  const sign = state.facing === 'left' ? -1 : 1;
  const scale = state.baseScale;
  const bob = motion.bodyBob;

  state.torso
    .setPosition?.(hero.x + motion.torsoX * sign, hero.y + bob + motion.torsoY)
    .setRotation?.(motion.bodyRotation + motion.torsoRotation * sign)
    .setScale?.(scale, scale * motion.torsoScaleY);
  state.legLeft
    .setPosition?.(hero.x + motion.leftX * sign, hero.y + bob + motion.leftY)
    .setRotation?.(motion.leftRotation * sign)
    .setScale?.(scale);
  state.legRight
    .setPosition?.(hero.x + motion.rightX * sign, hero.y + bob + motion.rightY)
    .setRotation?.(motion.rightRotation * sign)
    .setScale?.(scale);

  scene.heroShadow?.setScale?.(motion.shadowScaleX, motion.shadowScaleY);
  syncLayerEffects(scene, state);
  state.lastMoving = moving;
  state.poseIndex = motion.poseIndex;
  return motion;
}

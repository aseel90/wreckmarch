/* WRECKMARCH — Wrecker full-body locomotion baker.
 *
 * This is an asset-preparation boundary, not a runtime rig. It takes the approved
 * Wrecker raster and bakes four complete 128x148 run textures. Gameplay only swaps
 * those full-body textures; no torso/leg GameObjects or crop transforms survive.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=5';

const LEFT_LEG = Object.freeze([[28,90],[61,90],[65,104],[62,141],[20,141],[22,112]]);
const RIGHT_LEG = Object.freeze([[65,90],[96,90],[110,116],[110,141],[65,141],[63,103]]);
const HIP_COVER = Object.freeze([[42,90],[86,90],[86,115],[42,115]]);

export const SHOTGUN_BAKED_RUN_POSES = Object.freeze([
  Object.freeze({ id: 'step-left', left: Object.freeze({ x: -3, y: 1 }), right: Object.freeze({ x: 1, y: -1 }) }),
  Object.freeze({ id: 'compress-left', left: Object.freeze({ x: -1, y: 0 }), right: Object.freeze({ x: 1, y: 0 }) }),
  Object.freeze({ id: 'step-right', left: Object.freeze({ x: 1, y: -1 }), right: Object.freeze({ x: -3, y: 1 }) }),
  Object.freeze({ id: 'compress-right', left: Object.freeze({ x: 0, y: 0 }), right: Object.freeze({ x: 0, y: 0 }) })
]);

function appendPolygon(ctx, points) {
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

function eraseOriginalLegs(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  appendPolygon(ctx, LEFT_LEG);
  appendPolygon(ctx, RIGHT_LEG);
  ctx.fill();
  ctx.restore();
}

function drawShiftedPiece(ctx, image, polygon, offset) {
  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.beginPath();
  appendPolygon(ctx, polygon);
  ctx.clip();
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function restoreHipCover(ctx, image) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 128, 99);
  appendPolygon(ctx, HIP_COVER);
  ctx.clip();
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

export function bakeShotgunRunTexture(scene, image, key, poseIndex) {
  const canvas = SHOTGUN_RUNTIME_PRESENTATION.body.canvas;
  const pose = SHOTGUN_BAKED_RUN_POSES[poseIndex];
  if (!pose) throw Error(`Invalid Wrecker baked run pose: ${poseIndex}`);
  if (image?.width !== canvas.width || image?.height !== canvas.height) {
    throw Error(`Wrecker bake source dimensions drifted: ${image?.width || 0}x${image?.height || 0}`);
  }
  if (!scene?.textures?.createCanvas) throw Error('Wrecker baked locomotion requires Phaser CanvasTexture support');
  if (scene.textures.exists?.(key)) scene.textures.remove?.(key);

  const texture = scene.textures.createCanvas(key, canvas.width, canvas.height);
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  eraseOriginalLegs(ctx);
  drawShiftedPiece(ctx, image, LEFT_LEG, pose.left);
  drawShiftedPiece(ctx, image, RIGHT_LEG, pose.right);
  restoreHipCover(ctx, image);
  texture.refresh();
  return texture;
}

export function bakeShotgunRunTextures(scene, image, frames = SHOTGUN_RUNTIME_PRESENTATION.body.run) {
  frames.forEach((frame, index) => bakeShotgunRunTexture(scene, image, frame.key, index));
  return frames;
}

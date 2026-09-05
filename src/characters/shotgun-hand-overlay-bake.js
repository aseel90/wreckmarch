/* WRECKMARCH — Wrecker baked two-hand foreground overlay.
 *
 * This is asset preparation, not a runtime crop rig. Two small authored polygons are
 * baked from the same approved full-body raster into a transparent CanvasTexture.
 * Runtime renders: full body -> weapon -> this overlay. No body-part transforms exist.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=6';

export const SHOTGUN_HAND_OVERLAY_MASKS = Object.freeze([
  Object.freeze({
    id: 'rear-grip-hand',
    points: Object.freeze([[60,69],[70,68],[77,71],[80,76],[77,82],[66,83],[59,78]])
  }),
  Object.freeze({
    id: 'support-hand',
    points: Object.freeze([[95,70],[105,69],[113,72],[117,77],[115,83],[108,87],[99,86],[93,80]])
  })
]);

function appendPolygon(ctx, points) {
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index][0], points[index][1]);
  ctx.closePath();
}

export function bakeShotgunHandOverlayTexture(scene, image, key) {
  const canvas = SHOTGUN_RUNTIME_PRESENTATION.body.canvas;
  if (image?.width !== canvas.width || image?.height !== canvas.height) {
    throw Error(`Wrecker hand-overlay source dimensions drifted: ${image?.width || 0}x${image?.height || 0}`);
  }
  if (!scene?.textures?.createCanvas) throw Error('Wrecker hand overlay requires Phaser CanvasTexture support');
  if (scene.textures.exists?.(key)) scene.textures.remove?.(key);

  const texture = scene.textures.createCanvas(key, canvas.width, canvas.height);
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.beginPath();
  for (const mask of SHOTGUN_HAND_OVERLAY_MASKS) appendPolygon(ctx, mask.points);
  ctx.clip();
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  texture.refresh();
  return texture;
}

export function bakeShotgunHandOverlayTextures(scene, image, frames) {
  for (const frame of frames) bakeShotgunHandOverlayTexture(scene, image, frame.handOverlayKey);
  return frames;
}

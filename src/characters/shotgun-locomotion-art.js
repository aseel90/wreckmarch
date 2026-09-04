/* WRECKMARCH — Wrecker production locomotion art.
 * Mirrors the Runner runtime path: raster payload -> Image -> Phaser Canvas Texture.
 * Approved SVG wrappers are read only as text containers; Safari never decodes them as SVG textures.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=2';

const FRAME_DATA = Object.freeze([
  ...SHOTGUN_RUNTIME_PRESENTATION.body.idle,
  ...SHOTGUN_RUNTIME_PRESENTATION.body.run
].map((frame, index) => Object.freeze({
  key: frame.key,
  path: frame.path,
  cacheKey: `wrecker-body-source-${index}`
})));

function extractPngBase64(svg, key) {
  const match = String(svg || '').match(/href=["']data:image\/png;base64,([^"']+)["']/i);
  if (!match?.[1]) throw new Error(`Wrecker frame wrapper is missing embedded PNG raster: ${key}`);
  return match[1];
}

function imageFromBase64(base64, label) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Wrecker locomotion frame decode failed: ${label}`));
    image.src = `data:image/png;base64,${base64}`;
  });
}

function installFrameTexture(scene, image, key) {
  const canvas = SHOTGUN_RUNTIME_PRESENTATION.body.canvas;
  if (image.width !== canvas.width || image.height !== canvas.height) {
    throw new Error(`Wrecker frame dimensions drifted: ${key} (${image.width}x${image.height})`);
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, canvas.width, canvas.height);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  texture.refresh();
}

export function listShotgunLocomotionData() {
  return FRAME_DATA;
}

export function loadShotgunLocomotionArt(scene) {
  const missing = FRAME_DATA.filter(frame => !scene?.textures?.exists?.(frame.key));
  if (missing.length === 0) return Promise.resolve(SHOTGUN_RUNTIME_PRESENTATION);
  if (!scene?.load?.text || !scene?.load?.once || !scene?.load?.start || !scene?.cache?.text) {
    return Promise.reject(new Error('Wrecker locomotion art requires Phaser text-loader and text-cache boundaries'));
  }

  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed || !missing.some(frame => frame.cacheKey === file?.key)) return;
      failed = true;
      reject(new Error(`Wrecker locomotion asset failed: ${file?.key || 'unknown'}`));
    };

    scene.load.on?.('loaderror', fail);
    scene.load.once('complete', async () => {
      scene.load.off?.('loaderror', fail);
      if (failed) return;
      try {
        const images = await Promise.all(missing.map(async frame => {
          const wrapper = scene.cache.text.get(frame.cacheKey) || '';
          return imageFromBase64(extractPngBase64(wrapper, frame.key), frame.key);
        }));
        images.forEach((image, index) => installFrameTexture(scene, image, missing[index].key));
        missing.forEach(frame => scene.cache.text.remove(frame.cacheKey));
        resolve(SHOTGUN_RUNTIME_PRESENTATION);
      } catch (error) {
        reject(error);
      }
    });

    for (const frame of missing) scene.load.text(frame.cacheKey, frame.path);
    scene.load.start();
  });
}

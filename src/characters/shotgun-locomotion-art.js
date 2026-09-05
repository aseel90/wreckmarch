/* WRECKMARCH — Wrecker production locomotion art.
 * Approved SVG wrappers are read only as text containers; Safari never decodes them as SVG textures.
 * Run frames are baked once as complete CanvasTextures from idle-0, then runtime animation
 * swaps full-body frames only.
 */
import { SHOTGUN_RUNTIME_PRESENTATION } from './shotgun-runtime-presentation.js?v=3';
import { bakeShotgunRunTextures } from './shotgun-baked-locomotion.js?v=1';

const IDLE_DATA = Object.freeze(SHOTGUN_RUNTIME_PRESENTATION.body.idle.map((frame, index) => Object.freeze({
  ...frame,
  cacheKey: `wrecker-body-idle-source-${index}`
})));
const RUN_DATA = Object.freeze(SHOTGUN_RUNTIME_PRESENTATION.body.run);
const BAKE_SOURCE = Object.freeze({
  path: SHOTGUN_RUNTIME_PRESENTATION.body.runBakeSource,
  cacheKey: 'wrecker-body-run-bake-source'
});

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
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  texture.refresh();
}

export function listShotgunLocomotionData() {
  return Object.freeze([...IDLE_DATA, ...RUN_DATA]);
}

export function loadShotgunLocomotionArt(scene) {
  const missingIdle = IDLE_DATA.filter(frame => !scene?.textures?.exists?.(frame.key));
  const missingRun = RUN_DATA.filter(frame => !scene?.textures?.exists?.(frame.key));
  if (missingIdle.length === 0 && missingRun.length === 0) return Promise.resolve(SHOTGUN_RUNTIME_PRESENTATION);
  if (!scene?.load?.text || !scene?.load?.once || !scene?.load?.start || !scene?.cache?.text) {
    return Promise.reject(new Error('Wrecker locomotion art requires Phaser text-loader and text-cache boundaries'));
  }

  const sources = new Map();
  for (const frame of missingIdle) sources.set(frame.path, { path: frame.path, cacheKey: frame.cacheKey });
  if (missingRun.length) sources.set(BAKE_SOURCE.path, BAKE_SOURCE);
  const sourceList = [...sources.values()];

  return new Promise((resolve, reject) => {
    let failed = false;
    const sourceKeys = new Set(sourceList.map(source => source.cacheKey));
    const fail = file => {
      if (failed || !sourceKeys.has(file?.key)) return;
      failed = true;
      reject(new Error(`Wrecker locomotion asset failed: ${file?.key || 'unknown'}`));
    };

    scene.load.on?.('loaderror', fail);
    scene.load.once('complete', async () => {
      scene.load.off?.('loaderror', fail);
      if (failed) return;
      try {
        const images = new Map();
        await Promise.all(sourceList.map(async source => {
          const wrapper = scene.cache.text.get(source.cacheKey) || '';
          const image = await imageFromBase64(extractPngBase64(wrapper, source.cacheKey), source.cacheKey);
          images.set(source.path, image);
        }));
        for (const frame of missingIdle) installFrameTexture(scene, images.get(frame.path), frame.key);
        if (missingRun.length) bakeShotgunRunTextures(scene, images.get(BAKE_SOURCE.path), RUN_DATA);
        sourceList.forEach(source => scene.cache.text.remove(source.cacheKey));
        resolve(SHOTGUN_RUNTIME_PRESENTATION);
      } catch (error) {
        reject(error);
      }
    });

    sourceList.forEach(source => scene.load.text(source.cacheKey, source.path));
    scene.load.start();
  });
}

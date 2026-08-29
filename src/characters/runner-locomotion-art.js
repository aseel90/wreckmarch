/* WRECKMARCH — Hunter production locomotion art (2 idle + 3 approved run frames) */
const OUTPUT_WIDTH = 128;
const OUTPUT_HEIGHT = 148;
const TARGET_WIDTH = 104;
const TARGET_HEIGHT = 132;
const BASELINE_Y = 140;

function getOpaqueBounds(image) {
  const scan = document.createElement('canvas');
  scan.width = image.width;
  scan.height = image.height;
  const scanCtx = scan.getContext('2d', { willReadFrequently: true });
  scanCtx.drawImage(image, 0, 0);
  const pixels = scanCtx.getImageData(0, 0, scan.width, scan.height).data;

  let minX = scan.width;
  let minY = scan.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < scan.height; y += 2) {
    for (let x = 0; x < scan.width; x += 2) {
      if (pixels[(y * scan.width + x) * 4 + 3] < 10) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error('Hunter locomotion source is fully transparent');
  }

  return {
    minX,
    minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

function getFitScale(image) {
  const bounds = getOpaqueBounds(image);
  return Math.min(TARGET_WIDTH / bounds.width, TARGET_HEIGHT / bounds.height);
}

function installNormalizedImage(scene, image, targetKey, scale) {
  if (scene.textures.exists(targetKey)) scene.textures.remove(targetKey);

  const bounds = getOpaqueBounds(image);
  const drawW = Math.max(1, Math.round(bounds.width * scale));
  const drawH = Math.max(1, Math.round(bounds.height * scale));
  const drawX = Math.round((OUTPUT_WIDTH - drawW) / 2);
  const drawY = BASELINE_Y - drawH;

  const texture = scene.textures.createCanvas(targetKey, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  ctx.drawImage(
    image,
    bounds.minX,
    bounds.minY,
    bounds.width,
    bounds.height,
    drawX,
    drawY,
    drawW,
    drawH
  );
  texture.refresh();
}

function getTextureImage(scene, sourceKey) {
  const image = scene.textures.get(sourceKey)?.getSourceImage?.();
  if (!image) throw new Error(`Hunter locomotion source unavailable: ${sourceKey}`);
  return image;
}

function imageFromBase64(base64, label) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Hunter run frame decode failed: ${label}`));
    image.src = `data:image/webp;base64,${base64}`;
  });
}

function readTextParts(scene, keys, label) {
  const payload = keys.map(key => scene.cache.text.get(key)?.trim() || '').join('');
  if (!payload) throw new Error(`Hunter run frame data unavailable: ${label}`);
  return payload;
}

export function loadRunnerLocomotionArt(scene) {
  const idleSourceKeys = ['hunter-idle-source-0', 'hunter-idle-source-1'];
  const idleKeys = ['hunter-idle-0', 'hunter-idle-1'];
  const runKeys = ['hunter-run-0', 'hunter-run-1', 'hunter-run-2'];
  const runDataKeys = [
    ['hunter-run-data-0'],
    ['hunter-run-data-1a', 'hunter-run-data-1b'],
    ['hunter-run-data-2']
  ];
  const outputKeys = [...idleKeys, ...runKeys];
  if (outputKeys.every(key => scene.textures.exists(key))) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Hunter locomotion asset failed: ${file?.key || 'unknown'}`));
    };

    scene.load.once('loaderror', fail);
    scene.load.once('complete', async () => {
      scene.load.off('loaderror', fail);
      if (failed) return;

      try {
        const idleImages = idleSourceKeys.map(key => getTextureImage(scene, key));
        const idleScale = getFitScale(idleImages[0]);
        idleImages.forEach((image, index) => installNormalizedImage(scene, image, idleKeys[index], idleScale));

        const runPayloads = runDataKeys.map((keys, index) => readTextParts(scene, keys, `run ${index + 1}`));
        const runImages = await Promise.all(runPayloads.map((payload, index) => imageFromBase64(payload, `run ${index + 1}`)));
        const runScale = getFitScale(runImages[0]);
        runImages.forEach((image, index) => installNormalizedImage(scene, image, runKeys[index], runScale));

        idleSourceKeys.forEach(key => scene.textures.remove(key));
        runDataKeys.flat().forEach(key => scene.cache.text.remove(key));
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    scene.load.image(idleSourceKeys[0], 'assets/hero/idle-gun/idle_gun_01.png.png');
    scene.load.image(idleSourceKeys[1], 'assets/hero/idle-gun/idle_gun_02.png.png');
    scene.load.text(runDataKeys[0][0], 'assets/hero/run-gun/run_gun_01.b64');
    scene.load.text(runDataKeys[1][0], 'assets/hero/run-gun/run_gun_02a.b64');
    scene.load.text(runDataKeys[1][1], 'assets/hero/run-gun/run_gun_02b.b64');
    scene.load.text(runDataKeys[2][0], 'assets/hero/run-gun/run_gun_03.b64');
    scene.load.start();
  });
}

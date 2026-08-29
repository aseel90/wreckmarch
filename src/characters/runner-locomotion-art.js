/* WRECKMARCH — Hunter production locomotion art (2 idle + 3 approved run frames) */
const DEFS = `
<defs>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9ba4a6"/><stop offset=".5" stop-color="#51595c"/><stop offset="1" stop-color="#272c2e"/></linearGradient>
  <linearGradient id="rust" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b56a3c"/><stop offset=".52" stop-color="#7b3f26"/><stop offset="1" stop-color="#442319"/></linearGradient>
  <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6a4632"/><stop offset="1" stop-color="#35271f"/></linearGradient>
  <radialGradient id="eye"><stop stop-color="#eaffff"/><stop offset=".38" stop-color="#62e8f1"/><stop offset="1" stop-color="#168999"/></radialGradient>
</defs>`;

function hunterSvg({ stride = 0, idle = 0 } = {}) {
  const strideAbs = Math.abs(stride);
  const bob = idle ? idle * 1.4 : (strideAbs > .75 ? 2 : strideAbs > .2 ? 0 : -1);
  const frontLeg = 15 * stride;
  const backLeg = -frontLeg;
  const arm = -9 * stride;
  const scarf = 5 + 5 * strideAbs;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 148">${DEFS}
  <ellipse cx="63" cy="140" rx="31" ry="6" fill="#000" opacity=".22"/>
  <g transform="translate(0 ${bob})" stroke="#211916" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M43 54 C27 ${51-scarf} 17 ${54-scarf} 7 ${62-scarf} C19 ${65-scarf} 30 ${70-scarf} 47 67Z" fill="#762f29"/>
    <path d="M45 62 C29 ${63+scarf/2} 18 ${72+scarf/2} 11 ${81+scarf/2} C26 79 37 79 50 71Z" fill="#51231f"/>
    <g transform="translate(${backLeg*.48} 0)"><path d="M67 99L83 102 87 127 75 132 64 111Z" fill="#313336"/><path d="M70 119L84 119 88 127 77 132 67 126Z" fill="url(#steel)"/><path d="M72 126L91 125 96 136 72 140 64 134Z" fill="#4b3427"/></g>
    <g transform="translate(${frontLeg*.48} 0)"><path d="M45 99L61 102 58 128 44 132 37 110Z" fill="#39393a"/><path d="M41 119L57 119 59 128 47 132 38 126Z" fill="url(#steel)"/><path d="M41 126L61 126 66 137 39 140 32 134Z" fill="#51382a"/></g>
    <path d="M36 59Q44 50 55 49L77 50Q90 54 94 68L89 103Q68 111 42 104L33 71Z" fill="url(#cloth)"/>
    <path d="M47 61L80 61 84 98Q65 104 46 98Z" fill="#24292b"/>
    <path d="M49 61L78 95M79 60L50 94" fill="none" stroke="#9a6842" stroke-width="4"/>
    <path d="M39 91H89" stroke="#211a17" stroke-width="7"/><rect x="57" y="87" width="15" height="11" rx="2" fill="url(#rust)"/>
    <g transform="rotate(${arm/2} 34 70)"><path d="M38 61Q26 64 23 76L19 96 34 101 43 76Z" fill="#594131"/><path d="M18 91L35 92 36 103Q25 109 17 100Z" fill="url(#steel)"/><circle cx="26" cy="100" r="6" fill="#302723"/></g>
    <g transform="rotate(${-arm/2} 93 70)"><path d="M89 61Q102 64 104 76L109 96 94 101 85 76Z" fill="#4f3a2e"/><path d="M93 91L110 92 111 102Q101 108 92 101Z" fill="url(#steel)"/><circle cx="101" cy="100" r="6" fill="#302723"/></g>
    <path d="M82 56Q99 56 106 68L100 80 87 75 79 63Z" fill="url(#steel)"/>
    <path d="M88 60L100 66 95 72" fill="none" stroke="#a65032" stroke-width="2"/>
    <circle cx="96" cy="67" r="3" fill="#b74734" stroke="none"/>
    <path d="M99 59L104 53M102 66L110 64M98 74L104 80" stroke="#8b9395" stroke-width="3"/>
    <path d="M42 50Q64 44 86 50L89 63Q65 71 39 61Z" fill="#6f2925"/>
    <path d="M45 54Q64 49 84 53L84 59Q64 65 43 58Z" fill="#8e3830" stroke="none"/>
    <path d="M38 38Q38 13 57 8Q76 4 91 24L91 47Q83 57 64 58Q46 57 37 47Z" fill="#59402f"/>
    <path d="M43 35Q45 17 60 13Q75 11 86 27L84 47Q73 52 63 52Q50 52 42 45Z" fill="#3a2c24"/>
    <path d="M42 27L48 16M80 17L86 31M59 11L61 19" stroke="#79543a" stroke-width="3" opacity=".8"/>
    <path d="M45 36Q63 29 82 36L84 51Q75 60 64 61Q52 60 43 51Z" fill="#252b2d"/>
    <path d="M56 43L64 38 73 43 72 53 64 57 56 53Z" fill="url(#steel)"/>
    <circle cx="50" cy="49" r="6" fill="#303638"/><circle cx="78" cy="49" r="6" fill="#303638"/>
    <circle cx="50" cy="49" r="3" fill="#141819"/><circle cx="78" cy="49" r="3" fill="#141819"/>
    <path d="M59 48H69M61 52H67" stroke="#191d1f" stroke-width="2"/>
    <path d="M46 32Q53 27 59 31L58 39Q51 42 46 38Z" fill="url(#eye)" stroke="#5f4935" stroke-width="2"/>
    <path d="M69 31Q76 27 82 32L81 38Q75 42 69 39Z" fill="url(#eye)" stroke="#5f4935" stroke-width="2"/>
    <circle cx="53" cy="34" r="1.6" fill="#fff" stroke="none" opacity=".75"/><circle cx="76" cy="34" r="1.6" fill="#fff" stroke="none" opacity=".75"/>
    <rect x="35" y="83" width="8" height="13" rx="2" fill="#654126"/><rect x="84" y="82" width="8" height="13" rx="2" fill="#654126"/>
  </g></svg>`;
}

function getOpaqueBounds(image) {
  const scan = document.createElement('canvas');
  scan.width = image.width;
  scan.height = image.height;
  const scanCtx = scan.getContext('2d', { willReadFrequently: true });
  scanCtx.drawImage(image, 0, 0);
  const pixels = scanCtx.getImageData(0, 0, scan.width, scan.height).data;

  let minX = scan.width, minY = scan.height, maxX = -1, maxY = -1;
  for (let y = 0; y < scan.height; y += 2) {
    for (let x = 0; x < scan.width; x += 2) {
      if (pixels[(y * scan.width + x) * 4 + 3] < 10) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('Hunter locomotion source is fully transparent');
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function installNormalizedTexture(scene, sourceKey, targetKey, scale) {
  if (scene.textures.exists(targetKey)) scene.textures.remove(targetKey);
  const sourceTexture = scene.textures.get(sourceKey);
  const image = sourceTexture?.getSourceImage?.();
  if (!image) throw new Error(`Hunter locomotion source unavailable: ${sourceKey}`);

  const bounds = getOpaqueBounds(image);
  const drawW = Math.max(1, Math.round(bounds.width * scale));
  const drawH = Math.max(1, Math.round(bounds.height * scale));
  const drawX = Math.round((128 - drawW) / 2);
  const drawY = 140 - drawH;

  const texture = scene.textures.createCanvas(targetKey, 128, 148);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, 128, 148);
  ctx.drawImage(image, bounds.minX, bounds.minY, bounds.width, bounds.height, drawX, drawY, drawW, drawH);
  texture.refresh();
}

export function loadRunnerLocomotionArt(scene) {
  const idleSourceKeys = ['hunter-idle-source-0', 'hunter-idle-source-1'];
  const runSourceKeys = ['hunter-run-source-0', 'hunter-run-source-1', 'hunter-run-source-2'];
  const idleKeys = ['hunter-idle-0', 'hunter-idle-1'];
  const runKeys = ['hunter-run-0', 'hunter-run-1', 'hunter-run-2'];
  const keys = [...idleKeys, ...runKeys];
  if (keys.every(key => scene.textures.exists(key))) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Hunter locomotion asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      if (failed) return;
      try {
        const idleReference = scene.textures.get(idleSourceKeys[0])?.getSourceImage?.();
        if (!idleReference) throw new Error('Hunter idle reference unavailable');
        const referenceBounds = getOpaqueBounds(idleReference);
        const scale = Math.min(104 / referenceBounds.width, 132 / referenceBounds.height);

        idleSourceKeys.forEach((sourceKey, index) => installNormalizedTexture(scene, sourceKey, idleKeys[index], scale));
        runSourceKeys.forEach((sourceKey, index) => installNormalizedTexture(scene, sourceKey, runKeys[index], scale));
        [...idleSourceKeys, ...runSourceKeys].forEach(key => scene.textures.remove(key));
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    scene.load.image(idleSourceKeys[0], 'assets/hero/idle-gun/idle_gun_01.png.png');
    scene.load.image(idleSourceKeys[1], 'assets/hero/idle-gun/idle_gun_02.png.png');
    scene.load.svg(runSourceKeys[0], 'assets/hero/run-gun/run_gun_01.svg');
    scene.load.svg(runSourceKeys[1], 'assets/hero/run-gun/run_gun_02.svg');
    scene.load.svg(runSourceKeys[2], 'assets/hero/run-gun/run_gun_03.svg');
    scene.load.start();
  });
}

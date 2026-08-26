import {
  SCRAP_RAT_RUN_FRAME_COUNT,
  SCRAP_RAT_RUN_MASTER_DATA
} from './scrap-rat-asset.js?v=5';

const RUN_TEXTURES = Object.freeze(
  Array.from({ length: SCRAP_RAT_RUN_FRAME_COUNT }, (_, index) => `scrap-rat-run-master-${index}`)
);

export const SCRAP_RAT_VISUAL = Object.freeze({
  runTextures: RUN_TEXTURES,
  animations: Object.freeze({
    idle: 'scrap-rat-idle',
    run: 'scrap-rat-run'
  }),
  scale: Object.freeze({ normal: .69, elite: .84 })
});

function loadMasterRunFrames(scene) {
  if (scene.__scrapRatMasterAssetVersion !== 'production-v5') {
    RUN_TEXTURES.forEach(key => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
    });
  }

  const missing = RUN_TEXTURES
    .map((key, index) => ({ key, uri: SCRAP_RAT_RUN_MASTER_DATA[index] }))
    .filter(({ key }) => !scene.textures.exists(key));

  if (!missing.length) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    const keys = new Set(missing.map(({ key }) => key));
    const fail = file => {
      if (settled || !keys.has(file?.key)) return;
      settled = true;
      scene.load.off('complete', complete);
      reject(new Error(`Static Scrap Rat master frame failed to load: ${file.key}`));
    };
    const complete = () => {
      if (settled) return;
      settled = true;
      scene.load.off('loaderror', fail);
      resolve();
    };

    scene.load.once('loaderror', fail);
    scene.load.once('complete', complete);
    missing.forEach(({ key, uri }) => scene.load.image(key, uri));
    scene.load.start();
  });
}

function replaceTextureAnimation(scene, key, textureKeys, frameRate, repeat) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames: textureKeys.map(textureKey => ({ key: textureKey })),
    frameRate,
    repeat
  });
}

function installAnimations(scene) {
  replaceTextureAnimation(scene, SCRAP_RAT_VISUAL.animations.idle, RUN_TEXTURES.slice(0, 2), 3, -1);
  replaceTextureAnimation(scene, SCRAP_RAT_VISUAL.animations.run, RUN_TEXTURES, 8, -1);
  // Legacy gameplay still asks for rat-run during spawn. Keep that key mapped to the static master cycle.
  replaceTextureAnimation(scene, 'rat-run', RUN_TEXTURES, 8, -1);
}

export function tuneScrapRatVisual(enemy) {
  if (!enemy?.active) return enemy;
  const elite = Boolean(enemy.elite);
  enemy.__scrapRatStrideTween?.stop?.();
  enemy.__scrapRatStrideTween = null;
  enemy.stop?.();
  enemy.clearTint?.();
  enemy.setAlpha?.(1);
  enemy.setTexture(RUN_TEXTURES[0]);
  enemy.setOrigin(.5, .58).setScale(elite ? SCRAP_RAT_VISUAL.scale.elite : SCRAP_RAT_VISUAL.scale.normal);
  enemy.__scrapRatVisual = true;
  enemy.__scrapRatVisualVersion = 'production-v5';
  enemy.__scrapRatStaticMaster = true;
  enemy.play(SCRAP_RAT_VISUAL.animations.run, true);
  return enemy;
}

function installSpawnVisuals(scene) {
  const currentSpawn = scene.spawnEnemy;
  if (currentSpawn?.__scrapRatVisualWrapperVersion === 'static-master-v5') return;
  const baseSpawn = currentSpawn.bind(scene);
  const wrappedSpawn = function(elite = false) {
    const before = new Set(this.enemies.getChildren());
    const result = baseSpawn(elite);
    this.enemies.children.iterate(enemy => {
      if (enemy?.active && !before.has(enemy)) tuneScrapRatVisual(enemy);
    });
    return result;
  };
  wrappedSpawn.__scrapRatVisualWrapper = true;
  wrappedSpawn.__scrapRatVisualWrapperVersion = 'static-master-v5';
  scene.spawnEnemy = wrappedSpawn;
}

export async function installScrapRatVisuals(scene) {
  await loadMasterRunFrames(scene);
  scene.__scrapRatMasterAssetVersion = 'production-v5';
  installAnimations(scene);
  scene.enemies.children.iterate(tuneScrapRatVisual);
  installSpawnVisuals(scene);
  scene.__scrapRatVisualReady = true;
  scene.__scrapRatStaticMaster = true;
  window.__WM_SCRAP_RAT_VISUAL__ = true;
  document.documentElement.dataset.wreckmarchScrapRatVisual = 'production-master';
  window.__WM_LOG__?.('Production Scrap Rat active: clean baked 2-pose scuttle; complete silhouettes and alpha-bled tail edges');
  return true;
}

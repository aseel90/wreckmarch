import {
  SCRAP_RAT_FRAME_COUNT,
  SCRAP_RAT_FRAME_SIZE,
  SCRAP_RAT_SHEET_DATA_URI
} from './scrap-rat-asset.js?v=1';

const STABLE_RUN_TEXTURES = Object.freeze([
  'scrap-rat-run-stable-0',
  'scrap-rat-run-stable-1',
  'scrap-rat-run-stable-2',
  'scrap-rat-run-stable-3'
]);

export const SCRAP_RAT_VISUAL = Object.freeze({
  texture: 'scrap-rat-sheet',
  stableRunTextures: STABLE_RUN_TEXTURES,
  frameSize: SCRAP_RAT_FRAME_SIZE,
  frameCount: SCRAP_RAT_FRAME_COUNT,
  frames: Object.freeze({
    idle: Object.freeze([0, 1]),
    run: Object.freeze([2, 3, 4, 5]),
    hit: Object.freeze([6, 7]),
    death: Object.freeze([8, 9, 10, 11])
  }),
  animations: Object.freeze({
    idle: 'scrap-rat-idle',
    run: 'scrap-rat-run',
    hit: 'scrap-rat-hit',
    death: 'scrap-rat-death'
  }),
  scale: Object.freeze({ normal: .69, elite: .84 })
});

function loadSheet(scene) {
  if (scene.textures.exists(SCRAP_RAT_VISUAL.texture)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = file => {
      if (settled || file?.key !== SCRAP_RAT_VISUAL.texture) return;
      settled = true;
      scene.load.off('complete', complete);
      reject(new Error('Production Scrap Rat sprite sheet failed to load'));
    };
    const complete = () => {
      if (settled) return;
      settled = true;
      scene.load.off('loaderror', fail);
      resolve();
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', complete);
    scene.load.spritesheet(SCRAP_RAT_VISUAL.texture, SCRAP_RAT_SHEET_DATA_URI, {
      frameWidth: SCRAP_RAT_FRAME_SIZE,
      frameHeight: SCRAP_RAT_FRAME_SIZE,
      endFrame: SCRAP_RAT_FRAME_COUNT - 1
    });
    scene.load.start();
  });
}

const clampByte = value => Math.max(0, Math.min(255, Math.round(value)));

function normalizeRunPalette(canvasTexture) {
  const context = canvasTexture.getContext();
  const imageData = context.getImageData(0, 0, SCRAP_RAT_FRAME_SIZE, SCRAP_RAT_FRAME_SIZE);
  const pixels = imageData.data;
  let count = 0;
  let sum = 0;
  let sumSquares = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] <= 32) continue;
    const luma = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
    count += 1;
    sum += luma;
    sumSquares += luma * luma;
  }

  if (!count) return;
  const mean = sum / count;
  const variance = Math.max(1, sumSquares / count - mean * mean);
  const deviation = Math.sqrt(variance);

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] <= 32) continue;
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const luma = .2126 * red + .7152 * green + .0722 * blue;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const saturation = max > 0 ? (max - min) / max : 0;
    const tone = Math.max(38, Math.min(205, 110 + ((luma - mean) / deviation) * 30));
    const accent = Math.max(0, Math.min(.22, (saturation - .18) * .32));
    pixels[i] = clampByte(tone * (1 - accent) + 190 * accent);
    pixels[i + 1] = clampByte(tone * .99 * (1 - accent) + 142 * accent);
    pixels[i + 2] = clampByte(tone * (1 - accent) + 174 * accent);
  }

  context.putImageData(imageData, 0, 0);
  canvasTexture.refresh();
}

function installStableRunTextures(scene) {
  SCRAP_RAT_VISUAL.frames.run.forEach((sourceFrame, index) => {
    const key = STABLE_RUN_TEXTURES[index];
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, SCRAP_RAT_FRAME_SIZE, SCRAP_RAT_FRAME_SIZE);
    if (!texture) throw new Error(`Could not create ${key}`);
    texture.drawFrame(SCRAP_RAT_VISUAL.texture, sourceFrame, 0, 0);
    normalizeRunPalette(texture);
  });
}

function replaceSheetAnimation(scene, key, frames, frameRate, repeat) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames: frames.map(frame => ({ key: SCRAP_RAT_VISUAL.texture, frame })),
    frameRate,
    repeat
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
  replaceSheetAnimation(scene, SCRAP_RAT_VISUAL.animations.idle, SCRAP_RAT_VISUAL.frames.idle, 3, -1);
  replaceTextureAnimation(scene, SCRAP_RAT_VISUAL.animations.run, STABLE_RUN_TEXTURES, 11, -1);
  replaceSheetAnimation(scene, SCRAP_RAT_VISUAL.animations.hit, SCRAP_RAT_VISUAL.frames.hit, 16, 0);
  replaceSheetAnimation(scene, SCRAP_RAT_VISUAL.animations.death, SCRAP_RAT_VISUAL.frames.death, 10, 0);
  // Legacy gameplay still asks for rat-run during spawn. Keep it mapped to the grounded production cycle.
  replaceTextureAnimation(scene, 'rat-run', STABLE_RUN_TEXTURES, 11, -1);
}

export function tuneScrapRatVisual(enemy) {
  if (!enemy?.active) return enemy;
  const elite = Boolean(enemy.elite);
  enemy.__scrapRatStrideTween?.stop?.();
  enemy.__scrapRatStrideTween = null;
  enemy.stop?.();
  enemy.clearTint?.();
  enemy.setAlpha?.(1);
  enemy.setTexture(STABLE_RUN_TEXTURES[0]);
  enemy.setOrigin(.5, .58).setScale(elite ? SCRAP_RAT_VISUAL.scale.elite : SCRAP_RAT_VISUAL.scale.normal);
  enemy.__scrapRatVisual = true;
  enemy.__scrapRatVisualVersion = 'production-v3';
  enemy.play(SCRAP_RAT_VISUAL.animations.run, true);
  return enemy;
}

function installSpawnVisuals(scene) {
  const currentSpawn = scene.spawnEnemy;
  if (currentSpawn?.__scrapRatVisualWrapper === true) return;
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
  scene.spawnEnemy = wrappedSpawn;
}

function spawnDeathVisual(scene, enemy, state) {
  const fx = scene.add.sprite(state.x, state.y, SCRAP_RAT_VISUAL.texture, SCRAP_RAT_VISUAL.frames.death[0])
    .setDepth(state.depth)
    .setOrigin(.5, .58)
    .setScale(state.scale)
    .setFlipX(state.flipX)
    .setRotation(state.rotation);
  fx.play(SCRAP_RAT_VISUAL.animations.death, true);
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    fx.destroy();
  };
  fx.once('animationcomplete', remove);
  scene.time.delayedCall(650, remove);
  enemy.setVisible(false);
}

function installHitAndDeathVisuals(scene) {
  if (scene.__scrapRatCombatVisualsInstalled) return;
  scene.__scrapRatCombatVisualsInstalled = true;
  const baseHit = scene.onBulletHit.bind(scene);
  scene.onBulletHit = function(bullet, enemy) {
    if (!enemy?.__scrapRatVisual || !bullet?.active || !enemy?.active) return baseHit(bullet, enemy);
    const incomingDamage = bullet.damage ?? this.damage;
    const lethal = enemy.hp - incomingDamage <= 0;
    const deathState = lethal ? {
      x: enemy.x,
      y: enemy.y,
      depth: enemy.depth ?? 12,
      scale: Math.abs(enemy.scaleX || (enemy.elite ? SCRAP_RAT_VISUAL.scale.elite : SCRAP_RAT_VISUAL.scale.normal)),
      flipX: Boolean(enemy.flipX),
      rotation: enemy.rotation || 0
    } : null;

    const result = baseHit(bullet, enemy);
    if (lethal && deathState) {
      spawnDeathVisual(this, enemy, deathState);
      return result;
    }
    if (enemy?.active && enemy.hp > 0) {
      enemy.play(SCRAP_RAT_VISUAL.animations.hit, true);
      this.time.delayedCall(135, () => {
        if (enemy?.active && enemy.hp > 0) enemy.play(SCRAP_RAT_VISUAL.animations.run, true);
      });
    }
    return result;
  };
}

export async function installScrapRatVisuals(scene) {
  await loadSheet(scene);
  installStableRunTextures(scene);
  installAnimations(scene);
  scene.enemies.children.iterate(tuneScrapRatVisual);
  installSpawnVisuals(scene);
  installHitAndDeathVisuals(scene);
  scene.__scrapRatVisualReady = true;
  window.__WM_SCRAP_RAT_VISUAL__ = true;
  document.documentElement.dataset.wreckmarchScrapRatVisual = 'production';
  window.__WM_LOG__?.('Production Scrap Rat active: grounded 4-pose stable-palette scuttle cycle');
  return true;
}

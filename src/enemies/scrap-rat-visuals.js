import {
  SCRAP_RAT_FRAME_COUNT,
  SCRAP_RAT_FRAME_SIZE,
  SCRAP_RAT_SHEET_DATA_URI
} from './scrap-rat-asset.js?v=1';

export const SCRAP_RAT_VISUAL = Object.freeze({
  texture: 'scrap-rat-sheet',
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
  scale: Object.freeze({ normal: .69, elite: .84 }),
  hitRadius: Object.freeze({ normal: 25, elite: 30 })
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

function replaceAnimation(scene, key, frames, frameRate, repeat) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames: frames.map(frame => ({ key: SCRAP_RAT_VISUAL.texture, frame })),
    frameRate,
    repeat
  });
}

function installAnimations(scene) {
  replaceAnimation(scene, SCRAP_RAT_VISUAL.animations.idle, SCRAP_RAT_VISUAL.frames.idle, 3, -1);
  replaceAnimation(scene, SCRAP_RAT_VISUAL.animations.run, SCRAP_RAT_VISUAL.frames.run, 12, -1);
  replaceAnimation(scene, SCRAP_RAT_VISUAL.animations.hit, SCRAP_RAT_VISUAL.frames.hit, 16, 0);
  replaceAnimation(scene, SCRAP_RAT_VISUAL.animations.death, SCRAP_RAT_VISUAL.frames.death, 10, 0);
  // Legacy gameplay still asks for rat-run during spawn. Make that key point at the production art too.
  replaceAnimation(scene, 'rat-run', SCRAP_RAT_VISUAL.frames.run, 12, -1);
}

export function tuneScrapRatVisual(enemy) {
  if (!enemy?.active) return enemy;
  const elite = Boolean(enemy.elite);
  enemy.stop?.();
  enemy.setTexture(SCRAP_RAT_VISUAL.texture, SCRAP_RAT_VISUAL.frames.run[0]);
  enemy.setOrigin(.5, .58).setScale(elite ? SCRAP_RAT_VISUAL.scale.elite : SCRAP_RAT_VISUAL.scale.normal);
  enemy.hitRadius = elite ? SCRAP_RAT_VISUAL.hitRadius.elite : SCRAP_RAT_VISUAL.hitRadius.normal;
  enemy.__scrapRatVisual = true;
  enemy.__scrapRatVisualVersion = 'production-v1';
  if (enemy.body) {
    enemy.body.setCircle(31, 38, 56);
    enemy.body.updateFromGameObject?.();
  }
  enemy.play(SCRAP_RAT_VISUAL.animations.run, true);
  return enemy;
}

function installSpawnVisuals(scene) {
  if (scene.__scrapRatSpawnVisualsInstalled) return;
  scene.__scrapRatSpawnVisualsInstalled = true;
  const baseSpawn = scene.spawnEnemy.bind(scene);
  scene.spawnEnemy = function(elite = false) {
    const before = new Set(this.enemies.getChildren());
    const result = baseSpawn(elite);
    this.enemies.children.iterate(enemy => {
      if (enemy?.active && !before.has(enemy)) tuneScrapRatVisual(enemy);
    });
    return result;
  };
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
  installAnimations(scene);
  scene.enemies.children.iterate(tuneScrapRatVisual);
  installSpawnVisuals(scene);
  installHitAndDeathVisuals(scene);
  scene.__scrapRatVisualReady = true;
  window.__WM_SCRAP_RAT_VISUAL__ = true;
  document.documentElement.dataset.wreckmarchScrapRatVisual = 'production';
  window.__WM_LOG__?.('Production Scrap Rat active: 12-frame idle/run/hit/death sprite set');
  return true;
}

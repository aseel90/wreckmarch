/* WRECKMARCH — Rust Hound baked transparent master-frame runtime */

import { RUST_HOUND_RUN_0 } from './assets/rust-hound-master-run-0.js?v=1';
import { RUST_HOUND_RUN_1 } from './assets/rust-hound-master-run-1.js?v=1';
import { RUST_HOUND_RUN_2 } from './assets/rust-hound-master-run-2.js?v=1';
import { RUST_HOUND_RUN_3 } from './assets/rust-hound-master-run-3.js?v=1';
import { RUST_HOUND_RUN_4 } from './assets/rust-hound-master-run-4.js?v=1';
import { RUST_HOUND_CROUCH } from './assets/rust-hound-master-crouch.js?v=1';
import { RUST_HOUND_POUNCE } from './assets/rust-hound-master-pounce.js?v=1';
import { RUST_HOUND_RECOVER } from './assets/rust-hound-master-recover.js?v=1';

const RUST_HOUND_RUN_MASTERS = Object.freeze([
  RUST_HOUND_RUN_0,
  RUST_HOUND_RUN_1,
  RUST_HOUND_RUN_2,
  RUST_HOUND_RUN_3,
  RUST_HOUND_RUN_4
]);

const RUST_HOUND_SPECIAL_MASTERS = Object.freeze({
  crouch: RUST_HOUND_CROUCH,
  pounce: RUST_HOUND_POUNCE,
  recover: RUST_HOUND_RECOVER
});

const RUN_KEYS = Object.freeze([
  'rust-hound-run-0',
  'rust-hound-run-1',
  'rust-hound-run-2',
  'rust-hound-run-3',
  'rust-hound-run-4'
]);

const FRAME_SOURCES = Object.freeze({
  [RUN_KEYS[0]]: RUST_HOUND_RUN_MASTERS[0],
  [RUN_KEYS[1]]: RUST_HOUND_RUN_MASTERS[1],
  [RUN_KEYS[2]]: RUST_HOUND_RUN_MASTERS[2],
  [RUN_KEYS[3]]: RUST_HOUND_RUN_MASTERS[3],
  [RUN_KEYS[4]]: RUST_HOUND_RUN_MASTERS[4],
  'rust-hound-crouch': RUST_HOUND_SPECIAL_MASTERS.crouch,
  'rust-hound-pounce': RUST_HOUND_SPECIAL_MASTERS.pounce,
  'rust-hound-land': RUST_HOUND_SPECIAL_MASTERS.recover
});

const FRAME_KEYS = Object.freeze(Object.keys(FRAME_SOURCES));
const VISUAL_VERSION = 'production-v3-baked-alpha';

function loadFrames(scene) {
  const missing = FRAME_KEYS.filter(key => !scene.textures.exists(key));
  if (!missing.length) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    const keys = new Set(missing);

    const fail = file => {
      if (settled || !keys.has(file?.key)) return;
      settled = true;
      scene.load.off('complete', complete);
      reject(new Error(`Rust Hound master frame failed to load: ${file.key}`));
    };

    const complete = () => {
      if (settled) return;
      settled = true;
      scene.load.off('loaderror', fail);
      resolve();
    };

    scene.load.once('loaderror', fail);
    scene.load.once('complete', complete);
    missing.forEach(key => scene.load.image(key, FRAME_SOURCES[key]));
    scene.load.start();
  });
}

function replaceAnimation(scene, key, frames, frameRate, repeat = -1) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames: frames.map(frame => ({ key: frame })),
    frameRate,
    repeat
  });
}

function installAnimations(scene) {
  replaceAnimation(scene, 'rust-hound-run', RUN_KEYS, 12, -1);
  replaceAnimation(scene, 'rust-hound-recover', ['rust-hound-land', RUN_KEYS[0], RUN_KEYS[1]], 9, 0);
}

export function tuneRustHoundVisual(enemy) {
  if (!enemy?.active || enemy.enemyId !== 'rust-hound') return enemy;

  const elite = Boolean(enemy.elite);
  enemy.stop?.();
  enemy.setOrigin?.(.5, .63);
  enemy.setScale?.(elite ? .86 : .74);
  enemy.setAlpha?.(1);
  enemy.setTexture?.(RUN_KEYS[0]);

  if (elite && enemy.enemyDefinition?.bootstrap?.eliteTint != null) {
    enemy.setTint?.(enemy.enemyDefinition.bootstrap.eliteTint);
  } else {
    enemy.clearTint?.();
  }

  enemy.play?.('rust-hound-run', true);
  enemy.__rustHoundVisual = true;
  enemy.__rustHoundVisualVersion = VISUAL_VERSION;
  enemy.__rustHoundBakedFrames = true;
  enemy.__rustHoundTransparentMaster = true;
  return enemy;
}

function installFactoryVisualHook(scene) {
  const factory = scene.enemyFactory;
  if (!factory || factory.__rustHoundVisualHook === VISUAL_VERSION) return;

  const baseCreate = factory.create.bind(factory);
  factory.create = function(enemyId, options) {
    const enemy = baseCreate(enemyId, options);
    if (enemyId === 'rust-hound') tuneRustHoundVisual(enemy);
    return enemy;
  };

  factory.__rustHoundVisualHook = VISUAL_VERSION;
}

function runBrowserMotionSelfTest(scene) {
  const params = new URLSearchParams(location.search);
  if (params.get('houndtest') !== '1') return;

  scene.spawnEvent && (scene.spawnEvent.paused = true);
  scene.fireDelay = 999999;
  if (scene.primaryWeapon) scene.primaryWeapon.fireDelay = 999999;
  scene.lastShot = Number.MAX_SAFE_INTEGER;
  scene.bullets?.clear?.(true, true);
  scene.enemies?.clear?.(true, true);
  scene.heroHp = Math.max(9999, Number(scene.heroHp) || 0);
  scene.lastHeroHit = -999999;
  scene.hero?.setPosition?.(320, 480);
  scene.hero?.setVelocity?.(0, 0);

  const hound = scene.spawnSystem?.spawn?.('rust-hound', { elite: false });
  hound?.setPosition?.(105, 480);
  if (!hound) {
    document.documentElement.dataset.wreckmarchRustHoundTest = 'failed';
    window.__WM_RUST_HOUND_TEST__ = { ok: false, reason: 'spawn-failed' };
    return;
  }

  tuneRustHoundVisual(hound);
  hound.hp = 999999;
  hound.maxHp = 999999;
  hound.__houndMotion = null;

  setTimeout(() => {
    if (!scene?.sys?.isActive?.()) return;
    const state = hound.__houndMotion;
    const checks = {
      active: Boolean(hound.active),
      visual: hound.__rustHoundVisual === true,
      bakedFrames: hound.__rustHoundBakedFrames === true,
      transparentMaster: hound.__rustHoundTransparentMaster === true,
      behavior: hound.behaviorKey === 'hound-pounce',
      threat: hound.threatValue === 2,
      telegraph: Number(hound.__houndTelegraphCount) >= 1,
      pounced: Number(hound.__houndPounceCount) >= 1,
      pounceSpeed: Number(hound.__houndLastPounceSpeed) >= 330 && Number(hound.__houndLastPounceSpeed) <= 370,
      finiteMotion: Number.isFinite(state?.vx) && Number.isFinite(state?.vy),
      maxSpeed: Number(state?.maxObservedSpeed) >= 330 && Number(state?.maxObservedSpeed) <= 380
    };
    const ok = Object.values(checks).every(Boolean);
    window.__WM_RUST_HOUND_TEST__ = {
      ok,
      ...checks,
      phase: hound.__houndPhase,
      pounces: hound.__houndPounceCount,
      maxObservedSpeed: Math.round(state?.maxObservedSpeed || 0),
      visualVersion: hound.__rustHoundVisualVersion
    };
    document.documentElement.dataset.wreckmarchRustHoundTest = ok ? 'passed' : 'failed';
    window.__WM_LOG__?.(`Rust Hound browser motion test ${ok ? 'PASSED' : 'FAILED'}: ${JSON.stringify(window.__WM_RUST_HOUND_TEST__)}`);
  }, 3600);
}

export async function installRustHoundVisuals(scene) {
  await loadFrames(scene);
  installAnimations(scene);
  scene.enemies?.children?.iterate?.(tuneRustHoundVisual);
  installFactoryVisualHook(scene);

  scene.__rustHoundVisualReady = true;
  scene.__rustHoundVisualVersion = VISUAL_VERSION;
  window.__WM_RUST_HOUND_VISUAL__ = true;
  document.documentElement.dataset.wreckmarchRustHoundVisual = VISUAL_VERSION;

  window.__WM_LOG__?.('Rust Hound active: hand-painted baked transparent 5-frame run + crouch telegraph + pounce + recovery');

  runBrowserMotionSelfTest(scene);
  return true;
}

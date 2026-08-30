/* WRECKMARCH — Sawbug baked transparent master-frame runtime */

import { SAWBUG_IDLE_0 } from './assets/sawbug-idle-0.js?v=1';
import { SAWBUG_IDLE_1 } from './assets/sawbug-idle-1.js?v=1';
import { SAWBUG_WALK_0 } from './assets/sawbug-walk-0.js?v=1';
import { SAWBUG_WALK_1 } from './assets/sawbug-walk-1.js?v=1';
import { SAWBUG_WALK_2 } from './assets/sawbug-walk-2.js?v=1';
import { SAWBUG_WALK_3 } from './assets/sawbug-walk-3.js?v=1';
import { SAWBUG_ATTACK_0 } from './assets/sawbug-attack-0.js?v=1';
import { SAWBUG_ATTACK_1 } from './assets/sawbug-attack-1.js?v=1';
import { SAWBUG_ATTACK_2 } from './assets/sawbug-attack-2.js?v=1';
import { SAWBUG_ACID_PROJECTILE_0 } from './assets/sawbug-projectile-0.js?v=1';
import { SAWBUG_ACID_PROJECTILE_1 } from './assets/sawbug-projectile-1.js?v=1';
import { SAWBUG_ACID_SPLASH_0 } from './assets/sawbug-splash-0.js?v=1';
import { SAWBUG_ACID_SPLASH_1 } from './assets/sawbug-splash-1.js?v=1';

const IDLE_KEYS = Object.freeze(['sawbug-idle-0', 'sawbug-idle-1']);
const WALK_KEYS = Object.freeze(['sawbug-walk-0', 'sawbug-walk-1', 'sawbug-walk-2', 'sawbug-walk-3']);
const ATTACK_KEYS = Object.freeze(['sawbug-attack-0', 'sawbug-attack-1', 'sawbug-attack-2']);
const PROJECTILE_KEYS = Object.freeze(['sawbug-acid-projectile-0', 'sawbug-acid-projectile-1']);
const SPLASH_KEYS = Object.freeze(['sawbug-acid-splash-0', 'sawbug-acid-splash-1']);

const FRAME_SOURCES = Object.freeze({
  [IDLE_KEYS[0]]: SAWBUG_IDLE_0,
  [IDLE_KEYS[1]]: SAWBUG_IDLE_1,
  [WALK_KEYS[0]]: SAWBUG_WALK_0,
  [WALK_KEYS[1]]: SAWBUG_WALK_1,
  [WALK_KEYS[2]]: SAWBUG_WALK_2,
  [WALK_KEYS[3]]: SAWBUG_WALK_3,
  [ATTACK_KEYS[0]]: SAWBUG_ATTACK_0,
  [ATTACK_KEYS[1]]: SAWBUG_ATTACK_1,
  [ATTACK_KEYS[2]]: SAWBUG_ATTACK_2,
  [PROJECTILE_KEYS[0]]: SAWBUG_ACID_PROJECTILE_0,
  [PROJECTILE_KEYS[1]]: SAWBUG_ACID_PROJECTILE_1,
  [SPLASH_KEYS[0]]: SAWBUG_ACID_SPLASH_0,
  [SPLASH_KEYS[1]]: SAWBUG_ACID_SPLASH_1
});

const FRAME_KEYS = Object.freeze(Object.keys(FRAME_SOURCES));
const VISUAL_VERSION = 'production-v3-safe-windup';
const SELF_TEST_POLL_MS = 120;

export function canonicalizeBakedDataUrl(source) {
  if (typeof source !== 'string') return source;
  const comma = source.indexOf(',');
  if (comma < 0 || !source.slice(0, comma).includes(';base64')) return source;
  const prefix = source.slice(0, comma + 1);
  const payload = source.slice(comma + 1).replace(/=+$/, '');
  const padding = (4 - (payload.length % 4)) % 4;
  return `${prefix}${payload}${'='.repeat(padding)}`;
}

function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Sawbug transparent master image failed to decode'));
    image.src = canonicalizeBakedDataUrl(source);
  });
}

async function loadFrames(scene) {
  const missing = FRAME_KEYS.filter(key => !scene.textures.exists(key));
  if (!missing.length) return;

  await Promise.all(missing.map(async key => {
    const image = await loadImageSource(FRAME_SOURCES[key]);
    if (!scene.textures.exists(key)) scene.textures.addImage(key, image);
  }));
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
  replaceAnimation(scene, 'sawbug-idle', IDLE_KEYS, 3, -1);
  replaceAnimation(scene, 'sawbug-walk', WALK_KEYS, 8, -1);
  replaceAnimation(scene, 'sawbug-acid-attack', [ATTACK_KEYS[0]], 1, 0);
  replaceAnimation(scene, 'sawbug-acid-flight', PROJECTILE_KEYS, 10, -1);
  replaceAnimation(scene, 'sawbug-acid-splash', SPLASH_KEYS, 12, 0);
}

export function tuneSawbugVisual(enemy) {
  if (!enemy?.active || enemy.enemyId !== 'sawbug') return enemy;
  const elite = Boolean(enemy.elite);
  enemy.stop?.();
  enemy.clearTint?.();
  enemy.setAlpha?.(1);
  enemy.setOrigin?.(.5, .64);
  enemy.setScale?.(elite ? .82 : .70);
  enemy.setTexture?.(WALK_KEYS[0]);
  if (elite && enemy.enemyDefinition?.bootstrap?.eliteTint != null) enemy.setTint?.(enemy.enemyDefinition.bootstrap.eliteTint);
  enemy.play?.('sawbug-walk', true);
  enemy.__sawbugVisual = true;
  enemy.__sawbugVisualVersion = VISUAL_VERSION;
  enemy.__sawbugBakedFrames = true;
  enemy.__sawbugTransparentMaster = true;
  return enemy;
}

function installFactoryVisualHook(scene) {
  const factory = scene.enemyFactory;
  if (!factory || factory.__sawbugVisualHook === VISUAL_VERSION) return;
  const baseCreate = factory.create.bind(factory);
  factory.create = function(enemyId, options) {
    const enemy = baseCreate(enemyId, options);
    if (enemyId === 'sawbug') tuneSawbugVisual(enemy);
    return enemy;
  };
  factory.__sawbugVisualHook = VISUAL_VERSION;
}

function runBrowserSelfTest(scene) {
  const params = new URLSearchParams(location.search);
  if (params.get('sawbugtest') !== '1') return;

  scene.spawnEvent && (scene.spawnEvent.paused = true);
  scene.fireDelay = 999999;
  if (scene.primaryWeapon) scene.primaryWeapon.fireDelay = 999999;
  scene.lastShot = Number.MAX_SAFE_INTEGER;
  scene.bullets?.clear?.(true, true);
  scene.enemies?.clear?.(true, true);
  scene.__sawbugAcidProjectiles?.clear?.(true, true);
  scene.heroHp = Math.max(9999, Number(scene.heroHp) || 0);
  scene.hero?.setPosition?.(360, 480);
  scene.hero?.setVelocity?.(0, 0);

  const sawbug = scene.spawnSystem?.spawn?.('sawbug', { elite: false });
  sawbug?.setPosition?.(130, 480);
  if (!sawbug) {
    document.documentElement.dataset.wreckmarchSawbugTest = 'failed';
    window.__WM_SAWBUG_TEST__ = { ok: false, reason: 'spawn-failed' };
    return;
  }

  tuneSawbugVisual(sawbug);
  sawbug.hp = 999999;
  sawbug.maxHp = 999999;
  sawbug.behaviorConfig = {
    ...sawbug.behaviorConfig,
    initialCooldownMinMs: 0,
    initialCooldownMaxMs: 0,
    telegraphMs: 120
  };
  sawbug.__sawbugState = null;
  sawbug.__sawbugPhase = 'move';
  sawbug.__sawbugShotsFired = 0;
  scene.__sawbugAcidShotsSpawned = 0;
  document.documentElement.dataset.wreckmarchSawbugTest = 'running';

  const wallNow = () => globalThis.performance?.now?.() ?? Date.now();
  const startedAt = wallNow();
  let completed = false;
  const finishWhenShotObserved = () => {
    if (completed) return;
    if (!scene?.sys?.isActive?.()) {
      completed = true;
      window.__WM_SAWBUG_TEST__ = { ok: false, status: 'failed', reason: 'scene-inactive' };
      document.documentElement.dataset.wreckmarchSawbugTest = 'failed';
      return;
    }
    const checks = {
      active: Boolean(sawbug.active),
      visual: sawbug.__sawbugVisual === true,
      bakedFrames: sawbug.__sawbugBakedFrames === true,
      transparentMaster: sawbug.__sawbugTransparentMaster === true,
      behavior: sawbug.behaviorKey === 'acid-spitter',
      threat: sawbug.threatValue === 2,
      shots: Number(sawbug.__sawbugShotsFired) >= 1,
      projectileRuntime: Boolean(scene.__sawbugAcidProjectiles),
      acidSpawned: Number(scene.__sawbugAcidShotsSpawned) >= 1,
      projectileSpeed: Math.abs(Number(sawbug.__sawbugLastProjectileSpeed) - Number(sawbug.behaviorConfig?.projectileSpeed)) <= 1
    };
    const elapsed = wallNow() - startedAt;
    const ok = Object.values(checks).every(Boolean);
    const status = ok ? 'passed' : 'running';
    if (ok) completed = true;

    window.__WM_SAWBUG_TEST__ = {
      ok,
      status,
      ...checks,
      phase: sawbug.__sawbugPhase,
      elapsedMs: Math.round(elapsed),
      shotsFired: sawbug.__sawbugShotsFired,
      acidSpawned: scene.__sawbugAcidShotsSpawned,
      splashesSpawned: scene.__sawbugAcidSplashesSpawned,
      visualVersion: sawbug.__sawbugVisualVersion
    };
    document.documentElement.dataset.wreckmarchSawbugTest = status;

    if (status === 'running') {
      globalThis.setTimeout(finishWhenShotObserved, SELF_TEST_POLL_MS);
      return;
    }

    window.__WM_LOG__?.(`Sawbug browser test ${ok ? 'PASSED' : 'FAILED'}: ${JSON.stringify(window.__WM_SAWBUG_TEST__)}`);
  };
  scene.__wmSawbugSelfTestRefresh = finishWhenShotObserved;
  globalThis.setTimeout(finishWhenShotObserved, SELF_TEST_POLL_MS);
}

export async function installSawbugVisuals(scene) {
  await loadFrames(scene);
  installAnimations(scene);
  scene.enemies?.children?.iterate?.(tuneSawbugVisual);
  installFactoryVisualHook(scene);
  scene.__sawbugVisualReady = true;
  scene.__sawbugVisualVersion = VISUAL_VERSION;
  window.__WM_SAWBUG_VISUAL__ = true;
  document.documentElement.dataset.wreckmarchSawbugVisual = VISUAL_VERSION;
  window.__WM_LOG__?.('Sawbug active: 2 idle + 4 walk + safe 1-frame acid windup, separate 2-frame projectile and 2-frame splash');
  runBrowserSelfTest(scene);
  return true;
}

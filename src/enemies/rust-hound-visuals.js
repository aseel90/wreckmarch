/* WRECKMARCH — production Rust Hound vector sprite + browser motion self-test */

const FRAME_KEYS = Object.freeze([
  'rust-hound-run-0',
  'rust-hound-run-1',
  'rust-hound-run-2',
  'rust-hound-run-3',
  'rust-hound-crouch',
  'rust-hound-pounce',
  'rust-hound-land'
]);

const POSES = Object.freeze({
  'rust-hound-run-0': { bob: 0, frontA: 12, frontB: -5, rearA: -10, rearB: 7, tail: -5, head: 0, stretch: 0 },
  'rust-hound-run-1': { bob: 2, frontA: -4, frontB: 11, rearA: 7, rearB: -9, tail: 2, head: 1, stretch: 1 },
  'rust-hound-run-2': { bob: 0, frontA: -10, frontB: 6, rearA: 12, rearB: -5, tail: 6, head: 0, stretch: 0 },
  'rust-hound-run-3': { bob: -2, frontA: 5, frontB: -11, rearA: -6, rearB: 10, tail: 0, head: -1, stretch: 1 },
  'rust-hound-crouch': { bob: 7, frontA: 4, frontB: 9, rearA: -2, rearB: 3, tail: 10, head: 5, stretch: -4, crouch: true },
  'rust-hound-pounce': { bob: -3, frontA: -19, frontB: -16, rearA: 19, rearB: 16, tail: -12, head: -3, stretch: 11, pounce: true },
  'rust-hound-land': { bob: 5, frontA: 9, frontB: 4, rearA: 4, rearB: -1, tail: 5, head: 4, stretch: -2, land: true }
});

function legPath(baseX, baseY, swing, front = false) {
  const kneeX = baseX + swing * .42 + (front ? 2 : -2);
  const kneeY = baseY + 18 - Math.abs(swing) * .08;
  const footX = baseX + swing;
  const footY = baseY + 34 - Math.max(0, -swing) * .08;
  return `M ${baseX} ${baseY} Q ${kneeX} ${kneeY} ${footX} ${footY} q ${front ? 7 : -7} 1 ${front ? 10 : -10} 2`;
}

function svgForPose(pose) {
  const bob = pose.bob || 0;
  const stretch = pose.stretch || 0;
  const bodyX = 42 - stretch * .18;
  const bodyW = 63 + stretch;
  const headX = 103 + stretch * .62;
  const headY = 38 + bob + (pose.head || 0);
  const bodyY = 38 + bob;
  const rearX = bodyX + 10;
  const frontX = bodyX + bodyW - 7;
  const lower = pose.crouch ? 8 : 0;
  const bodyTop = bodyY + lower;
  const bodyBottom = bodyTop + (pose.crouch ? 24 : 29);
  const outline = '#1a1513';
  const rust = '#9c4f2f';
  const rust2 = '#c06b3c';
  const hideDark = '#5c3027';
  const metal = '#657078';
  const metalLight = '#9aa3a5';
  const glow = '#ffb148';
  const eye = '#ffd66f';
  const tailBaseX = bodyX + 3;
  const tailBaseY = bodyTop + 8;
  const tailBendX = 25;
  const tailEndX = 10;
  const tailEndY = tailBaseY - 10 + (pose.tail || 0);
  const rearA = legPath(rearX, bodyBottom - 4, pose.rearA || 0, false);
  const rearB = legPath(rearX + 12, bodyBottom - 3, pose.rearB || 0, false);
  const frontA = legPath(frontX - 9, bodyBottom - 3, pose.frontA || 0, true);
  const frontB = legPath(frontX + 2, bodyBottom - 4, pose.frontB || 0, true);
  const pounceLines = pose.pounce ? `<path d="M 8 82 L 31 82 M 2 73 L 25 73 M 16 91 L 39 91" stroke="#d9a067" stroke-width="3" opacity=".55" stroke-linecap="round"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="104" viewBox="0 0 160 104">
    <g stroke-linecap="round" stroke-linejoin="round">
      ${pounceLines}
      <path d="M ${tailBaseX} ${tailBaseY} Q ${tailBendX} ${tailBaseY - 10} ${tailEndX} ${tailEndY}" fill="none" stroke="${outline}" stroke-width="10"/>
      <path d="M ${tailBaseX} ${tailBaseY} Q ${tailBendX} ${tailBaseY - 10} ${tailEndX} ${tailEndY}" fill="none" stroke="${hideDark}" stroke-width="6"/>
      <path d="${rearB}" fill="none" stroke="${outline}" stroke-width="12"/>
      <path d="${rearB}" fill="none" stroke="${hideDark}" stroke-width="7"/>
      <path d="${frontB}" fill="none" stroke="${outline}" stroke-width="12"/>
      <path d="${frontB}" fill="none" stroke="${hideDark}" stroke-width="7"/>
      <path d="M ${bodyX + 5} ${bodyTop + 9} C ${bodyX + 13} ${bodyTop - 5}, ${bodyX + 38} ${bodyTop - 8}, ${bodyX + bodyW - 4} ${bodyTop + 2} C ${bodyX + bodyW + 5} ${bodyTop + 8}, ${bodyX + bodyW + 4} ${bodyBottom - 3}, ${bodyX + bodyW - 5} ${bodyBottom + 2} C ${bodyX + 39} ${bodyBottom + 8}, ${bodyX + 17} ${bodyBottom + 7}, ${bodyX + 4} ${bodyBottom - 1} C ${bodyX - 2} ${bodyBottom - 7}, ${bodyX - 3} ${bodyTop + 17}, ${bodyX + 5} ${bodyTop + 9} Z" fill="${rust}" stroke="${outline}" stroke-width="5"/>
      <path d="M ${bodyX + 17} ${bodyTop + 2} C ${bodyX + 31} ${bodyTop - 5}, ${bodyX + 47} ${bodyTop - 3}, ${bodyX + bodyW - 9} ${bodyTop + 4} L ${bodyX + bodyW - 17} ${bodyTop + 14} C ${bodyX + 44} ${bodyTop + 8}, ${bodyX + 30} ${bodyTop + 8}, ${bodyX + 15} ${bodyTop + 13} Z" fill="${rust2}" opacity=".82"/>
      <path d="M ${bodyX + 22} ${bodyTop + 2} l 5 -9 l 8 9 l 7 -10 l 7 11 l 7 -8 l 7 11" fill="none" stroke="${metal}" stroke-width="6"/>
      <path d="M ${bodyX + 22} ${bodyTop + 1} l 5 -7 l 8 7 l 7 -8 l 7 9 l 7 -6 l 7 9" fill="none" stroke="${metalLight}" stroke-width="2.5" opacity=".75"/>
      <path d="M ${bodyX + 20} ${bodyTop + 17} C ${bodyX + 30} ${bodyTop + 13}, ${bodyX + 44} ${bodyTop + 13}, ${bodyX + 52} ${bodyTop + 17}" fill="none" stroke="#df8b52" stroke-width="3" opacity=".65"/>
      <path d="M ${bodyX + 25} ${bodyTop + 23} C ${bodyX + 34} ${bodyTop + 19}, ${bodyX + 43} ${bodyTop + 19}, ${bodyX + 49} ${bodyTop + 22}" fill="none" stroke="#3e2722" stroke-width="2.5" opacity=".75"/>
      <path d="${rearA}" fill="none" stroke="${outline}" stroke-width="12"/>
      <path d="${rearA}" fill="none" stroke="${rust}" stroke-width="7"/>
      <path d="${frontA}" fill="none" stroke="${outline}" stroke-width="12"/>
      <path d="${frontA}" fill="none" stroke="${rust2}" stroke-width="7"/>
      <path d="M ${headX - 9} ${headY + 7} C ${headX - 4} ${headY - 4}, ${headX + 12} ${headY - 10}, ${headX + 26} ${headY - 2} C ${headX + 36} ${headY + 4}, ${headX + 34} ${headY + 17}, ${headX + 22} ${headY + 21} C ${headX + 8} ${headY + 24}, ${headX - 5} ${headY + 18}, ${headX - 9} ${headY + 7} Z" fill="${hideDark}" stroke="${outline}" stroke-width="5"/>
      <path d="M ${headX + 5} ${headY - 4} l 5 -17 l 10 15 Z" fill="${rust}" stroke="${outline}" stroke-width="4"/>
      <path d="M ${headX + 17} ${headY - 4} l 11 -13 l 4 17 Z" fill="${rust2}" stroke="${outline}" stroke-width="4"/>
      <path d="M ${headX + 19} ${headY + 8} C ${headX + 31} ${headY + 5}, ${headX + 42} ${headY + 10}, ${headX + 41} ${headY + 17} C ${headX + 38} ${headY + 24}, ${headX + 24} ${headY + 25}, ${headX + 16} ${headY + 18} Z" fill="#6e3b2c" stroke="${outline}" stroke-width="4"/>
      <path d="M ${headX + 16} ${headY + 11} Q ${headX + 31} ${headY + 4} ${headX + 42} ${headY + 13} M ${headX + 18} ${headY + 19} Q ${headX + 31} ${headY + 27} ${headX + 41} ${headY + 18}" fill="none" stroke="${metalLight}" stroke-width="4"/>
      <circle cx="${headX + 23}" cy="${headY + 5}" r="4.6" fill="${outline}"/>
      <circle cx="${headX + 23.5}" cy="${headY + 4.5}" r="2.2" fill="${eye}"/>
      <circle cx="${headX + 23.5}" cy="${headY + 4.5}" r="5.8" fill="${glow}" opacity=".16"/>
      <path d="M ${headX + 42} ${headY + 14} l 8 3 l -8 4" fill="${metal}" stroke="${outline}" stroke-width="3"/>
      <path d="M ${bodyX + 3} ${bodyBottom - 2} L ${bodyX + 18} ${bodyBottom + 3}" stroke="#38241f" stroke-width="4" opacity=".8"/>
    </g>
  </svg>`;
}

function dataUri(svg) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }

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
      reject(new Error(`Rust Hound frame failed to load: ${file.key}`));
    };
    const complete = () => {
      if (settled) return;
      settled = true;
      scene.load.off('loaderror', fail);
      resolve();
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', complete);
    missing.forEach(key => scene.load.image(key, dataUri(svgForPose(POSES[key]))));
    scene.load.start();
  });
}

function replaceAnimation(scene, key, frames, frameRate, repeat = -1) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({ key, frames: frames.map(frame => ({ key: frame })), frameRate, repeat });
}

function installAnimations(scene) {
  replaceAnimation(scene, 'rust-hound-run', FRAME_KEYS.slice(0, 4), 10, -1);
  replaceAnimation(scene, 'rust-hound-recover', ['rust-hound-land', 'rust-hound-run-0', 'rust-hound-run-1'], 8, 0);
}

export function tuneRustHoundVisual(enemy) {
  if (!enemy?.active || enemy.enemyId !== 'rust-hound') return enemy;
  const elite = Boolean(enemy.elite);
  enemy.stop?.();
  enemy.setOrigin?.(.5, .61);
  enemy.setScale?.(elite ? .84 : .72);
  enemy.setAlpha?.(1);
  enemy.setTexture?.('rust-hound-run-0');
  if (elite && enemy.enemyDefinition?.bootstrap?.eliteTint != null) enemy.setTint?.(enemy.enemyDefinition.bootstrap.eliteTint);
  else enemy.clearTint?.();
  enemy.play?.('rust-hound-run', true);
  enemy.__rustHoundVisual = true;
  enemy.__rustHoundVisualVersion = 'production-v1';
  return enemy;
}

function installFactoryVisualHook(scene) {
  const factory = scene.enemyFactory;
  if (!factory || factory.__rustHoundVisualHook === 'production-v1') return;
  const baseCreate = factory.create.bind(factory);
  factory.create = function(enemyId, options) {
    const enemy = baseCreate(enemyId, options);
    if (enemyId === 'rust-hound') tuneRustHoundVisual(enemy);
    return enemy;
  };
  factory.__rustHoundVisualHook = 'production-v1';
}

function runBrowserMotionSelfTest(scene) {
  const params = new URLSearchParams(location.search);
  if (params.get('houndtest') !== '1') return;
  scene.spawnEvent && (scene.spawnEvent.paused = true);
  scene.fireDelay = 999999;
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
  hound.__houndMotion = null;

  setTimeout(() => {
    if (!scene?.sys?.isActive?.()) return;
    const state = hound.__houndMotion;
    const checks = {
      active: Boolean(hound.active),
      visual: hound.__rustHoundVisual === true,
      behavior: hound.behaviorKey === 'hound-pounce',
      threat: hound.threatValue === 2,
      telegraph: Number(hound.__houndTelegraphCount) >= 1,
      pounced: Number(hound.__houndPounceCount) >= 1,
      pounceSpeed: Number(hound.__houndLastPounceSpeed) >= 330 && Number(hound.__houndLastPounceSpeed) <= 370,
      finiteMotion: Number.isFinite(state?.vx) && Number.isFinite(state?.vy),
      maxSpeed: Number(state?.maxObservedSpeed) >= 330 && Number(state?.maxObservedSpeed) <= 380
    };
    const ok = Object.values(checks).every(Boolean);
    window.__WM_RUST_HOUND_TEST__ = { ok, ...checks, phase: hound.__houndPhase, pounces: hound.__houndPounceCount, maxObservedSpeed: Math.round(state?.maxObservedSpeed || 0) };
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
  window.__WM_RUST_HOUND_VISUAL__ = true;
  document.documentElement.dataset.wreckmarchRustHoundVisual = 'production-v1';
  window.__WM_LOG__?.('Rust Hound active: 4-pose run + crouch telegraph + predictive pounce + landing recovery');
  runBrowserMotionSelfTest(scene);
  return true;
}

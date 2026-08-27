/* WRECKMARCH — Rust Hound hunt / telegraph / committed ground-slide state machine */

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function damp(a, b, sharpness, dt) {
  return lerp(a, b, 1 - Math.exp(-Math.max(0, sharpness) * dt));
}

function nowMs(scene) {
  return Number(scene?.time?.now) || 0;
}

function deltaSeconds(scene) {
  return clamp((Number(scene?.game?.loop?.delta) || 16.667) / 1000, .008, .05);
}

function range(random, min, max) {
  return min + (max - min) * clamp(Number(random?.()) || 0, 0, 1);
}

function getConfig(enemy) {
  return enemy?.behaviorConfig || enemy?.enemyDefinition?.behaviorConfig || {};
}

function setAnimation(enemy, key) {
  if (!enemy?.active || !key) return;
  if (enemy.anims?.currentAnim?.key === key && enemy.anims?.isPlaying) return;
  enemy.play?.(key, true);
}

function clearTelegraphFx(state) {
  state.telegraphTween?.stop?.();
  state.telegraphTween = null;
  state.telegraphLineTween?.stop?.();
  state.telegraphLineTween = null;
  state.telegraphFx?.destroy?.();
  state.telegraphFx = null;
  state.telegraphLine?.destroy?.();
  state.telegraphLine = null;
}

function createTelegraphFx(scene, enemy, state, durationMs = 240) {
  clearTelegraphFx(state);

  const ring = scene?.add?.ellipse?.(enemy.x, enemy.y + 20, 76, 30, 0xff321f, .10);
  if (ring) {
    ring.setStrokeStyle?.(3, 0xff3b24, .95);
    ring.setDepth?.(Math.max(1, (Number(enemy.depth) || 13) - 1));
    state.telegraphFx = ring;
    state.telegraphTween = scene?.tweens?.add?.({
      targets: ring,
      scaleX: 1.22,
      scaleY: 1.22,
      alpha: .38,
      duration: Math.max(90, Math.round(durationMs * .48)),
      yoyo: true,
      repeat: 0
    }) || null;
  }

  const line = scene?.add?.rectangle?.(enemy.x, enemy.y + 10, 138, 8, 0xff3b24, .18);
  if (line) {
    line.setOrigin?.(0, .5);
    line.setRotation?.(Math.atan2(state.aimY, state.aimX));
    line.setDepth?.(Math.max(1, (Number(enemy.depth) || 13) - 1));
    state.telegraphLine = line;
    state.telegraphLineTween = scene?.tweens?.add?.({
      targets: line,
      alpha: .5,
      scaleX: 1.08,
      duration: Math.max(90, Math.round(durationMs * .48)),
      yoyo: true,
      repeat: 0
    }) || null;
  }

  scene?.time?.delayedCall?.(Math.max(220, durationMs + 80), () => {
    ring?.destroy?.();
    line?.destroy?.();
  });
}

function restoreVisualTint(enemy) {
  if (!enemy?.active) return;
  if (enemy.elite && enemy.enemyDefinition?.bootstrap?.eliteTint != null) enemy.setTint?.(enemy.enemyDefinition.bootstrap.eliteTint);
  else enemy.clearTint?.();
}

function faceVelocity(enemy, vx, vy) {
  enemy.setFlipX?.(vx < -1);
  const speed = Math.hypot(vx, vy) || 1;
  enemy.setRotation?.(clamp((vy / speed) * .065, -.065, .065));
}

function setMotion(enemy, state, vx, vy) {
  state.vx = Number.isFinite(vx) ? vx : 0;
  state.vy = Number.isFinite(vy) ? vy : 0;
  enemy.setVelocity?.(state.vx, state.vy);
  faceVelocity(enemy, state.vx, state.vy);
  const speed = Math.hypot(state.vx, state.vy);
  state.maxObservedSpeed = Math.max(state.maxObservedSpeed || 0, speed);
}

function ensureState(scene, enemy, random) {
  if (enemy.__houndMotion) return enemy.__houndMotion;
  const cfg = getConfig(enemy);
  const now = nowMs(scene);
  const state = {
    phase: 'chase',
    phaseStartedAt: now,
    phaseUntil: 0,
    cooldownUntil: now + range(random, cfg.initialCooldownMinMs ?? 180, cfg.initialCooldownMaxMs ?? 300),
    vx: Number(enemy.body?.velocity?.x) || 0,
    vy: Number(enemy.body?.velocity?.y) || 0,
    aimX: 1,
    aimY: 0,
    slideCount: 0,
    maxObservedSpeed: 0,
    lastDistance: Infinity,
    attackCommitted: false
  };
  enemy.__houndMotion = state;
  enemy.__houndPhase = state.phase;
  enemy.__houndSlideCount = 0;
  enemy.__houndPounceCount = 0;
  return state;
}

function enterPhase(scene, enemy, state, phase, durationMs = 0) {
  const now = nowMs(scene);
  state.phase = phase;
  state.phaseStartedAt = now;
  state.phaseUntil = durationMs > 0 ? now + durationMs : 0;
  enemy.__houndPhase = phase;
}

function targetVelocity(target) {
  return {
    x: Number(target?.body?.velocity?.x) || 0,
    y: Number(target?.body?.velocity?.y) || 0
  };
}

export function computeHoundSlideAim(enemy, target, config = getConfig(enemy)) {
  const tv = targetVelocity(target);
  const leadSeconds = Number(config.predictionSeconds) || .10;
  const maxLead = Number(config.maxPredictionPixels) || 28;
  let leadX = tv.x * leadSeconds;
  let leadY = tv.y * leadSeconds;
  const leadLength = Math.hypot(leadX, leadY);
  if (leadLength > maxLead && leadLength > 0) {
    leadX *= maxLead / leadLength;
    leadY *= maxLead / leadLength;
  }
  const dx = (target.x + leadX) - enemy.x;
  const dy = (target.y + leadY) - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  return Object.freeze({ x: dx / length, y: dy / length, leadX, leadY });
}

export const computeHoundPounceAim = computeHoundSlideAim;

function beginTelegraph(scene, enemy, target, state, cfg) {
  state.attackCommitted = true;
  const aim = computeHoundSlideAim(enemy, target, cfg);
  state.aimX = aim.x;
  state.aimY = aim.y;
  enterPhase(scene, enemy, state, 'telegraph', cfg.telegraphMs ?? 220);
  enemy.damage = enemy.baseDamage ?? enemy.damage;
  enemy.setTint?.(0xff7a45);
  enemy.stop?.();
  enemy.setRotation?.(0);
  enemy.setTexture?.('rust-hound-crouch');
  setMotion(enemy, state, 0, 0);
  enemy.setRotation?.(0);
  enemy.setFlipX?.(state.aimX < 0);
  createTelegraphFx(scene, enemy, state, Number(cfg.telegraphMs) || 220);
  enemy.__houndTelegraphCount = (enemy.__houndTelegraphCount || 0) + 1;
  scene.spawnDust?.(enemy.x, enemy.y + 24, .55);
  scene.playTone?.(205, .045, 'sawtooth', .008, -35);
}

function beginSlide(scene, enemy, state, cfg) {
  state.attackCommitted = true;
  clearTelegraphFx(state);
  const speed = Number(cfg.slideSpeed) || 360;
  enterPhase(scene, enemy, state, 'slide', cfg.slideMs ?? 480);
  restoreVisualTint(enemy);
  enemy.stop?.();
  enemy.setTexture?.('rust-hound-pounce');
  enemy.damage = (enemy.baseDamage ?? enemy.damage ?? 0) * (Number(cfg.slideDamageMultiplier) || 1.4);
  state.slideCount += 1;
  enemy.__houndSlideCount = state.slideCount;
  enemy.__houndLastSlideSpeed = speed;
  enemy.__houndPounceCount = state.slideCount;
  enemy.__houndLastPounceSpeed = speed;
  setMotion(enemy, state, state.aimX * speed, state.aimY * speed);
  scene.spawnDust?.(enemy.x - state.aimX * 18, enemy.y - state.aimY * 18 + 20, .95);
  scene.playTone?.(138, .055, 'square', .012, 18);
}

function beginRecover(scene, enemy, state, cfg, random) {
  state.attackCommitted = false;
  clearTelegraphFx(state);
  enterPhase(scene, enemy, state, 'recover', cfg.recoverMs ?? 280);
  enemy.damage = enemy.baseDamage ?? enemy.damage;
  restoreVisualTint(enemy);
  setAnimation(enemy, 'rust-hound-recover');
  state.cooldownUntil = nowMs(scene) + range(random, cfg.cooldownMinMs ?? 1050, cfg.cooldownMaxMs ?? 1450);
  scene.spawnDust?.(enemy.x, enemy.y + 24, .72);
}

function updateChase(scene, enemy, target, state, cfg, random, dt) {
  if (state.attackCommitted) {
    if (state.phase === 'slide') return updateSlide(scene, enemy, state, cfg, random, dt);
    if (state.phase === 'recover') return updateRecover(scene, enemy, state, cfg, dt);
    if (state.phase !== 'telegraph') enterPhase(scene, enemy, state, 'telegraph', cfg.telegraphMs ?? 220);
    return updateTelegraph(scene, enemy, state, cfg, dt);
  }

  enemy.damage = enemy.baseDamage ?? enemy.damage;
  restoreVisualTint(enemy);
  setAnimation(enemy, 'rust-hound-run');

  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  state.lastDistance = distance;
  const nx = dx / distance;
  const ny = dy / distance;
  const now = nowMs(scene);
  const ready = now >= state.cooldownUntil;
  const minRange = Number(cfg.slideRangeMin) || 85;
  const maxRange = Number(cfg.slideRangeMax) || 240;

  if (ready && distance >= minRange && distance <= maxRange) {
    beginTelegraph(scene, enemy, target, state, cfg);
    return;
  }

  const speed = Number(enemy.speed) || 0;
  let desiredX = nx * speed;
  let desiredY = ny * speed;
  let sharpness = Number(cfg.chaseSharpness) || 8.5;

  const holdRange = Number(cfg.holdRange) || 112;
  if (distance < holdRange) {
    const side = enemy.__houndOrbitSide || (enemy.__houndOrbitSide = random() < .5 ? -1 : 1);
    const tangentX = -ny * side;
    const tangentY = nx * side;

    if (ready && distance < minRange) {
      const gap = clamp((minRange - distance) / minRange, 0, 1);
      desiredX = (tangentX * .34 - nx * (.82 + gap * .26)) * speed * .88;
      desiredY = (tangentY * .34 - ny * (.82 + gap * .26)) * speed * .88;
    } else {
      const retreat = clamp((holdRange - distance) / holdRange, 0, 1);
      desiredX = (tangentX * .76 - nx * (.18 + retreat * .42)) * speed * .72;
      desiredY = (tangentY * .76 - ny * (.18 + retreat * .42)) * speed * .72;
    }
    sharpness = Number(cfg.holdSharpness) || 10.5;
  }

  const vx = damp(state.vx, desiredX, sharpness, dt);
  const vy = damp(state.vy, desiredY, sharpness, dt);
  setMotion(enemy, state, vx, vy);
  if (random() < .018) scene.spawnDust?.(enemy.x, enemy.y + 24, .4);
}

function updateTelegraph(scene, enemy, state, cfg, dt) {
  state.attackCommitted = true;
  enemy.stop?.();
  enemy.setTexture?.('rust-hound-crouch');
  enemy.setFlipX?.(state.aimX < 0);
  const vx = damp(state.vx, 0, 20, dt);
  const vy = damp(state.vy, 0, 20, dt);
  if (state.telegraphFx?.active !== false) state.telegraphFx?.setPosition?.(enemy.x, enemy.y + 20);
  if (state.telegraphLine?.active !== false) {
    state.telegraphLine?.setPosition?.(enemy.x, enemy.y + 10);
    state.telegraphLine?.setRotation?.(Math.atan2(state.aimY, state.aimX));
  }
  setMotion(enemy, state, vx, vy);
  enemy.setRotation?.(0);
  if (nowMs(scene) >= state.phaseUntil) beginSlide(scene, enemy, state, cfg);
}

function updateSlide(scene, enemy, state, cfg, random, dt) {
  state.attackCommitted = true;
  enemy.stop?.();
  enemy.setTexture?.('rust-hound-pounce');
  const speed = Number(cfg.slideSpeed) || 360;
  setMotion(enemy, state, state.aimX * speed, state.aimY * speed);
  if (random() < .16) scene.spawnDust?.(enemy.x - state.aimX * 20, enemy.y - state.aimY * 20 + 22, .62);
  if (nowMs(scene) >= state.phaseUntil) beginRecover(scene, enemy, state, cfg, random);
}

function updateRecover(scene, enemy, state, cfg, dt) {
  const sharpness = Number(cfg.recoverSharpness) || 13;
  setMotion(enemy, state, damp(state.vx, 0, sharpness, dt), damp(state.vy, 0, sharpness, dt));
  if (nowMs(scene) >= state.phaseUntil) {
    enterPhase(scene, enemy, state, 'chase');
    setAnimation(enemy, 'rust-hound-run');
  }
}

export function updateHoundPounceBehavior({ scene, enemy, target, random = Math.random }) {
  if (!enemy?.active || !target) return;
  const cfg = getConfig(enemy);
  const state = ensureState(scene, enemy, random);
  const dt = deltaSeconds(scene);

  if (state.phase === 'telegraph') return updateTelegraph(scene, enemy, state, cfg, dt);
  if (state.phase === 'slide') return updateSlide(scene, enemy, state, cfg, random, dt);
  if (state.phase === 'recover') return updateRecover(scene, enemy, state, cfg, dt);
  return updateChase(scene, enemy, target, state, cfg, random, dt);
}

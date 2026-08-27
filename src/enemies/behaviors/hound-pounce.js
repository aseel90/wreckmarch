/* WRECKMARCH — Rust Hound hunt / telegraph / pounce state machine */

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

function wrapAngle(angle) {
  let out = angle;
  while (out > Math.PI) out -= TAU;
  while (out < -Math.PI) out += TAU;
  return out;
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
  state.telegraphFx?.destroy?.();
  state.telegraphFx = null;
}

function createTelegraphFx(scene, enemy, state, durationMs = 280) {
  clearTelegraphFx(state);
  const ring = scene?.add?.ellipse?.(enemy.x, enemy.y + 20, 76, 30, 0xff321f, .10);
  if (!ring) return;
  ring.setStrokeStyle?.(3, 0xff3b24, .95);
  ring.setDepth?.(Math.max(1, (Number(enemy.depth) || 13) - 1));
  state.telegraphFx = ring;
  state.telegraphTween = scene?.tweens?.add?.({
    targets: ring,
    scaleX: 1.22,
    scaleY: 1.22,
    alpha: .38,
    duration: 135,
    yoyo: true,
    repeat: 0
  }) || null;
  scene?.time?.delayedCall?.(Math.max(220, durationMs + 60), () => ring.destroy?.());
}

function restoreVisualTint(enemy) {
  if (!enemy?.active) return;
  if (enemy.elite && enemy.enemyDefinition?.bootstrap?.eliteTint != null) enemy.setTint?.(enemy.enemyDefinition.bootstrap.eliteTint);
  else enemy.clearTint?.();
}

function faceVelocity(enemy, vx, vy) {
  enemy.setFlipX?.(vx < -1);
  const speed = Math.hypot(vx, vy) || 1;
  enemy.setRotation?.(clamp((vy / speed) * .085, -.085, .085));
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
    cooldownUntil: now + range(random, cfg.initialCooldownMinMs ?? 220, cfg.initialCooldownMaxMs ?? 360),
    vx: Number(enemy.body?.velocity?.x) || 0,
    vy: Number(enemy.body?.velocity?.y) || 0,
    aimX: 1,
    aimY: 0,
    pounceCount: 0,
    maxObservedSpeed: 0,
    lastDistance: Infinity
  };
  enemy.__houndMotion = state;
  enemy.__houndPhase = state.phase;
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

export function computeHoundPounceAim(enemy, target, config = getConfig(enemy)) {
  const tv = targetVelocity(target);
  const leadSeconds = Number(config.predictionSeconds) || .16;
  const maxLead = Number(config.maxPredictionPixels) || 46;
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

function beginTelegraph(scene, enemy, state, cfg) {
  enterPhase(scene, enemy, state, 'telegraph', cfg.telegraphMs ?? 280);
  enemy.damage = enemy.baseDamage ?? enemy.damage;
  enemy.setTint?.(0xff7a45);
  enemy.setRotation?.(0);
  enemy.setTexture?.('rust-hound-crouch');
  createTelegraphFx(scene, enemy, state, Number(cfg.telegraphMs) || 280);
  enemy.__houndTelegraphCount = (enemy.__houndTelegraphCount || 0) + 1;
  scene.spawnDust?.(enemy.x, enemy.y + 24, .55);
  scene.playTone?.(205, .045, 'sawtooth', .008, -35);
}

function beginPounce(scene, enemy, target, state, cfg) {
  clearTelegraphFx(state);
  const aim = computeHoundPounceAim(enemy, target, cfg);
  state.aimX = aim.x;
  state.aimY = aim.y;
  const speed = Number(cfg.pounceSpeed) || 348;
  enterPhase(scene, enemy, state, 'pounce', cfg.pounceMs ?? 310);
  restoreVisualTint(enemy);
  enemy.setTexture?.('rust-hound-pounce');
  enemy.damage = (enemy.baseDamage ?? enemy.damage ?? 0) * (Number(cfg.pounceDamageMultiplier) || 1.45);
  state.pounceCount += 1;
  enemy.__houndPounceCount = state.pounceCount;
  enemy.__houndLastPounceSpeed = speed;
  setMotion(enemy, state, aim.x * speed, aim.y * speed);
  scene.spawnDust?.(enemy.x - aim.x * 18, enemy.y - aim.y * 18 + 20, .8);
  scene.playTone?.(155, .035, 'square', .012, 30);
}

function beginRecover(scene, enemy, state, cfg, random) {
  clearTelegraphFx(state);
  enterPhase(scene, enemy, state, 'recover', cfg.recoverMs ?? 320);
  enemy.damage = enemy.baseDamage ?? enemy.damage;
  restoreVisualTint(enemy);
  setAnimation(enemy, 'rust-hound-recover');
  state.cooldownUntil = nowMs(scene) + range(random, cfg.cooldownMinMs ?? 1120, cfg.cooldownMaxMs ?? 1480);
  scene.spawnDust?.(enemy.x, enemy.y + 24, .6);
}

function updateChase(scene, enemy, target, state, cfg, random, dt) {
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
  const minRange = Number(cfg.pounceRangeMin) || 100;
  const maxRange = Number(cfg.pounceRangeMax) || 280;

  if (ready && distance >= minRange && distance <= maxRange) {
    beginTelegraph(scene, enemy, state, cfg);
    return;
  }

  const speed = Number(enemy.speed) || 0;
  let desiredX = nx * speed;
  let desiredY = ny * speed;
  let sharpness = Number(cfg.chaseSharpness) || 8.5;

  const holdRange = Number(cfg.holdRange) || 126;
  if (distance < holdRange) {
    const side = enemy.__houndOrbitSide || (enemy.__houndOrbitSide = random() < .5 ? -1 : 1);
    const tangentX = -ny * side;
    const tangentY = nx * side;

    if (ready && distance < minRange) {
      const gap = clamp((minRange - distance) / minRange, 0, 1);
      desiredX = (tangentX * .38 - nx * (.78 + gap * .28)) * speed * .86;
      desiredY = (tangentY * .38 - ny * (.78 + gap * .28)) * speed * .86;
    } else {
      const retreat = clamp((holdRange - distance) / holdRange, 0, 1);
      desiredX = (tangentX * .78 - nx * (.18 + retreat * .42)) * speed * .72;
      desiredY = (tangentY * .78 - ny * (.18 + retreat * .42)) * speed * .72;
    }
    sharpness = Number(cfg.holdSharpness) || 10.5;
  }

  const vx = damp(state.vx, desiredX, sharpness, dt);
  const vy = damp(state.vy, desiredY, sharpness, dt);
  setMotion(enemy, state, vx, vy);
  if (random() < .018) scene.spawnDust?.(enemy.x, enemy.y + 24, .4);
}

function updateTelegraph(scene, enemy, target, state, cfg, dt) {
  const vx = damp(state.vx, 0, 18, dt);
  const vy = damp(state.vy, 0, 18, dt);
  if (state.telegraphFx?.active !== false) state.telegraphFx?.setPosition?.(enemy.x, enemy.y + 20);
  setMotion(enemy, state, vx, vy);
  enemy.setRotation?.(0);
  if (nowMs(scene) >= state.phaseUntil) beginPounce(scene, enemy, target, state, cfg);
}

function updatePounce(scene, enemy, target, state, cfg, random, dt) {
  const speed = Number(cfg.pounceSpeed) || 348;
  const progress = clamp((nowMs(scene) - state.phaseStartedAt) / Math.max(1, Number(cfg.pounceMs) || 310), 0, 1);
  if (progress < .48) {
    const desired = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const current = Math.atan2(state.aimY, state.aimX);
    const maxTurn = (Number(cfg.pounceTurnRate) || .82) * dt;
    const next = current + clamp(wrapAngle(desired - current), -maxTurn, maxTurn);
    state.aimX = Math.cos(next);
    state.aimY = Math.sin(next);
  }
  setMotion(enemy, state, state.aimX * speed, state.aimY * speed);
  if (random() < .035) scene.spawnDust?.(enemy.x - state.aimX * 15, enemy.y - state.aimY * 15 + 22, .5);
  if (nowMs(scene) >= state.phaseUntil) beginRecover(scene, enemy, state, cfg, random);
}

function updateRecover(scene, enemy, state, cfg, dt) {
  const sharpness = Number(cfg.recoverSharpness) || 12;
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

  if (state.phase === 'telegraph') return updateTelegraph(scene, enemy, target, state, cfg, dt);
  if (state.phase === 'pounce') return updatePounce(scene, enemy, target, state, cfg, random, dt);
  if (state.phase === 'recover') return updateRecover(scene, enemy, state, cfg, dt);
  return updateChase(scene, enemy, target, state, cfg, random, dt);
}

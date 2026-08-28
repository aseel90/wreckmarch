/* WRECKMARCH — Sawbug ranged acid-spitter state machine */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function range(random, min, max) {
  return min + (max - min) * clamp(Number(random?.()) || 0, 0, 1);
}

function nowMs(scene) {
  return Number(scene?.time?.now) || 0;
}

function getConfig(enemy) {
  return enemy?.behaviorConfig || enemy?.enemyDefinition?.behaviorConfig || {};
}

function setAnimation(enemy, key) {
  if (!enemy?.active || !key) return;
  if (enemy.anims?.currentAnim?.key === key && enemy.anims?.isPlaying) return;
  enemy.play?.(key, true);
}

function restoreVisualTint(enemy) {
  if (!enemy?.active) return;
  if (enemy.elite && enemy.enemyDefinition?.bootstrap?.eliteTint != null) enemy.setTint?.(enemy.enemyDefinition.bootstrap.eliteTint);
  else enemy.clearTint?.();
}

function spawnSplash(scene, x, y) {
  if (!scene?.textures?.exists?.('sawbug-acid-splash-0')) return null;
  const splash = scene.add.sprite(x, y, 'sawbug-acid-splash-0')
    .setOrigin(.5, .72)
    .setDepth(29)
    .setScale(.46);
  scene.__sawbugAcidSplashesSpawned = (scene.__sawbugAcidSplashesSpawned || 0) + 1;
  splash.play?.('sawbug-acid-splash');
  scene.time?.delayedCall?.(220, () => splash?.destroy?.());
  return splash;
}

function ensureProjectileRuntime(scene) {
  if (scene.__sawbugAcidProjectiles) return scene.__sawbugAcidProjectiles;
  const group = scene.physics.add.group({ allowGravity: false });
  scene.__sawbugAcidProjectiles = group;
  scene.__sawbugAcidShotsSpawned = scene.__sawbugAcidShotsSpawned || 0;
  scene.__sawbugAcidSplashesSpawned = scene.__sawbugAcidSplashesSpawned || 0;

  scene.physics.add.overlap(group, scene.hero, (projectile, hero) => {
    if (!projectile?.active || !hero?.active) return;
    const x = projectile.x;
    const y = projectile.y;
    scene.playerDamageSystem?.hitByContact?.(hero, projectile);
    projectile.destroy();
    spawnSplash(scene, x, y);
  });

  return group;
}

function predictedAim(enemy, target, config) {
  const vx = Number(target?.body?.velocity?.x) || 0;
  const vy = Number(target?.body?.velocity?.y) || 0;
  const prediction = Number(config.predictionSeconds) || .15;
  const maxLead = Number(config.maxPredictionPixels) || 42;
  let leadX = vx * prediction;
  let leadY = vy * prediction;
  const leadLength = Math.hypot(leadX, leadY);
  if (leadLength > maxLead && leadLength > 0) {
    leadX *= maxLead / leadLength;
    leadY *= maxLead / leadLength;
  }
  const dx = target.x + leadX - enemy.x;
  const dy = target.y + leadY - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length, angle: Math.atan2(dy, dx) };
}

function fireAcid(scene, enemy, target, state, config) {
  const aim = predictedAim(enemy, target, config);
  const group = ensureProjectileRuntime(scene);
  const muzzleX = enemy.x + aim.x * 43;
  const muzzleY = enemy.y + aim.y * 20 - 7;
  const projectile = group.create(muzzleX, muzzleY, 'sawbug-acid-projectile-0')
    .setDepth(30)
    .setScale(Number(config.projectileScale) || .32)
    .setRotation(aim.angle);

  projectile.setCircle?.(
    Number(config.projectileRadius) || 19,
    Number(config.projectileOffsetX) || 60,
    Number(config.projectileOffsetY) || 13
  );
  projectile.body && (projectile.body.allowGravity = false);
  projectile.damage = Number(config.projectileDamage) || 11;
  projectile.__sawbugAcid = true;
  projectile.__expireAt = nowMs(scene) + (Number(config.projectileLifeMs) || 1900);
  projectile.setVelocity(
    aim.x * (Number(config.projectileSpeed) || 275),
    aim.y * (Number(config.projectileSpeed) || 275)
  );
  projectile.play?.('sawbug-acid-flight', true);

  scene.__sawbugAcidShotsSpawned = (scene.__sawbugAcidShotsSpawned || 0) + 1;
  enemy.__sawbugShotsFired = (enemy.__sawbugShotsFired || 0) + 1;
  enemy.__sawbugLastProjectileSpeed = Number(config.projectileSpeed) || 275;

  scene.time?.delayedCall?.(Number(config.projectileLifeMs) || 1900, () => {
    if (!projectile?.active) return;
    const x = projectile.x;
    const y = projectile.y;
    projectile.destroy();
    spawnSplash(scene, x, y);
  });
  scene.playTone?.(168, .045, 'sawtooth', .008, -26);
}

function ensureState(scene, enemy, random) {
  if (enemy.__sawbugState) return enemy.__sawbugState;
  const cfg = getConfig(enemy);
  const now = nowMs(scene);
  const state = {
    phase: 'move',
    phaseUntil: 0,
    cooldownUntil: now + range(random, cfg.initialCooldownMinMs ?? 520, cfg.initialCooldownMaxMs ?? 760),
    strafeSide: random() < .5 ? -1 : 1
  };
  enemy.__sawbugState = state;
  enemy.__sawbugPhase = 'move';
  enemy.__sawbugShotsFired = 0;
  ensureProjectileRuntime(scene);
  return state;
}

function beginWindup(scene, enemy, state, cfg) {
  state.phase = 'windup';
  state.phaseUntil = nowMs(scene) + (Number(cfg.telegraphMs) || 340);
  enemy.__sawbugPhase = 'windup';
  enemy.setVelocity?.(0, 0);
  enemy.setTint?.(0xb9ff45);
  setAnimation(enemy, 'sawbug-acid-attack');
  scene.playTone?.(232, .035, 'triangle', .006, -18);
}

function beginRecover(scene, enemy, state, cfg, random) {
  state.phase = 'recover';
  state.phaseUntil = nowMs(scene) + (Number(cfg.recoverMs) || 280);
  state.cooldownUntil = state.phaseUntil + range(random, cfg.cooldownMinMs ?? 1750, cfg.cooldownMaxMs ?? 2250);
  enemy.__sawbugPhase = 'recover';
  restoreVisualTint(enemy);
  enemy.setVelocity?.(0, 0);
}

function updateMovement(scene, enemy, target, state, cfg) {
  restoreVisualTint(enemy);
  setAnimation(enemy, 'sawbug-walk');

  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
  const tx = -ny * state.strafeSide;
  const ty = nx * state.strafeSide;
  const speed = Number(enemy.speed) || 0;
  const retreatRange = Number(cfg.retreatRange) || 165;
  const preferredMin = Number(cfg.preferredRangeMin) || 205;
  const preferredMax = Number(cfg.preferredRangeMax) || 315;

  let vx = tx * speed * (Number(cfg.strafeSpeedMultiplier) || .64);
  let vy = ty * speed * (Number(cfg.strafeSpeedMultiplier) || .64);

  if (distance < retreatRange) {
    const mult = Number(cfg.retreatSpeedMultiplier) || .78;
    vx = -nx * speed * mult + tx * speed * .18;
    vy = -ny * speed * mult + ty * speed * .18;
  } else if (distance > preferredMax) {
    const mult = Number(cfg.approachSpeedMultiplier) || .86;
    vx = nx * speed * mult + tx * speed * .12;
    vy = ny * speed * mult + ty * speed * .12;
  } else if (distance < preferredMin) {
    vx += -nx * speed * .32;
    vy += -ny * speed * .32;
  }

  enemy.setVelocity?.(vx, vy);
  enemy.setFlipX?.(vx < -1);
  enemy.setRotation?.(clamp((vy / Math.max(1, Math.hypot(vx, vy))) * .045, -.045, .045));

  if (nowMs(scene) >= state.cooldownUntil && distance >= preferredMin * .82 && distance <= preferredMax * 1.12) {
    beginWindup(scene, enemy, state, cfg);
  }
}

export function updateAcidSpitterBehavior({ scene, enemy, target, random = Math.random }) {
  if (!enemy?.active || !target?.active) return;
  const cfg = getConfig(enemy);
  const state = ensureState(scene, enemy, random);
  const now = nowMs(scene);

  if (state.phase === 'windup') {
    enemy.setVelocity?.(0, 0);
    enemy.setRotation?.(0);
    enemy.setFlipX?.(target.x < enemy.x);
    if (now >= state.phaseUntil) {
      fireAcid(scene, enemy, target, state, cfg);
      beginRecover(scene, enemy, state, cfg, random);
    }
    return;
  }

  if (state.phase === 'recover') {
    enemy.setVelocity?.(0, 0);
    if (now >= state.phaseUntil) {
      state.phase = 'move';
      enemy.__sawbugPhase = 'move';
      setAnimation(enemy, 'sawbug-walk');
    }
    return;
  }

  updateMovement(scene, enemy, target, state, cfg);
}

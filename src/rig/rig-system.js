/* WRECKMARCH — authoritative Fortress Rig runtime owner */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function length(x, y) {
  return Math.hypot(x, y);
}

function normalize(point, fallbackX = 1, fallbackY = 0) {
  const magnitude = length(point.x, point.y);
  if (magnitude > 0.000001) {
    point.x /= magnitude;
    point.y /= magnitude;
  } else {
    point.x = fallbackX;
    point.y = fallbackY;
  }
  return point;
}

function wrapAngle(angle) {
  while (angle <= -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

function rotateTo(current, target, maxDelta) {
  const delta = wrapAngle(target - current);
  if (Math.abs(delta) <= maxDelta) return target;
  return current + Math.sign(delta) * maxDelta;
}

function createRigState(x, y, dirX = 1, dirY = 0, lane = 1) {
  const dir = normalize({ x: dirX, y: dirY });
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    dir,
    goal: { x, y },
    travel: 0,
    dustAt: 0,
    lane
  };
}

export class RigSystem {
  /**
   * @param {any} scene
   * @param {{ spawnDust?: ((state: any, speed: number) => void) | null }} [options]
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.spawnDust = typeof options.spawnDust === 'function' ? options.spawnDust : null;
    this.state = scene.__c4RigState ?? null;
    if (this.state) scene.__c4RigState = this.state;
  }

  setDustSpawner(spawnDust) {
    this.spawnDust = typeof spawnDust === 'function' ? spawnDust : null;
    return this;
  }

  createState(x, y, dirX = 1, dirY = 0, lane = 1) {
    return createRigState(x, y, dirX, dirY, lane);
  }

  setState(state) {
    this.state = state ?? null;
    this.scene.__c4RigState = this.state;
    return this.state;
  }

  resetState() {
    return this.setState(null);
  }

  ensureState() {
    if (this.state) return this.state;
    const scene = this.scene;
    return this.setState(createRigState(scene.cart?.x ?? 0, scene.cart?.y ?? 0));
  }

  summon() {
    const scene = this.scene;
    if (scene.rigSummoned || !scene.cart || !scene.hero) return false;
    scene.rigSummoned = true;
    scene.rigFireDelay = 920;
    scene.rigDamageScale = .58;
    scene.rigShots = 1;
    scene.lastRigShot = 0;
    scene.cart.setVisible(true).setActive(true).setAlpha(0).setScale(.92);
    scene.cart.setPosition(scene.hero.x - 145, scene.hero.y + 105);
    this.resetState();
    scene.tweens?.add?.({ targets: scene.cart, alpha: 1, duration: 260, ease: 'Cubic.Out' });
    scene.cameras?.main?.flash?.(110, 80, 210, 225, false);
    return true;
  }

  update(time, delta) {
    const scene = this.scene;
    if (!scene.rigSummoned || !scene.cart?.visible || !scene.hero) return false;

    const state = this.ensureState();
    const dt = Math.min(.035, Math.max(.001, delta / 1000));
    const moveX = scene.move?.x || 0;
    const moveY = scene.move?.y || 0;
    const moveSq = moveX * moveX + moveY * moveY;

    if (moveSq > .06) {
      const magnitude = Math.sqrt(moveSq);
      const targetX = moveX / magnitude;
      const targetY = moveY / magnitude;
      const follow = 1 - Math.exp(-4.2 * dt);
      state.dir.x += (targetX - state.dir.x) * follow;
      state.dir.y += (targetY - state.dir.y) * follow;
      normalize(state.dir);
    }

    const sideX = -state.dir.y;
    const sideY = state.dir.x;
    state.goal.x = scene.hero.x - state.dir.x * 176 + sideX * 44 * state.lane;
    state.goal.y = scene.hero.y - state.dir.y * 145 + sideY * 44 * state.lane + 20;

    let errX = state.goal.x - state.pos.x;
    let errY = state.goal.y - state.pos.y;
    const dist = length(errX, errY);
    const omega = dist > 360 ? 4.9 : 3.8;
    let accelX = errX * omega * omega - state.vel.x * 2 * omega;
    let accelY = errY * omega * omega - state.vel.y * 2 * omega;
    const maxA = dist > 360 ? 620 : 430;
    const accelLength = length(accelX, accelY);
    if (accelLength > maxA) {
      const scale = maxA / accelLength;
      accelX *= scale;
      accelY *= scale;
    }

    state.vel.x += accelX * dt;
    state.vel.y += accelY * dt;
    const maxV = dist > 430 ? 275 : dist > 260 ? 225 : 190;
    const velocityLength = length(state.vel.x, state.vel.y);
    if (velocityLength > maxV) {
      const scale = maxV / velocityLength;
      state.vel.x *= scale;
      state.vel.y *= scale;
    }
    if (dist < 32) {
      const damping = Math.pow(.12, dt);
      state.vel.x *= damping;
      state.vel.y *= damping;
    }

    const stepX = state.vel.x * dt;
    const stepY = state.vel.y * dt;
    state.pos.x += stepX;
    state.pos.y += stepY;
    state.travel += length(stepX, stepY);
    scene.cart.setPosition(state.pos.x, state.pos.y);

    const speed = length(state.vel.x, state.vel.y);
    const motion = clamp(speed / 210, 0, 1);
    const desiredRotation = clamp(state.vel.x / 240 * .024, -.024, .024);
    const rotationFollow = 1 - Math.exp(-4.5 * dt);
    scene.cart.rotation = (scene.cart.rotation || 0) + (desiredRotation - (scene.cart.rotation || 0)) * rotationFollow;

    const spin = state.travel / 15;
    scene.cartWheels?.forEach((wheel, index) => wheel.setRotation((index < 2 ? -1 : 1) * spin));

    const suspension = Math.sin(state.travel * .085) * 1.45 * motion + Math.sin(time * .008) * .45 * motion;
    if (scene.cartBody) scene.cartBody.y = (scene.__c3RigBaseBodyY ?? -6) + suspension;
    if (scene.__c3Turret) scene.__c3Turret.y = (scene.__c3RigBaseTurretY ?? -32) + suspension * .55;

    if (speed > 60 && time > state.dustAt + (speed > 170 ? 110 : 165)) {
      state.dustAt = time;
      this.spawnDust?.(state, speed);
    }

    const target = scene.weaponSystem?.acquireTarget?.(scene.cart.x, scene.cart.y, 560);
    if (!target || !scene.__c3Turret) return true;

    const originX = scene.cart.x + 20;
    const originY = scene.cart.y - 25;
    const worldAngle = Math.atan2(target.y - originY, target.x - originX);
    const nativeAngle = -.79;
    const localAngle = worldAngle - scene.cart.rotation - nativeAngle;
    scene.__c3Turret.rotation = rotateTo(scene.__c3Turret.rotation || 0, localAngle, 1.85 * dt);
    const aimedAngle = scene.__c3Turret.rotation + scene.cart.rotation + nativeAngle;

    if (Math.abs(wrapAngle(worldAngle - aimedAngle)) > .25 || time < (scene.lastRigShot || 0) + scene.rigFireDelay) return true;

    scene.lastRigShot = time;
    scene.weaponSystem.fireSupportVolley({
      originX,
      originY,
      angle: worldAngle,
      spreads: scene.rigShots > 1 ? [-.055, .055] : [0],
      muzzleDistance: 61,
      speed: 680,
      damage: scene.primaryWeapon.damage * scene.rigDamageScale,
      lifeMs: 1100,
      scale: .66
    });
    scene.playTone?.(118, .035, 'square', .012, -22);
    return true;
  }
}

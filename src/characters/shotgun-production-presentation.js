/* WRECKMARCH — Shotgun production presentation adapter.
 * This module owns only Shotgun body/weapon presentation for C5/D1. Registration
 * is safe while the character is locked: CharacterRegistry still blocks gameplay
 * selection until an approved character definition and full-run gate exist.
 *
 * Canonical render order is: full baked body -> separate shotgun -> baked two-hand
 * foreground overlay. This keeps the gun visible over the torso while both hands
 * visibly close over it, without reintroducing runtime limb crops or a body-part rig.
 */
import { SHOTGUN_RUNTIME_PRESENTATION, getShotgunHandOverlayKey } from './shotgun-runtime-presentation.js?v=5';
import { loadShotgunLocomotionArt } from './shotgun-locomotion-art.js?v=3';

const HIDDEN_LEGACY_PARTS = Object.freeze([
  'weaponV3ArmA',
  'weaponV3ArmB',
  'weaponV3HandA',
  'weaponV3HandB',
  'weaponArm',
  'weaponRig',
  'aimPose'
]);

function normalizeAngle(angle) {
  const value = Number(angle);
  if (!Number.isFinite(value)) return 0;
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function bodyPointToWorld(presentation, heroX, heroY, point) {
  const canvas = presentation.body.canvas;
  const render = presentation.body.render;
  return Object.freeze({
    x: Number(heroX) + ((point.x - (canvas.width * render.originX)) * render.scale),
    y: Number(heroY) + ((point.y - (canvas.height * render.originY)) * render.scale)
  });
}

export function resolveShotgunPresentationPose(heroX, heroY, aimRadians = 0) {
  const requestedAngle = normalizeAngle(aimRadians);
  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const scale = presentation.body.render.scale;
  const facing = Math.cos(requestedAngle) < 0 ? 'left' : 'right';
  const left = facing === 'left';
  const grip = bodyPointToWorld(presentation, heroX, heroY, presentation.body.grip[facing]);
  const supportHand = bodyPointToWorld(presentation, heroX, heroY, presentation.body.support[facing]);
  const supportLocal = presentation.weapon.supportFromGrip;
  const muzzleLocal = presentation.weapon.muzzleFromGrip;
  const sign = left ? -1 : 1;
  const weaponSupport = Object.freeze({
    x: grip.x + (supportLocal.x * scale * sign),
    y: grip.y + (supportLocal.y * scale)
  });
  const muzzle = Object.freeze({
    x: grip.x + (muzzleLocal.x * scale * sign),
    y: grip.y + (muzzleLocal.y * scale)
  });
  const twoHandError = Math.hypot(weaponSupport.x - supportHand.x, weaponSupport.y - supportHand.y);
  const tolerance = presentation.weapon.hold.supportTolerancePx * scale;
  const barrelAngle = Math.atan2(muzzle.y - grip.y, muzzle.x - grip.x);

  return Object.freeze({
    requestedAngle,
    angle: barrelAngle,
    facing,
    grip,
    supportHand,
    weaponSupport,
    muzzle,
    weaponRotation: presentation.weapon.hold.rotationRadians,
    bodyRotation: presentation.weapon.hold.bodyRotationRadians,
    weaponFlipX: left,
    twoHandError,
    twoHandLocked: twoHandError <= tolerance,
    holdMode: presentation.weapon.hold.mode,
    layerMode: presentation.layers.mode
  });
}

async function ensureShotgunRuntimeAssets(scene) {
  await loadShotgunLocomotionArt(scene);
  const weapon = SHOTGUN_RUNTIME_PRESENTATION.weapon;
  if (scene?.textures?.exists?.(weapon.key)) return SHOTGUN_RUNTIME_PRESENTATION;
  if (!scene?.load?.image || !scene?.load?.once || !scene?.load?.start) {
    throw Error('Shotgun production presentation requires Phaser image-loader boundaries');
  }

  await new Promise((resolve, reject) => {
    let settled = false;
    const fail = file => {
      if (settled || file?.key !== weapon.key) return;
      settled = true;
      reject(Error(`Shotgun production asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.on?.('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off?.('loaderror', fail);
      if (settled) return;
      settled = true;
      resolve();
    });
    scene.load.image(weapon.key, weapon.path);
    scene.load.start();
  });
  return SHOTGUN_RUNTIME_PRESENTATION;
}

function hideLegacyWeaponParts(scene) {
  for (const key of HIDDEN_LEGACY_PARTS) scene[key]?.setVisible?.(false);
}

function ensureShotgunHandOverlay(scene) {
  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const render = presentation.body.render;
  const initialKey = presentation.body.idle[0].handOverlayKey;
  const overlay = scene.__shotgunHandOverlay || scene.add.image(scene.hero.x, scene.hero.y, initialKey);
  scene.__shotgunHandOverlay = overlay;
  overlay
    .setVisible(true)
    .setTexture(initialKey)
    .setOrigin(render.originX, render.originY)
    .setScale(render.scale)
    .setFlipX(false)
    .setFlipY(false)
    .setRotation(0)
    .clearTint?.();
  return overlay;
}

function installShotgunAimLayer(scene) {
  if (!scene?.hero || !scene?.weaponV3Gun || !scene?.weaponSystem) {
    throw Error('Shotgun production presentation requires hero, weaponV3Gun and WeaponSystem');
  }

  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const render = presentation.body.render;
  hideLegacyWeaponParts(scene);
  scene.weaponSprite = scene.weaponV3Gun;
  scene.weaponModule = scene.weaponV3Gun;
  scene.weaponV3Gun
    .setVisible(true)
    .setTexture(presentation.weapon.key)
    .setCrop()
    .setOrigin(presentation.weapon.origin.x, presentation.weapon.origin.y)
    .setScale(render.scale)
    .setFlipX(false)
    .setFlipY(false)
    .clearTint?.();
  scene.hero
    .stop()
    .setTexture(presentation.body.idle[0].key)
    .setOrigin(render.originX, render.originY)
    .setScale(render.scale)
    .setRotation(presentation.weapon.hold.bodyRotationRadians)
    .setVisible(true);
  const handOverlay = ensureShotgunHandOverlay(scene);

  scene.__shotgunGrip = new Phaser.Math.Vector2();
  scene.__shotgunSupportHand = new Phaser.Math.Vector2();
  scene.__shotgunWeaponSupport = new Phaser.Math.Vector2();
  scene.__shotgunMuzzle = new Phaser.Math.Vector2();
  scene.__shotgunTwoHandHold = {
    mode: presentation.weapon.hold.mode,
    layerMode: presentation.layers.mode,
    locked: false,
    errorPx: Number.POSITIVE_INFINITY,
    runtimeRotation: presentation.weapon.hold.runtimeRotation,
    runtimeBodyRotation: presentation.weapon.hold.runtimeBodyRotation
  };
  scene.updateWeaponPose = function updateShotgunWeaponPose() {
    const pose = resolveShotgunPresentationPose(this.hero.x, this.hero.y, this.weaponAim);
    const heroDepth = Number.isFinite(Number(this.hero.depth)) ? Number(this.hero.depth) : 30;
    const overlayKey = getShotgunHandOverlayKey(this.hero.texture?.key);
    this.hero
      .setFlipX(pose.facing === 'left')
      .setRotation(pose.bodyRotation);
    this.weaponV3Gun
      .setPosition(pose.grip.x, pose.grip.y)
      .setRotation(pose.weaponRotation)
      .setDepth(heroDepth + presentation.layers.weaponDepthOffset)
      .setFlipX(pose.weaponFlipX);
    handOverlay
      .setPosition(this.hero.x, this.hero.y)
      .setTexture(overlayKey)
      .setFlipX(pose.weaponFlipX)
      .setRotation(pose.bodyRotation)
      .setDepth(heroDepth + presentation.layers.handOverlayDepthOffset)
      .setVisible(true);
    this.__shotgunGrip.set(pose.grip.x, pose.grip.y);
    this.__shotgunSupportHand.set(pose.supportHand.x, pose.supportHand.y);
    this.__shotgunWeaponSupport.set(pose.weaponSupport.x, pose.weaponSupport.y);
    this.__shotgunMuzzle.set(pose.muzzle.x, pose.muzzle.y);
    this.__shotgunTwoHandHold.locked = pose.twoHandLocked;
    this.__shotgunTwoHandHold.errorPx = pose.twoHandError;
    this.visualAimAngle = pose.angle;
    this.__c4Grip?.copy?.(this.__shotgunGrip);
    this.__c4Muzzle?.copy?.(this.__shotgunMuzzle);
  };

  scene.weaponSystem.setMuzzleResolver(() => {
    const pose = resolveShotgunPresentationPose(scene.hero.x, scene.hero.y, scene.weaponAim);
    return new Phaser.Math.Vector2(pose.muzzle.x, pose.muzzle.y);
  });
  scene.weaponSystem.setFireFeedback(({ visualAngle, muzzle }) => {
    const angle = Number.isFinite(visualAngle) ? visualAngle : scene.visualAimAngle;
    const flash = scene.add.image(muzzle.x, muzzle.y, 'flash')
      .setDepth(33)
      .setRotation(angle)
      .setScale(.34)
      .setAlpha(.92);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: .08,
      duration: 48,
      onComplete: () => flash.destroy()
    });
    scene.cameras?.main?.shake?.(38, .0011);
    scene.playTone?.(118, .038, 'square', .016, -55);
  });
  scene.updateWeaponPose();
}

function validateDefinitionPresentation(definition) {
  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const expectedIdle = presentation.body.idle.map(frame => frame.key);
  const expectedRun = presentation.body.run.map(frame => frame.key);
  const idle = definition?.animations?.idle?.frames;
  const run = definition?.animations?.run?.frames;
  if (!Array.isArray(idle) || idle.join('|') !== expectedIdle.join('|')) {
    throw Error('Shotgun character definition must use canonical idle runtime frames');
  }
  if (!Array.isArray(run) || run.join('|') !== expectedRun.join('|')) {
    throw Error('Shotgun character definition must use canonical run runtime frames');
  }
  if (definition?.render?.idleTexture !== expectedIdle[0]) {
    throw Error('Shotgun character definition must use canonical idle texture');
  }
}

function c5Checks(scene) {
  const twoHandHold = scene.__shotgunTwoHandHold;
  const heroDepth = Number.isFinite(Number(scene.hero?.depth)) ? Number(scene.hero.depth) : 30;
  const weaponDepth = Number(scene.weaponV3Gun?.depth);
  const overlayDepth = Number(scene.__shotgunHandOverlay?.depth);
  const expectedOverlayKey = getShotgunHandOverlayKey(scene.hero?.texture?.key);
  return {
    shotgunBody: scene.hero?.texture?.key === SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key,
    shotgunWeapon: scene.weaponV3Gun?.texture?.key === SHOTGUN_RUNTIME_PRESENTATION.weapon.key,
    separateWeaponLayer: scene.weaponModule === scene.weaponV3Gun && scene.weaponV3Gun !== scene.hero,
    bakedHandOverlay:
      scene.__shotgunHandOverlay?.texture?.key === expectedOverlayKey
      && SHOTGUN_RUNTIME_PRESENTATION.body.handOverlay.runtimeCrop === false,
    canonicalLayerStack:
      twoHandHold?.layerMode === 'body-weapon-front-hands'
      && heroDepth < weaponDepth
      && weaponDepth < overlayDepth,
    noRuntimeLimbSplit: !scene.__shotgunLayeredLocomotion,
    noLegacyHands: HIDDEN_LEGACY_PARTS.every(key => !scene[key] || scene[key].visible === false),
    twoHandWeaponLock:
      twoHandHold?.mode === 'two-hand-fixed'
      && twoHandHold?.runtimeRotation === false
      && twoHandHold?.runtimeBodyRotation === false
      && twoHandHold?.locked === true,
    bodyRotationLocked: Math.abs(Number(scene.hero?.rotation) || 0) < 1e-8,
    weaponRotationLocked: Math.abs(Number(scene.weaponV3Gun?.rotation) || 0) < 1e-8,
    handOverlayRotationLocked: Math.abs(Number(scene.__shotgunHandOverlay?.rotation) || 0) < 1e-8,
    muzzleAligned: Number.isFinite(scene.__shotgunMuzzle?.x) && Number.isFinite(scene.__shotgunMuzzle?.y)
  };
}

function d1Checks(scene) {
  const weaponDefinition = scene.characterSystem?.weaponDefinition;
  const runtimeFireProfile = scene.primaryWeapon?.fireProfile;
  const canonicalFireProfile = weaponDefinition?.fireProfile;
  return {
    ...c5Checks(scene),
    characterSystem:
      scene.characterId === 'shotgun'
      && scene.characterDefinition?.id === 'shotgun'
      && scene.characterSystem?.characterId === 'shotgun'
      && scene.__characterSystemReady === true,
    weaponIdentity:
      weaponDefinition?.id === 'shotgun'
      && scene.startingWeaponId === 'shotgun'
      && scene.activeWeaponId === 'shotgun'
      && scene.primaryWeapon?.id === 'shotgun',
    weaponVolley:
      runtimeFireProfile?.projectileCount === canonicalFireProfile?.projectileCount
      && runtimeFireProfile?.halfSpreadRadians === canonicalFireProfile?.halfSpreadRadians
      && runtimeFireProfile?.volleyDamageMultiplier === canonicalFireProfile?.volleyDamageMultiplier
  };
}

export async function installShotgunC5Presentation(scene) {
  await ensureShotgunRuntimeAssets(scene);
  installShotgunAimLayer(scene);
  return { checks: c5Checks(scene) };
}

export async function installShotgunD1Presentation(scene, definition) {
  await ensureShotgunRuntimeAssets(scene);
  validateDefinitionPresentation(definition);
  if (scene.characterSystem?.characterId !== 'shotgun') {
    throw Error('Shotgun D1 presentation requires aligned CharacterSystem');
  }
  scene.characterSystem.installProductionVisuals();
  installShotgunAimLayer(scene);
  const previousUpdateMovement = scene.updateMovement?.bind(scene);
  if (previousUpdateMovement && !scene.__shotgunLocomotionWrapped) {
    scene.updateMovement = function updateShotgunMovement(time) {
      previousUpdateMovement(time);
      this.characterSystem.updateLocomotionVisuals();
      // Re-apply the canonical hold after locomotion so movement lean/flip can never
      // leave body, weapon, or baked hand overlay in different transforms for a frame.
      this.updateWeaponPose?.();
    };
    scene.__shotgunLocomotionWrapped = true;
  }
  return { checks: d1Checks(scene) };
}

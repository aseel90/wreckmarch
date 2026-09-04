/* WRECKMARCH — Shotgun production presentation adapter.
 * This module owns only Shotgun body/weapon presentation for C5/D1. Registration
 * is safe while the character is locked: CharacterRegistry still blocks gameplay
 * selection until an approved character definition and full-run gate exist.
 */
import {
  SHOTGUN_RUNTIME_PRESENTATION,
  listShotgunRuntimeAssets,
  queueShotgunRuntimeAssets
} from './shotgun-runtime-presentation.js?v=2';

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

export function resolveShotgunPresentationPose(heroX, heroY, aimRadians = 0) {
  const angle = normalizeAngle(aimRadians);
  const presentation = SHOTGUN_RUNTIME_PRESENTATION;
  const scale = presentation.body.render.scale;
  const left = Math.cos(angle) < 0;
  const grip = presentation.body.gripSocket;
  const gripX = Number(heroX) + (left ? -grip.offsetX : grip.offsetX);
  const gripY = Number(heroY) + grip.offsetY;
  const muzzleLocal = presentation.weapon.muzzleFromGrip;
  const dx = muzzleLocal.x * scale;
  const dy = muzzleLocal.y * scale;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return Object.freeze({
    angle,
    facing: left ? 'left' : 'right',
    grip: Object.freeze({ x: gripX, y: gripY }),
    muzzle: Object.freeze({
      x: gripX + (dx * cos) - (dy * sin),
      y: gripY + (dx * sin) + (dy * cos)
    }),
    weaponDepthOffset: sin < 0 ? -1 : 1
  });
}

async function resolveShotgunBrowserAssetSource(asset) {
  if (!asset?.path?.endsWith?.('.svg') || asset.key === SHOTGUN_RUNTIME_PRESENTATION.weapon.key) {
    return asset.path;
  }
  const response = await fetch(asset.path, { cache: 'no-store' });
  if (!response.ok) throw Error(`Shotgun body wrapper fetch failed: ${asset.key} (${response.status})`);
  const svg = await response.text();
  const match = svg.match(/href=["'](data:image\/png;base64,[^"']+)["']/i);
  if (!match?.[1]) throw Error(`Shotgun body wrapper is missing embedded PNG raster: ${asset.key}`);
  return match[1];
}

async function ensureShotgunRuntimeAssets(scene) {
  const assets = listShotgunRuntimeAssets();
  const missing = assets.filter(asset => !scene?.textures?.exists?.(asset.key));
  if (missing.length === 0) return SHOTGUN_RUNTIME_PRESENTATION;
  if (!scene?.load?.image || !scene?.load?.once || !scene?.load?.start) {
    throw Error('Shotgun production presentation requires Phaser image-loader boundaries');
  }

  const browserSources = await Promise.all(missing.map(async asset => ({
    ...asset,
    path: await resolveShotgunBrowserAssetSource(asset)
  })));

  await new Promise((resolve, reject) => {
    let settled = false;
    const missingKeys = new Set(missing.map(asset => asset.key));
    const fail = file => {
      if (settled || !missingKeys.has(file?.key)) return;
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
    queueShotgunRuntimeAssets(scene, browserSources);
    scene.load.start();
  });
  return SHOTGUN_RUNTIME_PRESENTATION;
}

function hideLegacyWeaponParts(scene) {
  for (const key of HIDDEN_LEGACY_PARTS) scene[key]?.setVisible?.(false);
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
    .setRotation(0);

  scene.__shotgunGrip = new Phaser.Math.Vector2();
  scene.__shotgunMuzzle = new Phaser.Math.Vector2();
  scene.updateWeaponPose = function updateShotgunWeaponPose() {
    const pose = resolveShotgunPresentationPose(this.hero.x, this.hero.y, this.weaponAim);
    this.hero.setFlipX(pose.facing === 'left');
    this.weaponV3Gun
      .setPosition(pose.grip.x, pose.grip.y)
      .setRotation(pose.angle)
      .setDepth((this.hero.depth || 30) + pose.weaponDepthOffset)
      .setFlipX(false);
    this.__shotgunGrip.set(pose.grip.x, pose.grip.y);
    this.__shotgunMuzzle.set(pose.muzzle.x, pose.muzzle.y);
    this.visualAimAngle = pose.angle;
    this.__c4Grip?.copy?.(this.__shotgunGrip);
    this.__c4Muzzle?.copy?.(this.__shotgunMuzzle);
  };

  scene.weaponSystem.setMuzzleResolver(spread => {
    const pose = resolveShotgunPresentationPose(scene.hero.x, scene.hero.y, scene.weaponAim + spread);
    return new Phaser.Math.Vector2(pose.muzzle.x, pose.muzzle.y);
  });
  scene.weaponSystem.setFireFeedback(({ visualAngle, muzzle }) => {
    const angle = Number.isFinite(visualAngle) ? visualAngle : scene.weaponAim;
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
  return {
    shotgunBody: scene.hero?.texture?.key === SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key,
    shotgunWeapon: scene.weaponV3Gun?.texture?.key === SHOTGUN_RUNTIME_PRESENTATION.weapon.key,
    separateWeaponLayer: scene.weaponModule === scene.weaponV3Gun && scene.weaponV3Gun !== scene.hero,
    noLegacyHands: HIDDEN_LEGACY_PARTS.every(key => !scene[key] || scene[key].visible === false),
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
    };
    scene.__shotgunLocomotionWrapped = true;
  }
  return { checks: d1Checks(scene) };
}

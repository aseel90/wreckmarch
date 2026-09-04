import { installUpgradeScene } from './upgrades/upgrade-scene.js?v=1';

/* WRECKMARCH — Phase C.1: landscape HUD + 8-way two-hand aim; canonical UpgradeScene is installed by Phase C */
const W = 960;
const H = 540;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.primaryWeapon && scene.upgradeLevels) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase C.1');
}

function loadAimAssets(scene) {
  if (scene.textures.exists('c1-aim-atlas')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Phase C.1 aim asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      if (!failed) resolve();
    });
    scene.load.svg('c1-aim-atlas', './assets/hero/aim-poses.svg');
    scene.load.start();
  });
}

function installLandscapeCanvas(scene) {
  scene.scale.setGameSize(W, H);
  scene.cameras.main.setSize(W, H);
  scene.cameras.main.setViewport(0, 0, W, H);
  scene.cameras.main.setBounds(0, 0, 2200, 2200);
  scene.cameras.main.centerOn(scene.hero.x, scene.hero.y);
}

function reinstallLandscapeJoystick(scene) {
  scene.input.off('pointerdown');
  scene.input.off('pointermove');
  scene.input.off('pointerup');
  scene.input.off('pointerupoutside');
  scene.input.once('pointerdown', () => scene.unlockAudio?.());

  scene.joy.radius = 62;
  scene.joy.active = false;
  scene.joy.id = null;
  const homeX = 96;
  const homeY = H - 92;
  scene.joyBase.setPosition(homeX, homeY).setAlpha(.38).setScrollFactor(0);
  scene.joyKnob.setPosition(homeX, homeY).setAlpha(.4).setScrollFactor(0);

  scene.input.on('pointerdown', p => {
    if (scene.gameOver || scene.upgradeOpen || p.y < 92 || p.x > W * .58) return;
    scene.joy.id = p.id;
    scene.joy.active = true;
    scene.joy.origin.set(p.x, p.y);
    scene.joy.current.set(p.x, p.y);
    scene.joyBase.setPosition(p.x, p.y).setAlpha(.7);
    scene.joyKnob.setPosition(p.x, p.y).setAlpha(.86);
  });
  scene.input.on('pointermove', p => {
    if (!scene.joy.active || p.id !== scene.joy.id) return;
    scene.joy.current.set(p.x, p.y);
    const d = new Phaser.Math.Vector2(p.x - scene.joy.origin.x, p.y - scene.joy.origin.y);
    if (d.length() > scene.joy.radius) d.setLength(scene.joy.radius);
    scene.joyKnob.setPosition(scene.joy.origin.x + d.x, scene.joy.origin.y + d.y);
  });
  const release = p => {
    if (p.id !== scene.joy.id) return;
    scene.joy.active = false;
    scene.joy.id = null;
    scene.joyBase.setPosition(homeX, homeY).setAlpha(.38);
    scene.joyKnob.setPosition(homeX, homeY).setAlpha(.4);
  };
  scene.input.on('pointerup', release);
  scene.input.on('pointerupoutside', release);
}

function angleToPose(angle) {
  const normalized = Phaser.Math.Angle.Normalize(angle);
  return Math.round(normalized / (Math.PI / 4)) % 8;
}

function installTwoHandAim(scene) {
  scene.weaponRig?.setVisible?.(false);
  scene.weaponArm?.setVisible?.(false);
  scene.weaponSprite?.setVisible?.(false);

  scene.aimPose?.destroy?.();
  scene.aimPose = scene.add.image(scene.hero.x, scene.hero.y + 8, 'c1-aim-atlas')
    .setOrigin(.5)
    .setCrop(0, 0, 120, 100)
    .setDisplaySize(90, 75)
    .setDepth(26);
  scene.weaponSprite = scene.aimPose;
  scene.visualAimAngle = 0;
  scene.currentAimPose = 0;

  scene.updateWeaponPose = function() {
    const pose = angleToPose(this.weaponAim);
    if (pose !== this.currentAimPose) {
      this.currentAimPose = pose;
      this.aimPose.setCrop(pose * 120, 0, 120, 100);
    }
    this.visualAimAngle = pose * (Math.PI / 4);
    this.aimPose.setPosition(this.hero.x, this.hero.y + 8);
    const behind = pose >= 5 && pose <= 7;
    this.aimPose.setDepth(behind ? 18 : 27);
  };

  scene.weaponSystem.configureHero({
    aimYOffset: 6,
    targetTurnRate: .24,
    moveTurnRate: .18,
    twinSpread2: .055,
    twinSpread3: .085,
    muzzleResolver: spread => {
      const visual = scene.visualAimAngle + spread;
      const radius = 49;
      return new Phaser.Math.Vector2(
        scene.hero.x + Math.cos(visual) * radius,
        scene.hero.y + 8 + Math.sin(visual) * radius
      );
    },
    fireFeedback: ({ visualAngle, muzzle }) => {
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash')
        .setDepth(31).setRotation(visualAngle).setScale(.5);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .08, duration: 68, onComplete: () => flash.destroy() });
      scene.tweens.killTweensOf(scene.aimPose);
      scene.aimPose.setDisplaySize(85, 71);
      scene.tweens.add({ targets: scene.aimPose, displayWidth: 90, displayHeight: 75, duration: 72, ease: 'Quad.Out' });
      scene.playTone?.(165, .045, 'square', .019, -34);
    }
  });

  scene.updateWeaponPose();
}

function installLandscapeHud(scene) {
  scene.children.list
    .filter(obj => obj?.name === 'phase-b-hud-shade' || obj?.name === 'c1-hud-shade')
    .forEach(obj => obj.destroy());

  scene.add.rectangle(W / 2, 45, W, 90, 0x090d13, .91)
    .setDepth(890).setScrollFactor(0).setName('c1-hud-shade');

  scene.titleText.setPosition(24, 14).setFontSize(22).setDepth(920).setScrollFactor(0);
  scene.timerText.setPosition(W - 24, 16).setFontSize(16).setDepth(920).setScrollFactor(0);
  scene.waveText.setPosition(W / 2, 18).setFontSize(12).setDepth(920).setScrollFactor(0);
  scene.levelText.setPosition(205, 53).setFontSize(12).setDepth(922).setScrollFactor(0);
  scene.scrapText.setPosition(W - 205, 50).setFontSize(13).setDepth(922).setScrollFactor(0);

  scene.xpBg?.destroy?.();
  scene.xpFill?.destroy?.();
  scene.xpBg = scene.add.rectangle(W / 2, 61, 470, 12, 0x111820, .98)
    .setStrokeStyle(2, 0x59636d, .75).setDepth(918).setScrollFactor(0);
  scene.xpFill = scene.add.rectangle(W / 2 - 232, 61, 464, 7, 0x55d7e5, 1)
    .setOrigin(0, .5).setDepth(919).setScrollFactor(0);

  scene.hint.setPosition(W / 2, H - 12).setFontSize(10).setDepth(800).setScrollFactor(0);
  scene.joyBase.setPosition(92, H - 118).setScrollFactor(0);
  scene.joyKnob.setPosition(92, H - 118).setScrollFactor(0);

  if (scene.hitboxButton) {
    scene.hitboxButton.setPosition(W - 18, H - 50).setScrollFactor(0).setDepth(5100);
  }

  scene.refreshProgressHud = function() {
    const ratio = Phaser.Math.Clamp(this.scrapXp / Math.max(1, this.scrapNeeded), 0, 1);
    this.levelText.setText(`LV ${this.level}`);
    this.scrapText.setText(`SCRAP ${this.scrapXp}/${this.scrapNeeded}`);
    this.xpFill.setScale(ratio, 1);
  };
  scene.refreshProgressHud();
}

function refineLandscapeScale(scene) {
  scene.hero.setScale(.70);
  scene.enemies.children.iterate(enemy => {
    if (!enemy?.active) return;
    enemy.setScale(enemy.elite ? .67 : .54);
    enemy.hitRadius = enemy.elite ? 29 : 24;
  });

  const baseSpawn = scene.spawnEnemy.bind(scene);
  scene.spawnEnemy = function(elite = false) {
    const before = new Set(this.enemies.getChildren());
    baseSpawn(elite);
    this.enemies.children.iterate(enemy => {
      if (!enemy?.active || before.has(enemy)) return;
      enemy.setScale(enemy.elite ? .67 : .54);
      enemy.hitRadius = enemy.elite ? 29 : 24;
    });
  };

  scene.children.list.forEach(obj => {
    const key = obj?.texture?.key || '';
    if (key === 'b1-wreck-a' || key === 'b1-wreck-b') {
      obj.setScale(Math.max(obj.scaleX, 1.45));
    }
  });
}

function addOrientationSignal() {
  document.documentElement.dataset.wreckmarchOrientation = 'landscape';
}

export async function applyPhaseC1() {
  const scene = await getScene();
  await loadAimAssets(scene);
  installLandscapeCanvas(scene);
  reinstallLandscapeJoystick(scene);
  installTwoHandAim(scene);
  installLandscapeHud(scene);
  if (typeof installUpgradeScene !== 'function' || scene.__upgradeSceneOwner !== 'src/upgrades/upgrade-scene.js') {
    throw new Error('Phase C.1 requires canonical UpgradeScene installed by Phase C');
  }
  refineLandscapeScale(scene);
  addOrientationSignal();

  window.__WM_PHASE_C1__ = true;
  document.documentElement.dataset.wreckmarchPhaseC1 = 'active';
  window.__WM_LOG__?.('Phase C.1 active: landscape HUD + 8-way two-hand aim; canonical upgrade scene verified');
  return true;
}

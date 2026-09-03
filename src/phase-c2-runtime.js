/* WRECKMARCH — Phase C.2: adaptive viewport + dimensional two-hand weapon art */
const BASE_H = 540;
const MIN_W = 760;
const MAX_W = 1180;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.primaryWeapon && scene.upgradeLevels) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase C.2');
}

function getViewport() {
  const vv = window.visualViewport;
  const cssW = Math.max(320, Math.round(vv?.width || window.innerWidth || 960));
  const cssH = Math.max(240, Math.round(vv?.height || window.innerHeight || 540));
  const ratio = cssW / Math.max(1, cssH);
  const logicalW = Phaser.Math.Clamp(Math.round(BASE_H * ratio), MIN_W, MAX_W);
  return { cssW, cssH, ratio, logicalW, logicalH: BASE_H };
}

function loadVisualAssets(scene) {
  if (scene.textures.exists('c2-aim-atlas')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Phase C.2 asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      if (!failed) resolve();
    });
    if (!scene.textures.exists('c2-aim-atlas')) scene.load.svg('c2-aim-atlas', './assets/hero/aim-poses-v2.svg');
    scene.load.start();
  });
}

function repositionHud(scene, W, H) {
  scene.children.list
    .filter(obj => obj?.name === 'c2-hud-shade')
    .forEach(obj => obj.destroy());

  const edge = Phaser.Math.Clamp(Math.round(W * .018), 14, 22);
  const hudH = 66;
  scene.add.rectangle(W / 2, hudH / 2, W, hudH, 0x090d13, .94)
    .setDepth(890).setScrollFactor(0).setName('c2-hud-shade');

  // Mobile-first hierarchy: run identity left, progression centered, time right.
  scene.titleText.setOrigin(0, 0).setPosition(edge, 7).setFontSize(17).setDepth(920).setScrollFactor(0);
  scene.waveText.setOrigin(0, 0).setPosition(edge, 33).setFontSize(10).setDepth(920).setScrollFactor(0);
  scene.timerText.setOrigin(1, 0).setPosition(W - edge, 8).setFontSize(15).setDepth(920).setScrollFactor(0);

  const barW = Phaser.Math.Clamp(Math.round(W * .43), 350, 500);
  const barX = W / 2;
  const barY = 43;
  const labelGap = 13;
  scene.levelText.setOrigin(1, .5).setPosition(barX - barW / 2 - labelGap, barY).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.scrapText.setOrigin(0, .5).setPosition(barX + barW / 2 + labelGap, barY).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.xpBg?.destroy?.();
  scene.xpFill?.destroy?.();
  scene.xpBg = scene.add.rectangle(barX, barY, barW, 11, 0x111820, .98)
    .setStrokeStyle(1.5, 0x68727c, .78).setDepth(918).setScrollFactor(0);
  scene.xpFill = scene.add.rectangle(barX - (barW - 6) / 2, barY, barW - 6, 6, 0x55d7e5, 1)
    .setOrigin(0, .5).setDepth(919).setScrollFactor(0);

  scene.hint.setPosition(W / 2, H - 8).setFontSize(9).setDepth(800).setScrollFactor(0);
  const joyX = Math.max(74, Math.round(W * .085));
  const joyY = H - 78;
  scene.joyBase.setPosition(joyX, joyY).setScrollFactor(0);
  scene.joyKnob.setPosition(joyX, joyY).setScrollFactor(0);
  scene.joyHomeX = joyX;
  scene.joyHomeY = joyY;
  if (scene.hitboxButton) scene.hitboxButton.setPosition(W - edge, H - 42).setScrollFactor(0).setDepth(5100);

  scene.__mobileHudLayout = { width: W, height: H, hudH, edge, barX, barY, barW };
  document.documentElement.dataset.wreckmarchHud = 'mobile-compact-v1';
  scene.refreshProgressHud?.();
}

function applyAdaptiveViewport(scene) {
  const resize = () => {
    const { logicalW, logicalH } = getViewport();
    if (scene.__c2Width === logicalW && scene.__c2Height === logicalH) return;
    scene.__c2Width = logicalW;
    scene.__c2Height = logicalH;
    scene.scale.setGameSize(logicalW, logicalH);
    scene.cameras.main.setSize(logicalW, logicalH);
    scene.cameras.main.setViewport(0, 0, logicalW, logicalH);
    scene.cameras.main.setBounds(0, 0, 2200, 2200);
    scene.cameras.main.setZoom(.90);
    repositionHud(scene, logicalW, logicalH);
    document.documentElement.style.setProperty('--wm-logical-ratio', String(logicalW / logicalH));
    document.documentElement.dataset.wreckmarchViewport = `${logicalW}x${logicalH}`;
  };
  resize();
  scene.__c2ResizeHandler = () => requestAnimationFrame(resize);
  window.addEventListener('resize', scene.__c2ResizeHandler, { passive: true });
  window.visualViewport?.addEventListener?.('resize', scene.__c2ResizeHandler, { passive: true });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    window.removeEventListener('resize', scene.__c2ResizeHandler);
    window.visualViewport?.removeEventListener?.('resize', scene.__c2ResizeHandler);
  });
}

function angleToPose(angle) {
  const normalized = Phaser.Math.Angle.Normalize(angle);
  return Math.round(normalized / (Math.PI / 4)) % 8;
}

const MUZZLE_OFFSETS = [
  [61, 8], [45, 46], [8, 61], [-45, 46], [-61, 8], [-45, -34], [8, -48], [45, -34]
];

function installDimensionalAim(scene) {
  scene.aimPose?.destroy?.();
  scene.weaponRig?.setVisible?.(false);
  scene.weaponArm?.setVisible?.(false);
  scene.weaponSprite?.setVisible?.(false);

  scene.aimPose = scene.add.image(scene.hero.x, scene.hero.y + 5, 'c2-aim-atlas')
    .setOrigin(.5)
    .setCrop(0, 0, 160, 120)
    .setDisplaySize(112, 84)
    .setDepth(28);
  scene.weaponSprite = scene.aimPose;
  scene.currentAimPose = 0;
  scene.visualAimAngle = 0;

  scene.updateWeaponPose = function() {
    const pose = angleToPose(this.weaponAim);
    if (pose !== this.currentAimPose) {
      this.currentAimPose = pose;
      this.aimPose.setCrop(pose * 160, 0, 160, 120);
    }
    this.visualAimAngle = pose * (Math.PI / 4);
    this.aimPose.setPosition(this.hero.x, this.hero.y + 5);
    this.aimPose.setDepth(pose >= 5 && pose <= 7 ? 18 : 29);
  };

  scene.weaponSystem.configureHero({
    aimYOffset: 5,
    targetTurnRate: .28,
    moveTurnRate: .20,
    twinSpread2: .05,
    twinSpread3: .08,
    muzzleResolver: spread => {
      const pose = scene.currentAimPose || 0;
      const [ox, oy] = MUZZLE_OFFSETS[pose];
      if (Math.abs(spread) < .0001) return new Phaser.Math.Vector2(scene.hero.x + ox, scene.hero.y + 5 + oy);
      const radius = Math.hypot(ox, oy);
      const ang = Math.atan2(oy, ox) + spread;
      return new Phaser.Math.Vector2(scene.hero.x + Math.cos(ang) * radius, scene.hero.y + 5 + Math.sin(ang) * radius);
    },
    fireFeedback: ({ visualAngle, muzzle }) => {
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash')
        .setDepth(31).setRotation(visualAngle).setScale(.52);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .08, duration: 70, onComplete: () => flash.destroy() });
      scene.tweens.killTweensOf(scene.aimPose);
      scene.aimPose.setDisplaySize(106, 80);
      scene.tweens.add({ targets: scene.aimPose, displayWidth: 112, displayHeight: 84, duration: 80, ease: 'Quad.Out' });
      scene.playTone?.(165, .045, 'square', .019, -34);
    }
  });

  scene.updateWeaponPose();
}

export async function applyPhaseC2() {
  const scene = await getScene();
  await loadVisualAssets(scene);
  applyAdaptiveViewport(scene);
  installDimensionalAim(scene);
  window.__WM_PHASE_C2__ = true;
  document.documentElement.dataset.wreckmarchPhaseC2 = 'active';
  window.__WM_LOG__?.('Phase C.2 active: adaptive viewport + dimensional weapon poses');
  return true;
}

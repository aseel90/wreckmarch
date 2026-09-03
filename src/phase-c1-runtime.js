import { installUpgradeScene } from './upgrades/upgrade-scene.js?v=1';

/* WRECKMARCH — Phase C.1: landscape HUD + 8-way two-hand aim + canonical upgrade-scene owner */
const W = 960;
const H = 540;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.weapon) return scene;
    await wait(40);
  }
  throw new Error('Phase C.1 scene timeout');
}

function fillTexture(scene, key, source) {
  if (scene.textures.exists(key)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let failed = false;
    const onError = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Phase C.1 asset failed: ${file?.key || key}`));
    };
    scene.load.once('loaderror', onError);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', onError);
      if (!failed) resolve();
    });
    scene.load.svg(key, source);
    scene.load.start();
  });
}

async function loadHudAssets(scene) {
  await Promise.all([
    fillTexture(scene, 'c1-hud-panel', './assets/ui/hud-panel.svg'),
    fillTexture(scene, 'c1-aim-poses', './assets/hero/aim-poses.svg')
  ]);
}

function reinstallLandscapeJoystick(scene) {
  scene.joyBase?.destroy?.();
  scene.joyKnob?.destroy?.();
  const joyX = 92;
  const joyY = H - 82;
  scene.joyBase = scene.add.circle(joyX, joyY, 52, 0x0c141d, .38).setScrollFactor(0).setDepth(1000).setStrokeStyle(2, 0x68c7d4, .26);
  scene.joyKnob = scene.add.circle(joyX, joyY, 25, 0x91dbe5, .40).setScrollFactor(0).setDepth(1001);
  scene.joy.active = false;
  scene.joy.id = null;
  scene.joy.origin?.set?.(joyX, joyY);
  scene.joy.current?.set?.(joyX, joyY);
}

function installTwoHandAim(scene) {
  scene.weapon?.setVisible?.(false);
  scene.weaponV3Gun?.destroy?.();
  scene.weaponV3HandA?.destroy?.();
  scene.weaponV3HandB?.destroy?.();

  scene.weaponV3Gun = scene.add.image(scene.hero.x, scene.hero.y, 'c1-aim-poses').setDepth(32);
  scene.weaponV3HandA = scene.add.circle(scene.hero.x, scene.hero.y, 5, 0xe7a56e, 1).setDepth(33);
  scene.weaponV3HandB = scene.add.circle(scene.hero.x, scene.hero.y, 5, 0xe7a56e, 1).setDepth(33);

  const old = scene.updateWeaponPose?.bind(scene);
  scene.updateWeaponPose = function() {
    old?.();
    const dx = Number(this.aimDir?.x || this.lastAim?.x || 1);
    const dy = Number(this.aimDir?.y || this.lastAim?.y || 0);
    const angle = Math.atan2(dy, dx);
    const index = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
    const cropW = 128;
    const cropH = 128;
    this.weaponV3Gun.setCrop(index * cropW, 0, cropW, cropH).setDisplaySize(108, 108);
    const forward = 28;
    const side = 10;
    const px = this.hero.x + Math.cos(angle) * forward;
    const py = this.hero.y + Math.sin(angle) * forward - 5;
    const sx = Math.cos(angle + Math.PI / 2) * side;
    const sy = Math.sin(angle + Math.PI / 2) * side;
    this.weaponV3Gun.setPosition(px, py).setRotation(angle).setFlipY(Math.cos(angle) < 0);
    this.weaponV3HandA.setPosition(this.hero.x + Math.cos(angle) * 10 + sx, this.hero.y - 2 + Math.sin(angle) * 10 + sy);
    this.weaponV3HandB.setPosition(this.hero.x + Math.cos(angle) * 25 - sx * .35, this.hero.y - 2 + Math.sin(angle) * 25 - sy * .35);
  };
  scene.updateWeaponPose();
}

function installLandscapeHud(scene) {
  const oldHud = [scene.titleText, scene.timerText, scene.waveText, scene.levelText, scene.scrapText, scene.xpBg, scene.xpFill];
  oldHud.forEach(item => item?.destroy?.());

  const hud = scene.add.rectangle(W / 2, 31, W, 62, 0x090d12, .74).setScrollFactor(0).setDepth(990);
  hud.name = 'c1-hud-shade';
  scene.titleText = scene.add.text(18, 8, 'WRECKMARCH', { fontFamily:'Arial Black, Arial', fontSize:'18px', color:'#e4b16d' }).setScrollFactor(0).setDepth(1002);
  scene.timerText = scene.add.text(W - 18, 9, '00:00', { fontFamily:'Arial Black, Arial', fontSize:'14px', color:'#eef3f6' }).setOrigin(1,0).setScrollFactor(0).setDepth(1002);
  scene.waveText = scene.add.text(W/2, 9, 'WAVE 1', { fontFamily:'Arial Black, Arial', fontSize:'10px', color:'#8fd5df' }).setOrigin(.5,0).setScrollFactor(0).setDepth(1002);
  scene.xpBg = scene.add.rectangle(W/2, 44, 330, 7, 0x1b252e, .95).setScrollFactor(0).setDepth(1002);
  scene.xpFill = scene.add.rectangle(W/2 - 165, 44, 0, 7, 0x59d4e2, 1).setOrigin(0,.5).setScrollFactor(0).setDepth(1003);
  scene.levelText = scene.add.text(W/2 - 178, 43, 'LV 1', { fontFamily:'Arial Black, Arial', fontSize:'9px', color:'#c8d1d8' }).setOrigin(1,.5).setScrollFactor(0).setDepth(1003);
  scene.scrapText = scene.add.text(W/2 + 178, 42, 'SCRAP 0', { fontFamily:'Arial Black, Arial', fontSize:'9px', color:'#c7a36a' }).setOrigin(0,.5).setScrollFactor(0).setDepth(1003);

  scene.refreshProgressHud = function() {
    this.timerText?.setText?.(this.formatTime?.(this.elapsed || 0) || '00:00');
    this.waveText?.setText?.(`WAVE ${this.wave || 1}`);
    this.levelText?.setText?.(`LV ${this.level || 1}`);
    this.scrapText?.setText?.(`SCRAP ${this.scrap || 0}`);
    const need = Math.max(1, Number(this.xpToNext || 1));
    const ratio = Phaser.Math.Clamp(Number(this.xp || 0) / need, 0, 1);
    this.xpFill?.setDisplaySize?.(330 * ratio, 7);
  };
  scene.refreshProgressHud();
}

function refineLandscapeScale(scene) {
  scene.hero.setScale(.70);
  scene.enemies.children.iterate(enemy => {
    if (enemy?.active && enemy.setScale) enemy.setScale(enemy.elite ? .70 : .55);
  });
}

function addOrientationSignal() {
  document.body.classList.add('wm-landscape-ui');
}

export async function applyPhaseC1() {
  const scene = await getScene();
  await loadHudAssets(scene);
  reinstallLandscapeJoystick(scene);
  installTwoHandAim(scene);
  installLandscapeHud(scene);
  await installUpgradeScene(scene);
  refineLandscapeScale(scene);
  addOrientationSignal();

  window.__WM_PHASE_C1__ = true;
  document.documentElement.dataset.wreckmarchPhaseC1 = 'active';
  window.__WM_LOG__?.('Phase C.1 active: landscape HUD + 8-way two-hand aim + canonical upgrade scene');
  return true;
}

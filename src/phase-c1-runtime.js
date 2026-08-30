import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from './upgrades/upgrade-runtime.js?v=6';

/* WRECKMARCH — Phase C.1: landscape HUD + 8-way two-hand aim + dedicated UpgradeScene */
const W = 960;
const H = 540;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const ICON_IDS = [
  'heavy-rivets', 'overclock', 'long-barrel', 'twin-riveter', 'fleet-feet',
  'scrap-magnet', 'armor-plate', 'call-rig', 'rig-overdrive', 'twin-cannon'
];
const CATEGORY_COLORS = {
  HERO: 0xd98446,
  UTILITY: 0x4fc8d8,
  FORTRESS: 0xd4ad62,
  EVOLUTION: 0x9d6be8
};

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

function upgradeLevel(scene, id) {
  return scene.upgradeLevels?.[id] || 0;
}

function bumpUpgrade(scene, id) {
  scene.upgradeLevels[id] = upgradeLevel(scene, id) + 1;
}

function summonRigC1(scene) {
  if (scene.rigSummoned) return;
  scene.rigSummoned = true;
  scene.rigFireDelay = 920;
  scene.rigDamageScale = .58;
  scene.rigShots = 1;
  scene.lastRigShot = 0;
  scene.cart.setVisible(true).setActive(true).setAlpha(0).setScale(.98);
  scene.cart.setPosition(scene.hero.x - 155, scene.hero.y + 95);
  scene.tweens.add({ targets: scene.cart, alpha: 1, duration: 260, ease: 'Cubic.Out' });
  scene.cameras.main.flash(110, 80, 210, 225, false);
}

function c1UpgradePool(scene) {
  return [
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'overclock', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'long-barrel', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),
    { id:'call-rig', category:'FORTRESS', title:'CALL THE RIG', desc:'Summon the moving Fortress companion.', weight:.7,
      available:()=>scene.level>=2&&!scene.rigSummoned,
      apply:()=>summonRigC1(scene) },
    { id:'rig-overdrive', category:'FORTRESS', title:'RIG OVERDRIVE', desc:'Fortress cannon fires 15% faster.', weight:.92,
      available:()=>scene.rigSummoned&&upgradeLevel(scene,'rig-overdrive')<4,
      apply:()=>{ bumpUpgrade(scene,'rig-overdrive'); scene.rigFireDelay=Math.max(360,scene.rigFireDelay*.85); } },
    { id:'twin-cannon', category:'FORTRESS', title:'TWIN CANNON', desc:'Fortress fires another support shot.', weight:.7,
      available:()=>scene.rigSummoned&&upgradeLevel(scene,'twin-cannon')<1,
      apply:()=>{ bumpUpgrade(scene,'twin-cannon'); scene.rigShots=2; } }
  ];
}

function pickC1Choices(scene, count=3) {
  const available=c1UpgradePool(scene).filter(item=>item.available());
  const chosen=[];
  while(chosen.length<count&&available.length){
    const total=available.reduce((sum,item)=>sum+item.weight,0);
    let roll=Math.random()*total;
    let index=0;
    for(;index<available.length;index++){ roll-=available[index].weight; if(roll<=0) break; }
    chosen.push(available.splice(Math.min(index,available.length-1),1)[0]);
  }
  return chosen;
}

function categoryHex(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.HERO;
}

class UpgradeScene extends Phaser.Scene {
  constructor() { super('UpgradeScene'); }

  init(data) {
    this.payload = data || {};
    this.selectedIndex = 0;
    this.cardViews = [];
    this.locked = false;
  }

  preload() {
    if (!this.textures.exists('upgrade-icon-atlas')) this.load.svg('upgrade-icon-atlas', './assets/ui/upgrade-icons.svg');
  }

  create() {
    const { gameScene, choices = [], level = 1 } = this.payload;
    this.gameScene = gameScene;
    this.choices = choices;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.add.rectangle(W / 2, H / 2, W, H, 0x06090d, .90).setDepth(0);
    this.add.text(W / 2, 38, `LEVEL ${level}`, {
      fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#59d4e2'
    }).setOrigin(.5).setDepth(3);
    this.add.text(W / 2, 68, 'CHOOSE YOUR UPGRADE', {
      fontFamily: 'Arial Black, Arial', fontSize: '25px', color: '#f0d09b'
    }).setOrigin(.5).setDepth(3);
    this.add.text(W / 2, 94, 'Build the run. Change the machine.', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#7f8c98'
    }).setOrigin(.5).setDepth(3);

    const xs = [170, 480, 790];
    choices.forEach((upgrade, i) => this.createCard(xs[i], 304, upgrade, i));
    this.refreshSelection();

    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-SPACE', () => this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-ONE', () => this.choose(0));
    this.input.keyboard?.on('keydown-TWO', () => this.choose(1));
    this.input.keyboard?.on('keydown-THREE', () => this.choose(2));
  }

  createCard(x, y, upgrade, index) {
    const accent = categoryHex(upgrade.category);
    const group = this.add.container(x, y).setDepth(5);
    const shadow = this.add.rectangle(5, 8, 270, 306, 0x000000, .28).setOrigin(.5);
    const bg = this.add.rectangle(0, 0, 270, 306, 0x151b22, .985)
      .setStrokeStyle(2, accent, .72).setOrigin(.5);
    const strip = this.add.rectangle(0, -147, 270, 12, accent, .9).setOrigin(.5);
    const iconPlate = this.add.circle(0, -70, 55, 0x0d1218, 1).setStrokeStyle(2, accent, .45);
    const iconIndex = Math.max(0, ICON_IDS.indexOf(upgrade.id));
    const icon = this.add.image(0, -70, 'upgrade-icon-atlas')
      .setCrop(iconIndex * 128, 0, 128, 128)
      .setDisplaySize(92, 92);
    const category = this.add.text(-112, -128, upgrade.category, {
      fontFamily: 'Arial Black, Arial', fontSize: '11px', color: Phaser.Display.Color.IntegerToColor(accent).rgba
    }).setOrigin(0, .5);
    const title = this.add.text(0, 0, upgrade.title, {
      fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#f1f4f6', align: 'center', wordWrap: { width: 235 }
    }).setOrigin(.5);
    const desc = this.add.text(0, 48, upgrade.desc, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#aab5bf', align: 'center', wordWrap: { width: 224 }
    }).setOrigin(.5, 0);
    const level = this.gameScene?.upgradeLevels?.[upgrade.id] || 0;
    const footer = this.add.text(0, 126, level > 0 ? `CURRENT  LV ${level}` : 'NEW UPGRADE', {
      fontFamily: 'Arial Black, Arial', fontSize: '10px', color: '#75818d'
    }).setOrigin(.5);

    const hit = this.add.zone(0, 0, 270, 306).setOrigin(.5).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { this.selectedIndex = index; this.refreshSelection(); });
    hit.on('pointerdown', (_pointer, _lx, _ly, event) => {
      event?.stopPropagation?.();
      this.choose(index);
    });

    group.add([shadow, bg, strip, iconPlate, icon, category, title, desc, footer, hit]);
    this.cardViews.push({ group, bg, strip, accent });
  }

  moveSelection(delta) {
    if (!this.choices.length || this.locked) return;
    this.selectedIndex = (this.selectedIndex + delta + this.choices.length) % this.choices.length;
    this.refreshSelection();
  }

  refreshSelection() {
    this.cardViews.forEach((view, i) => {
      const selected = i === this.selectedIndex;
      view.group.setScale(selected ? 1.035 : 1);
      view.bg.setStrokeStyle(selected ? 4 : 2, view.accent, selected ? 1 : .65);
      view.strip.setAlpha(selected ? 1 : .82);
    });
  }

  choose(index) {
    if (this.locked || !this.choices[index]) return;
    this.locked = true;
    const choice = this.choices[index];
    this.cameras.main.flash(85, 72, 202, 218, false);
    choice.apply();
    this.time.delayedCall(90, () => this.gameScene?.closeUpgradeCards?.());
  }
}

function installLandscapeUpgradeScene(scene) {
  if (!scene.game.scene.getScene('UpgradeScene')) {
    scene.game.scene.add('UpgradeScene', UpgradeScene, false);
  }

  scene.openUpgradeCards = function() {
    if (this.upgradeOpen || this.gameOver) return;
    const choices = pickC1Choices(this, 3);
    if (!choices.length) return;
    this.upgradeOpen = true;
    this.physics.pause();
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.waveEvent) this.waveEvent.paused = true;
    this.joy.active = false;
    this.joy.id = null;
    this.hero.setVelocity(0, 0);
    this.input.enabled = false;
    this.scene.launch('UpgradeScene', { gameScene: this, choices, level: this.level });
    this.scene.bringToTop('UpgradeScene');
  };

  scene.closeUpgradeCards = function() {
    if (!this.upgradeOpen) return;
    this.scene.stop('UpgradeScene');
    this.upgradeOpen = false;
    this.input.enabled = true;
    if (!this.gameOver) {
      this.physics.resume();
      if (this.spawnEvent) this.spawnEvent.paused = false;
      if (this.waveEvent) this.waveEvent.paused = false;
    }
    this.joyBase.setAlpha(.38);
    this.joyKnob.setAlpha(.4);
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.time.delayedCall(100, () => this.openUpgradeCards());
    }
  };
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
  installLandscapeUpgradeScene(scene);
  refineLandscapeScale(scene);
  addOrientationSignal();

  window.__WM_PHASE_C1__ = true;
  document.documentElement.dataset.wreckmarchPhaseC1 = 'active';
  window.__WM_LOG__?.('Phase C.1 active: landscape HUD + 8-way two-hand aim + UpgradeScene cards');
  return true;
}

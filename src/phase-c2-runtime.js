/* WRECKMARCH — Phase C.2: adaptive viewport + dimensional two-hand weapon art + illustrated cards */
const BASE_H = 540;
const MIN_W = 760;
const MAX_W = 1180;
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
  if (scene.textures.exists('c2-aim-atlas') && scene.textures.exists('c2-upgrade-art')) return Promise.resolve();
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
    if (!scene.textures.exists('c2-upgrade-art')) scene.load.svg('c2-upgrade-art', './assets/ui/upgrade-art-v2.svg');
    scene.load.start();
  });
}

function repositionHud(scene, W, H) {
  scene.children.list
    .filter(obj => obj?.name === 'c2-hud-shade')
    .forEach(obj => obj.destroy());

  scene.add.rectangle(W / 2, 36, W, 72, 0x090d13, .92)
    .setDepth(890).setScrollFactor(0).setName('c2-hud-shade');

  scene.titleText.setPosition(20, 10).setFontSize(20).setDepth(920).setScrollFactor(0);
  scene.timerText.setPosition(W - 20, 12).setFontSize(15).setDepth(920).setScrollFactor(0);
  scene.waveText.setPosition(W / 2, 12).setFontSize(11).setDepth(920).setScrollFactor(0);

  const barW = Phaser.Math.Clamp(Math.round(W * .50), 360, 650);
  const barX = W / 2;
  const barY = 51;
  scene.levelText.setPosition(barX - barW / 2 - 18, barY - 1).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.scrapText.setPosition(barX + barW / 2 + 18, barY - 2).setFontSize(12).setDepth(922).setScrollFactor(0);
  scene.xpBg?.destroy?.();
  scene.xpFill?.destroy?.();
  scene.xpBg = scene.add.rectangle(barX, barY, barW, 10, 0x111820, .98)
    .setStrokeStyle(2, 0x59636d, .75).setDepth(918).setScrollFactor(0);
  scene.xpFill = scene.add.rectangle(barX - (barW - 6) / 2, barY, barW - 6, 6, 0x55d7e5, 1)
    .setOrigin(0, .5).setDepth(919).setScrollFactor(0);

  scene.hint.setPosition(W / 2, H - 8).setFontSize(9).setDepth(800).setScrollFactor(0);
  const joyX = Math.max(74, Math.round(W * .085));
  const joyY = H - 78;
  scene.joyBase.setPosition(joyX, joyY).setScrollFactor(0);
  scene.joyKnob.setPosition(joyX, joyY).setScrollFactor(0);
  scene.joyHomeX = joyX;
  scene.joyHomeY = joyY;
  if (scene.hitboxButton) scene.hitboxButton.setPosition(W - 18, H - 42).setScrollFactor(0).setDepth(5100);
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

  scene.getWeaponMuzzle = function(spread = 0) {
    const pose = this.currentAimPose || 0;
    const [ox, oy] = MUZZLE_OFFSETS[pose];
    if (Math.abs(spread) < .0001) return new Phaser.Math.Vector2(this.hero.x + ox, this.hero.y + 5 + oy);
    const radius = Math.hypot(ox, oy);
    const ang = Math.atan2(oy, ox) + spread;
    return new Phaser.Math.Vector2(this.hero.x + Math.cos(ang) * radius, this.hero.y + 5 + Math.sin(ang) * radius);
  };

  scene.autoFire = function(time) {
    const target = this.findNearestEnemy(this.hero.x, this.hero.y, this.primaryWeapon.range);
    if (target) {
      const desired = Phaser.Math.Angle.Between(this.hero.x, this.hero.y + 5, target.x, target.y);
      this.weaponAim = Phaser.Math.Angle.RotateTo(this.weaponAim, desired, .28);
    } else if (this.move.lengthSq() > .05) {
      this.weaponAim = Phaser.Math.Angle.RotateTo(this.weaponAim, Math.atan2(this.move.y, this.move.x), .20);
    }
    this.updateWeaponPose();
    if (!target || time < this.lastShot + this.primaryWeapon.fireDelay) return;
    this.lastShot = time;

    const count = Math.max(1, this.twinShots || 1);
    const spreads = count === 1 ? [0] : count === 2 ? [-.05, .05] : [-.08, 0, .08];
    let flashPoint = null;
    spreads.forEach((spread, index) => {
      const shot = this.fireHeroBullet(this.weaponAim + spread, count > 1 ? .9 : 1);
      if (index === Math.floor(spreads.length / 2) || !flashPoint) flashPoint = shot.muzzle;
    });
    const flash = this.add.image(flashPoint.x, flashPoint.y, 'flash')
      .setDepth(31).setRotation(this.visualAimAngle).setScale(.52);
    this.tweens.add({ targets: flash, alpha: 0, scale: .08, duration: 70, onComplete: () => flash.destroy() });
    this.tweens.killTweensOf(this.aimPose);
    this.aimPose.setDisplaySize(106, 80);
    this.tweens.add({ targets: this.aimPose, displayWidth: 112, displayHeight: 84, duration: 80, ease: 'Quad.Out' });
    this.playTone?.(165, .045, 'square', .019, -34);
  };

  scene.updateWeaponPose();
}

function categoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.HERO;
}

class UpgradeSceneV2 extends Phaser.Scene {
  constructor() { super('UpgradeSceneV2'); }
  init(data) {
    this.payload = data || {};
    this.selectedIndex = 0;
    this.locked = false;
    this.cardViews = [];
  }
  create() {
    const { gameScene, choices = [], level = 1 } = this.payload;
    this.gameScene = gameScene;
    this.choices = choices;
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.add.rectangle(W / 2, H / 2, W, H, 0x06090d, .92);
    this.add.text(W / 2, 26, `LEVEL ${level}`, { fontFamily:'Arial Black, Arial', fontSize:'13px', color:'#59d4e2' }).setOrigin(.5);
    this.add.text(W / 2, 54, 'CHOOSE YOUR UPGRADE', { fontFamily:'Arial Black, Arial', fontSize:'24px', color:'#f0d09b' }).setOrigin(.5);
    this.add.text(W / 2, 79, 'Build the run. Change the machine.', { fontFamily:'Arial', fontSize:'11px', color:'#82909b' }).setOrigin(.5);

    const margin = Phaser.Math.Clamp(W * .055, 34, 58);
    const gap = Phaser.Math.Clamp(W * .022, 14, 24);
    const cardW = Math.min(292, (W - margin * 2 - gap * 2) / 3);
    const cardH = Math.min(352, H - 126);
    const total = cardW * 3 + gap * 2;
    const start = (W - total) / 2 + cardW / 2;
    choices.forEach((upgrade, i) => this.createCard(start + i * (cardW + gap), H * .60, cardW, cardH, upgrade, i));
    this.refreshSelection();

    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-SPACE', () => this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-ONE', () => this.choose(0));
    this.input.keyboard?.on('keydown-TWO', () => this.choose(1));
    this.input.keyboard?.on('keydown-THREE', () => this.choose(2));
  }
  createCard(x, y, cardW, cardH, upgrade, index) {
    const accent = categoryColor(upgrade.category);
    const group = this.add.container(x, y).setDepth(5);
    const shadow = this.add.rectangle(6, 9, cardW, cardH, 0x000000, .34).setOrigin(.5);
    const bg = this.add.rectangle(0, 0, cardW, cardH, 0x151b22, .99).setStrokeStyle(2, accent, .78).setOrigin(.5);
    const strip = this.add.rectangle(0, -cardH/2 + 7, cardW, 14, accent, .94).setOrigin(.5);
    const category = this.add.text(-cardW/2 + 18, -cardH/2 + 29, upgrade.category, {
      fontFamily:'Arial Black, Arial', fontSize:'10px', color:Phaser.Display.Color.IntegerToColor(accent).rgba
    }).setOrigin(0,.5);

    const artIndex = Math.max(0, ICON_IDS.indexOf(upgrade.id));
    const artY = -cardH * .19;
    const art = this.add.image(0, artY, 'c2-upgrade-art')
      .setCrop(artIndex * 240, 0, 240, 160)
      .setDisplaySize(cardW - 30, Math.min(132, cardH * .38));
    const artFrame = this.add.rectangle(0, artY, cardW - 30, Math.min(132, cardH * .38), 0x0c1116, 0)
      .setStrokeStyle(1.5, accent, .36);

    const title = this.add.text(0, cardH * .08, upgrade.title, {
      fontFamily:'Arial Black, Arial', fontSize:`${Math.max(14,Math.min(19,cardW/14))}px`, color:'#f2f4f6', align:'center', wordWrap:{width:cardW-34}
    }).setOrigin(.5);
    const desc = this.add.text(0, cardH * .22, upgrade.desc, {
      fontFamily:'Arial', fontSize:'12px', color:'#aab5bf', align:'center', wordWrap:{width:cardW-38}, lineSpacing:2
    }).setOrigin(.5,0);
    const level = this.gameScene?.upgradeLevels?.[upgrade.id] || 0;
    const footer = this.add.text(0, cardH/2 - 25, level > 0 ? `CURRENT  LV ${level}` : 'NEW UPGRADE', {
      fontFamily:'Arial Black, Arial', fontSize:'9px', color:'#74808b'
    }).setOrigin(.5);
    const hit = this.add.zone(0, 0, cardW, cardH).setOrigin(.5).setInteractive({ useHandCursor:true });
    hit.on('pointerover', () => { this.selectedIndex=index; this.refreshSelection(); });
    hit.on('pointerdown', (_p,_x,_y,event) => { event?.stopPropagation?.(); this.choose(index); });
    group.add([shadow,bg,strip,category,art,artFrame,title,desc,footer,hit]);
    this.cardViews.push({group,bg,strip,accent,art});
  }
  moveSelection(delta) {
    if (!this.choices.length || this.locked) return;
    this.selectedIndex = (this.selectedIndex + delta + this.choices.length) % this.choices.length;
    this.refreshSelection();
  }
  refreshSelection() {
    this.cardViews.forEach((v,i)=>{
      const selected=i===this.selectedIndex;
      v.group.setScale(selected?1.025:1);
      v.bg.setStrokeStyle(selected?4:2,v.accent,selected?1:.72);
      v.strip.setAlpha(selected?1:.82);
      v.art.setAlpha(selected?1:.88);
    });
  }
  choose(index) {
    if (this.locked || !this.choices[index]) return;
    this.locked=true;
    this.choices[index].apply();
    this.cameras.main.flash(75,75,198,215,false);
    this.time.delayedCall(80,()=>this.gameScene?.closeUpgradeCards?.());
  }
}

function installIllustratedUpgradeScene(scene) {
  if (!scene.game.scene.getScene('UpgradeSceneV2')) scene.game.scene.add('UpgradeSceneV2', UpgradeSceneV2, false);
  const openC1 = scene.openUpgradeCards.bind(scene);
  const closeC1 = scene.closeUpgradeCards.bind(scene);

  scene.openUpgradeCards = function() {
    if (this.upgradeOpen || this.gameOver) return;
    const plugin = this.scene;
    const launch = plugin.launch.bind(plugin);
    const bringToTop = plugin.bringToTop.bind(plugin);
    plugin.launch = (key, data) => launch(key === 'UpgradeScene' ? 'UpgradeSceneV2' : key, data);
    plugin.bringToTop = key => bringToTop(key === 'UpgradeScene' ? 'UpgradeSceneV2' : key);
    try { openC1(); }
    finally {
      plugin.launch = launch;
      plugin.bringToTop = bringToTop;
    }
  };

  scene.closeUpgradeCards = function() {
    this.scene.stop('UpgradeSceneV2');
    closeC1();
  };
}

export async function applyPhaseC2() {
  const scene = await getScene();
  await loadVisualAssets(scene);
  applyAdaptiveViewport(scene);
  installDimensionalAim(scene);
  installIllustratedUpgradeScene(scene);
  window.__WM_PHASE_C2__ = true;
  document.documentElement.dataset.wreckmarchPhaseC2 = 'active';
  window.__WM_LOG__?.('Phase C.2 active: adaptive viewport + dimensional weapon poses + illustrated upgrade cards');
  return true;
}

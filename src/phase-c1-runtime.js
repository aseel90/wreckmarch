import { createRegisteredStatUpgradeChoice } from './upgrades/upgrade-runtime.js?v=2';

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
  scene.joy.active = false;
  scene.joy.id = null;
  scene.joyBase.setPosition(128, H - 126).setAlpha(.38).setRadius(68);
  scene.joyKnob.setPosition(128, H - 126).setAlpha(.4).setRadius(27);
  scene.joyMax = 58;

  scene.input.on('pointerdown', p => {
    if (scene.gameOver || scene.upgradeOpen || scene.joy.active || p.x > W * .46) return;
    scene.joy.active = true;
    scene.joy.id = p.id;
    scene.joy.baseX = Phaser.Math.Clamp(p.x, 80, W * .34);
    scene.joy.baseY = Phaser.Math.Clamp(p.y, H * .44, H - 74);
    scene.joyBase.setPosition(scene.joy.baseX, scene.joy.baseY).setAlpha(.72);
    scene.joyKnob.setPosition(scene.joy.baseX, scene.joy.baseY).setAlpha(.9);
  });
  scene.input.on('pointermove', p => {
    if (!scene.joy.active || p.id !== scene.joy.id) return;
    const dx = p.x - scene.joy.baseX;
    const dy = p.y - scene.joy.baseY;
    const len = Math.hypot(dx, dy) || 1;
    const mag = Math.min(scene.joyMax, len);
    const nx = dx / len;
    const ny = dy / len;
    scene.move.set(nx * Math.min(1, len / scene.joyMax), ny * Math.min(1, len / scene.joyMax));
    scene.joyKnob.setPosition(scene.joy.baseX + nx * mag, scene.joy.baseY + ny * mag);
  });
  const release = p => {
    if (!scene.joy.active || p.id !== scene.joy.id) return;
    scene.joy.active = false;
    scene.joy.id = null;
    scene.move.set(0, 0);
    scene.joyKnob.setPosition(scene.joy.baseX, scene.joy.baseY).setAlpha(.4);
    scene.joyBase.setAlpha(.38);
  };
  scene.input.on('pointerup', release);
  scene.input.on('pointerupoutside', release);
}

function hudCard(scene, x, y, w, h, stroke, alpha=.86) {
  const shadow = scene.add.rectangle(x + 4, y + 5, w, h, 0x000000, .28).setDepth(930).setScrollFactor(0);
  const panel = scene.add.rectangle(x, y, w, h, 0x10161c, alpha).setStrokeStyle(1.5, stroke, .68).setDepth(931).setScrollFactor(0);
  return { shadow, panel };
}

function installLandscapeHud(scene) {
  scene.hudLayerC1?.forEach?.(obj => obj?.destroy?.());
  scene.hudLayerC1 = [];

  scene.hpBg.setVisible(false);
  scene.hpFill.setVisible(false);
  scene.hpText.setVisible(false);
  scene.scrapText.setVisible(false);
  scene.waveText.setVisible(false);
  scene.levelText.setVisible(false);
  scene.xpBg.setVisible(false);
  scene.xpFill.setVisible(false);

  const hpCard = hudCard(scene, 138, 46, 232, 64, 0xa85d42, .9);
  const runCard = hudCard(scene, W - 122, 46, 214, 64, 0x4ca9b7, .9);
  const xpPanel = scene.add.rectangle(W / 2, 30, 330, 38, 0x0e1419, .91).setStrokeStyle(1.5, 0x727b83, .65).setDepth(931).setScrollFactor(0);
  const xpBarBg = scene.add.rectangle(W / 2, 39, 260, 8, 0x1b242c, .98).setStrokeStyle(1, 0x4b555e, .8).setDepth(933).setScrollFactor(0);
  const xpBar = scene.add.rectangle(W / 2 - 128, 39, 256, 4, 0x58d8e5, 1).setOrigin(0, .5).setDepth(934).setScrollFactor(0).setScale(0, 1);
  const hpBarBg = scene.add.rectangle(140, 58, 196, 10, 0x2d1715, .98).setDepth(933).setScrollFactor(0);
  const hpBar = scene.add.rectangle(42, 58, 196, 6, 0xd96f4d, 1).setOrigin(0, .5).setDepth(934).setScrollFactor(0).setScale(1, 1);
  const hpLabel = scene.add.text(42, 29, 'HUNTER', { fontFamily:'Arial Black, Arial', fontSize:'11px', color:'#e7b88d' }).setDepth(934).setScrollFactor(0);
  const hpValue = scene.add.text(236, 29, '100/100', { fontFamily:'Arial Black, Arial', fontSize:'11px', color:'#f0e1d3' }).setOrigin(1, 0).setDepth(934).setScrollFactor(0);
  const levelText = scene.add.text(W / 2, 14, 'LV 1', { fontFamily:'Arial Black, Arial', fontSize:'11px', color:'#f0d19a' }).setOrigin(.5).setDepth(934).setScrollFactor(0);
  const xpText = scene.add.text(W / 2, 50, 'SCRAP 0/12', { fontFamily:'Arial Black, Arial', fontSize:'8px', color:'#81909c' }).setOrigin(.5).setDepth(934).setScrollFactor(0);
  const waveValue = scene.add.text(W - 42, 29, 'WAVE 1', { fontFamily:'Arial Black, Arial', fontSize:'11px', color:'#e9edf0' }).setOrigin(1, 0).setDepth(934).setScrollFactor(0);
  const scrapValue = scene.add.text(W - 42, 51, 'SCRAP 0', { fontFamily:'Arial Black, Arial', fontSize:'10px', color:'#65d4df' }).setOrigin(1, 0).setDepth(934).setScrollFactor(0);

  scene.hudLayerC1.push(hpCard.shadow, hpCard.panel, runCard.shadow, runCard.panel, xpPanel, xpBarBg, xpBar, hpBarBg, hpBar, hpLabel, hpValue, levelText, xpText, waveValue, scrapValue);
  scene.c1Hud = { xpBar, hpBar, hpValue, levelText, xpText, waveValue, scrapValue };

  scene.refreshProgressHud = function() {
    const ratio = Phaser.Math.Clamp(this.scrapXp / Math.max(1, this.scrapNeeded), 0, 1);
    const hpRatio = Phaser.Math.Clamp(this.heroHp / Math.max(1, this.heroMaxHp), 0, 1);
    this.c1Hud.levelText.setText(`LV ${this.level}`);
    this.c1Hud.xpText.setText(`SCRAP ${this.scrapXp}/${this.scrapNeeded}`);
    this.c1Hud.xpBar.setScale(ratio, 1);
    this.c1Hud.hpValue.setText(`${Math.ceil(this.heroHp)}/${this.heroMaxHp}`);
    this.c1Hud.hpBar.setScale(hpRatio, 1);
    this.c1Hud.waveValue.setText(`WAVE ${this.wave}`);
    this.c1Hud.scrapValue.setText(`SCRAP ${this.scrap}`);
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
    { id:'overclock', category:'HERO', title:'OVERCLOCK', desc:'12% faster fire rate.', weight:1.2,
      available:()=>upgradeLevel(scene,'overclock')<5,
      apply:()=>{ bumpUpgrade(scene,'overclock'); scene.primaryWeapon.fireDelay=Math.max(145,scene.primaryWeapon.fireDelay*.88); scene.fireDelay=scene.primaryWeapon.fireDelay; } },
    { id:'long-barrel', category:'HERO', title:'LONG BARREL', desc:'+18% projectile speed and +10% range.', weight:1,
      available:()=>upgradeLevel(scene,'long-barrel')<4,
      apply:()=>{ bumpUpgrade(scene,'long-barrel'); scene.primaryWeapon.projectileSpeed*=1.18; scene.primaryWeapon.range*=1.1; } },
    { id:'twin-riveter', category:'HERO', title:'TWIN RIVETER', desc:'Fire an extra rivet with slight spread.', weight:.72,
      available:()=>upgradeLevel(scene,'twin-riveter')<2,
      apply:()=>{ bumpUpgrade(scene,'twin-riveter'); scene.twinShots=Math.min(3,(scene.twinShots||1)+1); } },
    { id:'fleet-feet', category:'UTILITY', title:'FLEET FEET', desc:'+8% movement speed.', weight:1.05,
      available:()=>upgradeLevel(scene,'fleet-feet')<4,
      apply:()=>{ bumpUpgrade(scene,'fleet-feet'); scene.heroSpeed=Math.min(365,scene.heroSpeed*1.08); } },
    { id:'scrap-magnet', category:'UTILITY', title:'SCRAP MAGNET', desc:'Increase Scrap pickup radius by 25%.', weight:1,
      available:()=>upgradeLevel(scene,'scrap-magnet')<4,
      apply:()=>{ bumpUpgrade(scene,'scrap-magnet'); scene.magnetRadius*=1.25; } },
    { id:'armor-plate', category:'UTILITY', title:'ARMOR PLATE', desc:'+15 max HP and restore 15 HP.', weight:.95,
      available:()=>upgradeLevel(scene,'armor-plate')<4,
      apply:()=>{ bumpUpgrade(scene,'armor-plate'); scene.heroMaxHp+=15; scene.heroHp=Math.min(scene.heroMaxHp,scene.heroHp+15); } },
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

    const dim = this.add.rectangle(W/2, H/2, W, H, 0x05080c, .92);
    const top = this.add.text(W/2, 28, `LEVEL ${level}`, { fontFamily:'Arial Black, Arial', fontSize:'12px', color:'#5ed8e4' }).setOrigin(.5);
    const title = this.add.text(W/2, 58, 'CHOOSE YOUR UPGRADE', { fontFamily:'Arial Black, Arial', fontSize:'25px', color:'#f0d09b' }).setOrigin(.5);
    const sub = this.add.text(W/2, 82, 'Build the run. Change the machine.', { fontFamily:'Arial', fontSize:'11px', color:'#87939d' }).setOrigin(.5);
    void dim; void top; void title; void sub;

    const margin = 42;
    const gap = 22;
    const cardW = (W - margin*2 - gap*2) / 3;
    const cardH = 355;
    const startX = margin + cardW/2;
    choices.forEach((upgrade, index) => this.createCard(startX + index*(cardW+gap), 307, cardW, cardH, upgrade, index));
    this.refreshSelection();

    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-ONE', () => this.choose(0));
    this.input.keyboard?.on('keydown-TWO', () => this.choose(1));
    this.input.keyboard?.on('keydown-THREE', () => this.choose(2));
  }

  createCard(x, y, w, h, upgrade, index) {
    const color = categoryHex(upgrade.category);
    const group = this.add.container(x, y);
    const shadow = this.add.rectangle(7, 10, w, h, 0x000000, .45);
    const bg = this.add.rectangle(0, 0, w, h, 0x151b22, .985).setStrokeStyle(2, color, .78);
    const topStrip = this.add.rectangle(0, -h/2 + 7, w, 14, color, .95);
    const category = this.add.text(-w/2+18, -h/2+29, upgrade.category, { fontFamily:'Arial Black, Arial', fontSize:'10px', color:Phaser.Display.Color.IntegerToColor(color).rgba }).setOrigin(0,.5);
    const artBg = this.add.rectangle(0, -53, w-30, 138, 0x0b1015, .86).setStrokeStyle(1.5, color, .34);
    const icon = this.add.image(0, -54, 'upgrade-icon-atlas').setOrigin(.5).setScale(.58);
    const idIndex = Math.max(0, ICON_IDS.indexOf(upgrade.id));
    icon.setCrop((idIndex % 5) * 120, Math.floor(idIndex / 5) * 120, 120, 120);
    const cardTitle = this.add.text(0, 35, upgrade.title, { fontFamily:'Arial Black, Arial', fontSize:'19px', color:'#f3f4f5', align:'center', wordWrap:{width:w-34} }).setOrigin(.5);
    const desc = this.add.text(0, 81, upgrade.desc, { fontFamily:'Arial', fontSize:'12px', color:'#b4bec6', align:'center', wordWrap:{width:w-42}, lineSpacing:2 }).setOrigin(.5,0);
    const current = this.gameScene?.upgradeLevels?.[upgrade.id] || 0;
    const footer = this.add.text(0, h/2-26, current ? `CURRENT  LV ${current}` : 'NEW UPGRADE', { fontFamily:'Arial Black, Arial', fontSize:'9px', color:'#7c8993' }).setOrigin(.5);
    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor:true });
    hit.on('pointerover', () => { this.selectedIndex = index; this.refreshSelection(); });
    hit.on('pointerdown', (_p,_x,_y,event) => { event?.stopPropagation?.(); this.choose(index); });
    group.add([shadow,bg,topStrip,category,artBg,icon,cardTitle,desc,footer,hit]);
    this.cardViews.push({ group,bg,topStrip,icon,color });
  }

  moveSelection(dir) {
    if (!this.choices.length || this.locked) return;
    this.selectedIndex = (this.selectedIndex + dir + this.choices.length) % this.choices.length;
    this.refreshSelection();
  }

  refreshSelection() {
    this.cardViews.forEach((card,index) => {
      const active = index === this.selectedIndex;
      card.group.setScale(active ? 1.025 : 1);
      card.bg.setStrokeStyle(active ? 4 : 2, card.color, active ? 1 : .72);
      card.topStrip.setAlpha(active ? 1 : .78);
      card.icon.setAlpha(active ? 1 : .82);
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
      if (enemy?.active && !before.has(enemy)) {
        enemy.setScale(enemy.elite ? .67 : .54);
        enemy.hitRadius = enemy.elite ? 29 : 24;
      }
    });
  };
}

export async function applyPhaseC1() {
  const scene = await getScene();
  await loadAimAssets(scene);
  installLandscapeCanvas(scene);
  reinstallLandscapeJoystick(scene);
  installLandscapeHud(scene);
  installLandscapeUpgradeScene(scene);
  refineLandscapeScale(scene);
  window.__WM_LOG__?.('Phase C.1 active: landscape HUD + 8-way two-hand aim + UpgradeScene cards');
  return scene;
}

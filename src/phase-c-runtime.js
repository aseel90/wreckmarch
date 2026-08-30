import { RUN_BALANCE } from './balance/run-balance.js?v=6';
import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from './upgrades/upgrade-runtime.js?v=7';

/* WRECKMARCH — Phase C: combat correction + Scrap level/card loop + optional Rig */
const W = 540;
const H = 960;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.enemies && scene.move) return scene;
    await wait(50);
  }
  throw new Error('Phase C: Wreckmarch scene not ready');
}

function makeTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.add.graphics();
  draw(g, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeCombatTextures(scene) {
  makeTex(scene, 'rivet-bullet', 22, 10, (g) => {
    g.fillStyle(0x15191b, 1); g.fillRoundedRect(1, 2, 20, 6, 3);
    g.fillStyle(0xd6d2bd, 1); g.fillRoundedRect(3, 3, 13, 4, 2);
    g.fillStyle(0xb66135, 1); g.fillCircle(18, 5, 3);
  });
  makeTex(scene, 'flash', 36, 24, (g) => {
    g.fillStyle(0xffd36a, .95); g.fillTriangle(2, 12, 32, 2, 25, 12); g.fillTriangle(2, 12, 32, 22, 25, 12);
    g.fillStyle(0xffffff, .95); g.fillCircle(9, 12, 4);
  });
  makeTex(scene, 'scrap-piece', 22, 22, (g) => {
    g.fillStyle(0x101417, 1); g.fillCircle(11, 11, 10);
    g.fillStyle(0xc28a48, 1); g.fillRoundedRect(4, 6, 14, 10, 3);
    g.fillStyle(0x5ad4df, .85); g.fillCircle(11, 11, 3);
  });
}

function ensureProgressState(scene) {
  scene.runTime = scene.runTime || 0;
  scene.level = Math.max(1, scene.level || 1);
  scene.scrapXp = scene.scrapXp || 0;
  scene.scrapNeeded = scene.scrapNeeded || 8;
  scene.upgradeLevels = scene.upgradeLevels || {};
  scene.rigSummoned = !!scene.rigSummoned;
  scene.twinShots = scene.twinShots || 1;
  scene.upgradeOpen = false;
  scene.gameOver = false;
}

function installCombat(scene) {
  makeCombatTextures(scene);
  scene.primaryWeapon = scene.weaponSystem.getHeroProfile();
  scene.twinShots = Math.max(1, scene.twinShots || 1);
  scene.lastShot = 0;
  scene.fireDelay = scene.primaryWeapon.fireDelay;
  scene.bullets = scene.physics.add.group({ maxSize: 140, runChildUpdate: false });
  scene.scraps = scene.physics.add.group({ maxSize: 100, runChildUpdate: false });
  scene.lastMuzzle = { x: scene.hero.x, y: scene.hero.y, angle: 0 };

  scene.weaponSystem.configureHero({
    aimYOffset: 1,
    targetTurnRate: .30,
    moveTurnRate: .20,
    twinSpread2: .055,
    twinSpread3: .085,
    muzzleResolver: (spread = 0) => {
      const a = scene.weaponAim + spread;
      return new Phaser.Math.Vector2(scene.hero.x + Math.cos(a) * 42, scene.hero.y + 3 + Math.sin(a) * 42);
    },
    fireFeedback: ({ visualAngle, muzzle }) => {
      scene.lastMuzzle = { x: muzzle.x, y: muzzle.y, angle: visualAngle };
      scene.weaponKick = 1;
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash').setDepth(35).setRotation(visualAngle).setScale(.5);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .1, duration: 70, onComplete: () => flash.destroy() });
      scene.playTone(170, .05, 'square', .022, -34);
    }
  });

  scene.refreshWeaponProfile = () => {
    scene.primaryWeapon = scene.weaponSystem.getHeroProfile();
    scene.fireDelay = scene.primaryWeapon.fireDelay;
  };

  scene.updateAim = () => {
    scene.weaponSystem.updateHeroAim();
  };

  scene.fireRivet = (time) => {
    const result = scene.weaponSystem.tryFireHero(time);
    if (result) scene.lastShot = time;
  };

  scene.updateBullets = () => {
    scene.projectileSystem.syncSprites();
  };

  scene.physics.add.overlap(scene.bullets, scene.enemies, (b, e) => {
    if (!b.active || !e.active) return;
    e.hp -= b.damage || scene.primaryWeapon.damage;
    b.disableBody(true, true);
    scene.cameras.main.shake(35, .0012);
    scene.tweens.add({ targets: e, alpha: .55, yoyo: true, duration: 55, onComplete: () => { if (e.active) e.alpha = 1; } });
    if (e.hp <= 0) scene.killEnemy(e);
  });
}

function installScrap(scene) {
  const oldKill = scene.killEnemy.bind(scene);
  scene.killEnemy = function(enemy) {
    const x = enemy.x, y = enemy.y;
    oldKill(enemy);
    if (Math.random() < .94) {
      const count = enemy.elite ? Phaser.Math.Between(2, 3) : 1;
      for (let i = 0; i < count; i++) {
        const s = this.scraps.get(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-10, 10), 'scrap-piece');
        if (!s) continue;
        s.setActive(true).setVisible(true).setDepth(13).setScale(1);
        s.body.enable = true;
        s.body.setCircle(9);
        s.body.setVelocity(Phaser.Math.Between(-35, 35), Phaser.Math.Between(-35, 35));
        s.value = enemy.elite ? 2 : 1;
      }
    }
  };

  scene.physics.add.overlap(scene.hero, scene.scraps, (_hero, scrap) => {
    if (!scrap.active || scene.upgradeOpen || scene.gameOver) return;
    scene.collectScrap(scrap);
  });

  scene.collectScrap = function(scrap) {
    const value = scrap.value || 1;
    scrap.disableBody(true, true);
    this.scrapXp += value;
    this.scrapScore += value;
    this.playTone(600, .035, 'square', .012, 55);
    while (this.scrapXp >= this.scrapNeeded) {
      this.scrapXp -= this.scrapNeeded;
      this.level += 1;
      this.scrapNeeded = Math.floor(7 + this.level * 4.2);
      this.pendingLevels = (this.pendingLevels || 0) + 1;
    }
    this.refreshProgressHud();
    if ((this.pendingLevels || 0) > 0 && !this.upgradeOpen) this.openUpgradeCards();
  };

  scene.updateScraps = function() {
    this.scraps.children.iterate(s => {
      if (!s?.active) return;
      s.body.velocity.scale(.94);
      const d = Phaser.Math.Distance.Between(s.x, s.y, this.hero.x, this.hero.y);
      const pickupRadius = this.runStatState?.resolve?.().character?.pickupRadius ?? this.characterSystem?.getPickupRadius?.() ?? 135;
      if (d < pickupRadius) {
        const a = Phaser.Math.Angle.Between(s.x, s.y, this.hero.x, this.hero.y);
        const pull = 340 * Phaser.Math.Clamp(1 - d / pickupRadius, .2, 1);
        s.body.velocity.x += Math.cos(a) * pull * (1 / 60);
        s.body.velocity.y += Math.sin(a) * pull * (1 / 60);
      }
    });
  };
}

function installProgressHud(scene) {
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(91);
  const w = 330;
  const bg = scene.add.rectangle(105, H - 38, w, 12, 0x071014, .85).setOrigin(0, .5).setStrokeStyle(2, 0x4a6668, .6);
  const fill = scene.add.rectangle(107, H - 38, w - 4, 8, 0x55d6e3, .9).setOrigin(0, .5);
  const level = scene.add.text(16, H - 52, 'LV 1', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#f1d198' });
  const scrap = scene.add.text(W - 16, H - 52, 'SCRAP 0/8', { fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#a8c8c7' }).setOrigin(1, 0);
  c.add([bg, fill, level, scrap]);
  scene.xpFill = fill;
  scene.levelText = level;
  scene.scrapText = scrap;
  scene.refreshProgressHud = function() {
    const ratio = Phaser.Math.Clamp(this.scrapXp / Math.max(1, this.scrapNeeded), 0, 1);
    this.levelText.setText(`LV ${this.level}`);
    this.scrapText.setText(`SCRAP ${this.scrapXp}/${this.scrapNeeded}`);
    this.xpFill.setScale(ratio, 1);
  };
  scene.refreshProgressHud();
}

function createUpgradePool(scene) {
  return [
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'overclock', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'long-barrel', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' }),
    { id: 'rig-overdrive', category: 'FORTRESS', title: 'RIG OVERDRIVE', desc: 'Reserved for the future companion upgrade tree.', weight: 0, available: () => false, apply: () => {} },
    { id: 'twin-cannon', category: 'FORTRESS', title: 'TWIN CANNON', desc: 'Reserved for the future companion upgrade tree.', weight: 0, available: () => false, apply: () => {} }
  ];
}

function weightedChoices(scene, count = 3) {
  const available = createUpgradePool(scene).filter(item => item.available());
  const chosen = [];
  while (chosen.length < count && available.length) {
    const total = available.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    let index = 0;
    for (; index < available.length; index++) { roll -= available[index].weight; if (roll <= 0) break; }
    const item = available.splice(Math.min(index, available.length - 1), 1)[0];
    chosen.push(item);
  }
  return chosen;
}

function installUpgradeScene(scene) {
  class UpgradeScene extends Phaser.Scene {
    constructor() { super('UpgradeScene'); }
    init(data) { this.payload = data || {}; }
    create() {
      const gameScene = this.payload.gameScene;
      const choices = this.payload.choices || [];
      const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x03070a, .9);
      this.add.text(W / 2, 150, `LEVEL ${gameScene.level}`, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#5ad4df' }).setOrigin(.5);
      this.add.text(W / 2, 182, 'CHOOSE YOUR UPGRADE', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#f1d198' }).setOrigin(.5);
      choices.forEach((u, i) => {
        const y = 300 + i * 145;
        const card = this.add.rectangle(W / 2, y, 450, 120, 0x192025, .98).setStrokeStyle(3, u.category === 'FORTRESS' ? 0xd5ad62 : u.category === 'UTILITY' ? 0x55d6e3 : 0xd17b43, .9).setInteractive({ useHandCursor: true });
        this.add.text(70, y - 32, u.title, { fontFamily: 'Arial Black, Arial', fontSize: '21px', color: '#f4f4f0' });
        this.add.text(70, y + 2, u.desc, { fontFamily: 'Arial', fontSize: '14px', color: '#b8c4c5', wordWrap: { width: 390 } });
        this.add.text(W - 75, y - 36, u.category, { fontFamily: 'Arial Black, Arial', fontSize: '10px', color: '#7f8e91' }).setOrigin(1, 0);
        card.on('pointerdown', () => { u.apply(); gameScene.closeUpgradeCards(); });
      });
      veil.setInteractive();
    }
  }
  if (!scene.game.scene.getScene('UpgradeScene')) scene.game.scene.add('UpgradeScene', UpgradeScene, false);
}

function installUpgradeFlow(scene) {
  scene.openUpgradeCards = function() {
    if (this.upgradeOpen || this.gameOver) return;
    const choices = weightedChoices(this, 3);
    if (!choices.length) { this.pendingLevels = Math.max(0, (this.pendingLevels || 1) - 1); return; }
    this.upgradeOpen = true;
    this.physics.pause();
    this.scene.launch('UpgradeScene', { gameScene: this, choices });
    this.scene.bringToTop('UpgradeScene');
  };
  scene.closeUpgradeCards = function() {
    this.scene.stop('UpgradeScene');
    this.upgradeOpen = false;
    this.pendingLevels = Math.max(0, (this.pendingLevels || 1) - 1);
    if (!this.gameOver) this.physics.resume();
    this.refreshWeaponProfile?.();
    this.time.delayedCall(60, () => { if ((this.pendingLevels || 0) > 0 && !this.upgradeOpen) this.openUpgradeCards(); });
  };
}

function installCombatOverlay(scene) {
  const oldUpdate = (scene.sys?.sceneUpdate || scene.update).bind(scene);
  const patched = function(time, delta) {
    if (this.gameOver) { oldUpdate(time, delta); return; }
    if (this.upgradeOpen) return;
    oldUpdate(time, delta);
    this.runTime += delta / 1000;
    this.updateAim();
    this.fireRivet(time);
    this.updateBullets();
    this.updateScraps();
  };
  scene.update = patched;
  if (scene.sys) scene.sys.sceneUpdate = patched;
}

export async function applyPhaseC() {
  const scene = await getScene();
  ensureProgressState(scene);
  installCombat(scene);
  installScrap(scene);
  installProgressHud(scene);
  installUpgradeScene(scene);
  installUpgradeFlow(scene);
  installCombatOverlay(scene);
  scene.phaseC = true;
  window.__WM_PHASE_C__ = true;
  document.documentElement.dataset.wreckmarchPhaseC = 'active';
  window.__WM_LOG__?.('Phase C active: weapon rig + WeaponSystem profile + Scrap cards + optional Rig');
  return true;
}

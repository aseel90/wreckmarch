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
    if (scene?.sys?.isActive?.() && scene.hero && scene.enemies) return scene;
    await wait(60);
  }
  throw new Error('Phase C: Wreckmarch scene timeout');
}

function playTone(freq, dur = .05, type = 'square', gain = .015, slide = 0) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = window.__wmAudio || (window.__wmAudio = new Ctx());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {}
}

function createCircleTexture(scene, key, radius, color, alpha = 1) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, alpha);
  g.fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}

function prepareWeaponTextures(scene) {
  createCircleTexture(scene, 'phase-c-bolt', 7, 0xb6d9e0, 1);
  createCircleTexture(scene, 'phase-c-spark', 4, 0xf2c67c, 1);
  createCircleTexture(scene, 'phase-c-scrap', 8, 0xe29a4b, 1);
}

function installWeaponRig(scene) {
  scene.weaponAim = 0;
  scene.weaponRecoil = 0;
  scene.weaponArm = scene.add.rectangle(scene.hero.x + 13, scene.hero.y + 3, 28, 9, 0x5e4637, 1).setStrokeStyle(2, 0x241b17, .85).setOrigin(0, .5).setDepth(22);
  scene.weaponSprite = scene.add.sprite(scene.hero.x + 36, scene.hero.y + 2, 'rivet-gun').setOrigin(.16, .52).setDisplaySize(58, 27).setDepth(24);
  scene.weaponHand = scene.add.circle(scene.hero.x + 22, scene.hero.y + 3, 5, 0x8b5d3c, 1).setStrokeStyle(2, 0x2a1c17, .9).setDepth(25);
  scene.weaponMuzzle = new Phaser.Math.Vector2(scene.hero.x + 64, scene.hero.y + 2);
  scene.weaponTarget = null;
  scene.lastHeroShot = 0;
  scene.fireDelay = scene.primaryWeapon.fireDelay;
  scene.twinShots = 1;
  scene.weaponRange = 680;
  scene.weaponSystem.configureHero({
    aimYOffset: 5,
    targetTurnRate: .28,
    moveTurnRate: .2,
    twinSpread2: .055,
    twinSpread3: .085,
    muzzleResolver: spread => {
      const a = scene.weaponAim + spread;
      return new Phaser.Math.Vector2(scene.hero.x + Math.cos(a) * 56, scene.hero.y + 4 + Math.sin(a) * 56);
    },
    fireFeedback: ({ visualAngle, muzzle }) => {
      scene.weaponRecoil = 1;
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash').setDepth(29).setRotation(visualAngle).setScale(.48);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .12, duration: 75, onComplete: () => flash.destroy() });
      scene.playTone?.(165, .045, 'square', .019, -34);
    }
  });
}

function updateWeaponRig(scene) {
  const target = scene.weaponSystem.acquireTarget(scene.hero.x, scene.hero.y, scene.weaponRange);
  scene.weaponTarget = target || null;
  const movement = scene.move?.lengthSq?.() > .04 ? scene.move : null;
  const aim = scene.weaponSystem.updateAim(scene.weaponAim, target, movement);
  scene.weaponAim = aim.angle;

  const recoil = scene.weaponRecoil || 0;
  const ca = Math.cos(scene.weaponAim), sa = Math.sin(scene.weaponAim);
  scene.weaponArm.setPosition(scene.hero.x + ca * 5, scene.hero.y + 4 + sa * 4).setRotation(scene.weaponAim);
  scene.weaponSprite.setPosition(scene.hero.x + ca * (29 - recoil * 4), scene.hero.y + 4 + sa * (29 - recoil * 4)).setRotation(scene.weaponAim);
  scene.weaponHand.setPosition(scene.hero.x + ca * 19, scene.hero.y + 4 + sa * 19);
  scene.weaponMuzzle.set(scene.hero.x + ca * 56, scene.hero.y + 4 + sa * 56);
  scene.weaponRecoil *= .72;
}

function fireHero(scene, time) {
  scene.weaponSystem.fireHeroVolley(time, {
    fireDelay: scene.primaryWeapon.fireDelay,
    projectileSpeed: scene.primaryWeapon.projectileSpeed,
    projectileLifeMs: scene.primaryWeapon.projectileLifeMs,
    scale: .82,
    projectileTexture: 'phase-c-bolt'
  });
}

function installScrapLoop(scene) {
  scene.level = 1;
  scene.scrapXp = 0;
  scene.scrapNeeded = 10;
  scene.upgradeLevels = scene.upgradeLevels || {};
  scene.upgradeOpen = false;
  scene.pendingUpgrade = false;
  scene.scraps = scene.physics.add.group({ allowGravity: false, immovable: true });
  scene.lastScrapDrop = 0;

  scene.spawnScrapAt = (x, y) => {
    const scrap = scene.scraps.create(x, y, 'phase-c-scrap');
    scrap.setDepth(13).setScale(.78).setCircle(7).setData('value', 1);
    scene.tweens.add({ targets: scrap, scale: 1.03, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.InOut' });
  };

  scene.collectScrap = (_hero, scrap) => {
    const value = scrap.getData('value') || 1;
    scrap.destroy();
    scene.scrapXp += value;
    scene.refreshProgressHud?.();
    if (scene.scrapXp >= scene.scrapNeeded && !scene.pendingUpgrade) {
      scene.scrapXp -= scene.scrapNeeded;
      scene.level += 1;
      scene.scrapNeeded = Math.floor(scene.scrapNeeded * 1.32 + 5);
      scene.pendingUpgrade = true;
      scene.time.delayedCall(80, () => scene.openUpgradeCards());
    }
  };

  scene.physics.add.overlap(scene.hero, scene.scraps, scene.collectScrap);
}

function installProgressHud(scene) {
  scene.levelText = scene.add.text(14, 12, 'LV 1', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#f1d49d' }).setScrollFactor(0).setDepth(50);
  scene.scrapText = scene.add.text(14, 35, 'SCRAP 0/10', { fontFamily: 'Arial', fontSize: '12px', color: '#b6c2c9' }).setScrollFactor(0).setDepth(50);
  scene.xpBg = scene.add.rectangle(14, 54, 190, 8, 0x14191e, .9).setOrigin(0, .5).setScrollFactor(0).setDepth(50).setStrokeStyle(1, 0x58646d, .7);
  scene.xpFill = scene.add.rectangle(15, 54, 188, 6, 0xe0a257, 1).setOrigin(0, .5).setScrollFactor(0).setDepth(51);
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
    for (; index < available.length; index++) {
      roll -= available[index].weight;
      if (roll <= 0) break;
    }
    const [pick] = available.splice(Math.min(index, available.length - 1), 1);
    chosen.push(pick);
  }
  return chosen;
}

function installUpgradeScene(scene) {
  class UpgradeScene extends Phaser.Scene {
    constructor() { super('UpgradeScene'); }
    init(data) { this.parent = data.parent; this.choices = data.choices; this.level = data.level; this.selected = 0; this.cards = []; }
    create() {
      const W = this.scale.width, H = this.scale.height;
      this.add.rectangle(W / 2, H / 2, W, H, 0x05070a, .92);
      this.add.text(W / 2, 34, `LEVEL ${this.level}`, { fontFamily: 'Arial Black, Arial', fontSize: '12px', color: '#58d2df' }).setOrigin(.5);
      this.add.text(W / 2, 62, 'CHOOSE YOUR UPGRADE', { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#f0d09b' }).setOrigin(.5);
      const cols = Math.max(1, this.choices.length);
      const margin = Math.min(48, W * .045), gap = Math.min(20, W * .018), cw = Math.min(280, (W - margin * 2 - gap * (cols - 1)) / cols), ch = Math.min(360, H - 150);
      const total = cw * cols + gap * (cols - 1), sx = (W - total) / 2 + cw / 2;
      this.choices.forEach((choice, i) => this.card(sx + i * (cw + gap), H * .57, cw, ch, choice, i));
      this.refresh();
      this.input.keyboard?.on('keydown-LEFT', () => this.move(-1));
      this.input.keyboard?.on('keydown-RIGHT', () => this.move(1));
      this.input.keyboard?.on('keydown-ENTER', () => this.choose(this.selected));
    }
    card(x, y, w, h, u, i) {
      const c = u.category === 'HERO' ? 0xd98446 : u.category === 'UTILITY' ? 0x4fc8d8 : 0xd4ad62;
      const g = this.add.container(x, y), bg = this.add.rectangle(0, 0, w, h, 0x151b22, .99).setStrokeStyle(2, c, .8), strip = this.add.rectangle(0, -h / 2 + 7, w, 14, c, .95);
      const title = this.add.text(0, -h * .23, u.title, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#f4f5f6', align: 'center', wordWrap: { width: w - 28 } }).setOrigin(.5);
      const desc = this.add.text(0, -h * .08, u.desc, { fontFamily: 'Arial', fontSize: '13px', color: '#bac4ca', align: 'center', wordWrap: { width: w - 38 }, lineSpacing: 3 }).setOrigin(.5, 0);
      const lv = this.parent?.upgradeLevels?.[u.id] || 0, foot = this.add.text(0, h / 2 - 28, lv ? `CURRENT  LV ${lv}` : 'NEW UPGRADE', { fontFamily: 'Arial Black, Arial', fontSize: '9px', color: '#7f8b94' }).setOrigin(.5);
      const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { this.selected = i; this.refresh(); }); hit.on('pointerdown', () => this.choose(i)); g.add([bg, strip, title, desc, foot, hit]); this.cards.push({ g, bg, strip, c });
    }
    move(d) { if (!this.choices.length) return; this.selected = (this.selected + d + this.choices.length) % this.choices.length; this.refresh(); }
    refresh() { this.cards.forEach((x, i) => { const on = i === this.selected; x.g.setScale(on ? 1.025 : 1); x.bg.setStrokeStyle(on ? 4 : 2, x.c, on ? 1 : .72); x.strip.setAlpha(on ? 1 : .82); }); }
    choose(i) { const u = this.choices[i]; if (!u) return; u.apply(); this.parent.closeUpgradeCards(); }
  }
  if (!scene.game.scene.getScene('UpgradeScene')) scene.game.scene.add('UpgradeScene', UpgradeScene, false);
  scene.openUpgradeCards = function() {
    if (this.upgradeOpen || this.gameOver) return;
    const choices = weightedChoices(this, 3);
    if (!choices.length) { this.pendingUpgrade = false; return; }
    this.upgradeOpen = true; this.pendingUpgrade = false; this.physics.world.pause();
    this.scene.launch('UpgradeScene', { parent: this, choices, level: this.level }); this.scene.bringToTop('UpgradeScene'); playTone(520, .06, 'triangle', .012, 120);
  };
  scene.closeUpgradeCards = function() { this.scene.stop('UpgradeScene'); this.physics.world.resume(); this.upgradeOpen = false; this.refreshProgressHud?.(); };
}

export async function applyPhaseC() {
  const scene = await getScene();
  prepareWeaponTextures(scene);
  scene.playTone = playTone;
  installWeaponRig(scene);
  installScrapLoop(scene);
  installProgressHud(scene);
  installUpgradeScene(scene);
  document.documentElement.dataset.wreckmarchPhaseC = 'active';
  window.__WM_PHASE_C__ = true;
  window.__WM_LOG__?.('Phase C active: weapon rig + WeaponSystem profile + Scrap cards + optional Rig');
  return true;
}

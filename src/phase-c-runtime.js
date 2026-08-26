/* WRECKMARCH Phase C — core loop: weapon rig + upgrade cards + moving Rig */

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const CARD_COLORS = {
  HERO: 0xd98446,
  UTILITY: 0x4fc8d8,
  FORTRESS: 0xd4ad62,
  EVOLUTION: 0x9d6be8
};

async function getGameScene() {
  const started = performance.now();
  while (performance.now() - started < 8000) {
    const game = Phaser.GAMES?.find(Boolean) || Phaser.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.enemies && scene.bullets) return scene;
    await wait(60);
  }
  throw new Error('Phase C: Wreckmarch scene timeout');
}

function ensureGeneratedTextures(scene) {
  if (!scene.textures.exists('c-weapon')) {
    const g = scene.add.graphics({ add: false });
    g.fillStyle(0x11151a, 1); g.fillRoundedRect(0, 8, 72, 20, 5);
    g.fillStyle(0x995531, 1); g.fillRoundedRect(6, 12, 42, 12, 4);
    g.fillStyle(0xdcc7a2, 1); g.fillRect(18, 4, 32, 8);
    g.fillStyle(0x4c8995, 1); g.fillCircle(54, 17, 7);
    g.fillStyle(0xe7b65e, 1); g.fillRect(66, 13, 12, 6);
    g.generateTexture('c-weapon', 80, 36); g.destroy();
  }
  if (!scene.textures.exists('c-rig-wheel')) {
    const g = scene.add.graphics({ add: false });
    g.fillStyle(0x17130f, 1); g.fillCircle(18, 18, 18);
    g.fillStyle(0x6f756f, 1); g.fillCircle(18, 18, 12);
    g.fillStyle(0x221b16, 1); g.fillCircle(18, 18, 5);
    g.lineStyle(3, 0xb8b0a1, .8); g.lineBetween(18, 5, 18, 31); g.lineBetween(5, 18, 31, 18);
    g.generateTexture('c-rig-wheel', 36, 36); g.destroy();
  }
  if (!scene.textures.exists('c-rig-body')) {
    const g = scene.add.graphics({ add: false });
    g.fillStyle(0x0f1112, 1); g.fillRoundedRect(4, 16, 152, 62, 16);
    g.fillStyle(0x71513a, 1); g.fillRoundedRect(12, 8, 132, 54, 12);
    g.fillStyle(0xb58455, 1); g.fillRoundedRect(26, 4, 90, 34, 10);
    g.lineStyle(3, 0x27292a, .7); for (let x = 24; x < 130; x += 18) g.lineBetween(x, 12, x - 9, 55);
    g.fillStyle(0x38494a, 1); g.fillRoundedRect(82, 0, 62, 22, 8);
    g.fillStyle(0xd98446, 1); g.fillCircle(132, 11, 6);
    g.generateTexture('c-rig-body', 160, 82); g.destroy();
  }
  if (!scene.textures.exists('c-card-pattern')) {
    const g = scene.add.graphics({ add: false });
    g.fillStyle(0x14120f, 1); g.fillRect(0, 0, 64, 64);
    g.lineStyle(2, 0x322d26, .7); g.lineBetween(0, 18, 64, 6); g.lineBetween(0, 42, 64, 30); g.lineBetween(18, 64, 42, 0);
    g.fillStyle(0x7d6b55, .25); for (let i = 0; i < 12; i++) g.fillCircle(Phaser.Math.Between(2, 62), Phaser.Math.Between(2, 62), Phaser.Math.Between(1, 2));
    g.generateTexture('c-card-pattern', 64, 64); g.destroy();
  }
}

function installPrimaryWeapon(scene) {
  scene.primaryWeapon = {
    id: 'scrap-rivet-gun',
    name: 'SCRAP RIVETER',
    damage: scene.damage || 22,
    fireDelay: scene.fireDelay || 460,
    projectileSpeed: 720,
    range: 430,
    muzzleDistance: 44,
    tint: 0xf0bd64
  };
  scene.fireDelay = scene.primaryWeapon.fireDelay;
  scene.damage = scene.primaryWeapon.damage;
  scene.weaponAim = 0;
  scene.twinShots = scene.twinShots || 1;

  scene.weaponRig = scene.add.container(scene.hero.x, scene.hero.y).setDepth(26);
  scene.weaponShadow = scene.add.ellipse(5, 15, 54, 15, 0x000000, .28).setDepth(0);
  scene.weaponArm = scene.add.rectangle(-5, 2, 24, 10, 0x8f593d, 1).setOrigin(.15, .5).setDepth(1);
  scene.weaponSprite = scene.add.image(13, 1, 'c-weapon').setOrigin(.18, .5).setScale(.62).setDepth(2);
  scene.weaponMuzzle = scene.add.circle(43, 0, 5, 0xffd38a, 0).setDepth(3);
  scene.weaponRig.add([scene.weaponShadow, scene.weaponArm, scene.weaponSprite, scene.weaponMuzzle]);

  scene.updateWeaponPose = function () {
    if (!this.weaponRig || !this.hero) return;
    this.weaponRig.setPosition(this.hero.x, this.hero.y + 4);
    this.weaponRig.rotation = this.weaponAim;
    this.weaponRig.setScale(1, Math.cos(this.weaponAim) < 0 ? -1 : 1);
  };
  scene.updateWeaponPose();
}

function installRigVisual(scene) {
  scene.cart.removeAll(true);
  scene.cart.setSize(164, 94).setDepth(14).setVisible(false).setActive(false);
  scene.cartShadow = scene.add.ellipse(0, 25, 150, 40, 0x000000, .35);
  scene.cartBody = scene.add.image(0, 0, 'c-rig-body').setScale(.82);
  scene.cartWheels = [-55, -18, 18, 55].map(x => scene.add.image(x, 31, 'c-rig-wheel').setScale(.8));
  scene.turrets = [
    scene.add.image(30, -15, 'c-weapon').setOrigin(.2, .5).setScale(.55),
    scene.add.image(-10, -12, 'c-weapon').setOrigin(.2, .5).setScale(.44).setAlpha(.75)
  ];
  scene.cart.add([scene.cartShadow, ...scene.cartWheels, scene.cartBody, ...scene.turrets]);
}

function installHud(scene) {
  scene.scrapIcon?.destroy();
  scene.timerText?.setFontSize?.('17px');
  scene.levelText?.setFontSize?.('14px');
  scene.scrapText?.setFontSize?.('13px');
  scene.timerText?.setPosition(736, 18).setOrigin?.(1, 0);
  scene.levelText?.setPosition(592, 18);
  scene.scrapText?.setPosition(590, 38);

  scene.xpTrack = scene.add.rectangle(400, 454, 790, 8, 0x070809, .78).setScrollFactor(0).setDepth(100);
  scene.xpFill = scene.add.rectangle(5, 454, 790, 8, 0xd98446, .95).setOrigin(0, .5).setScrollFactor(0).setDepth(101).setScale(0, 1);
  scene.xpLabel = scene.add.text(12, 435, 'SCRAP XP 0/20', { fontFamily: 'Arial Black', fontSize: '9px', color: '#d9c4a2' }).setScrollFactor(0).setDepth(102);
  scene.refreshProgressHud = function () {
    const ratio = Phaser.Math.Clamp((this.scrapXp || 0) / Math.max(1, this.scrapXpToNext || 20), 0, 1);
    this.xpLabel.setText(`SCRAP XP ${Math.floor(this.scrapXp || 0)}/${Math.floor(this.scrapXpToNext || 20)}`);
    this.xpFill.setScale(ratio, 1);
  };
  scene.refreshProgressHud();
}

function upgradeLevel(scene, id) {
  return scene.upgradeLevels[id] || 0;
}

function bumpUpgrade(scene, id) {
  scene.upgradeLevels[id] = upgradeLevel(scene, id) + 1;
}

function summonRig(scene) {
  if (scene.rigSystem?.summon) {
    scene.rigSystem.summon();
    return;
  }
  if (scene.rigSummoned) return;
  scene.rigSummoned = true;
  scene.rigFireDelay = 920;
  scene.rigDamageScale = .58;
  scene.rigShots = 1;
  scene.lastRigShot = 0;
  scene.cart.setVisible(true).setActive(true).setAlpha(0).setScale(.92);
  scene.cart.setPosition(scene.hero.x - 145, scene.hero.y + 105);
  scene.tweens.add({ targets: scene.cart, alpha: 1, duration: 260, ease: 'Cubic.Out' });
  scene.cameras.main.flash(110, 80, 210, 225, false);
}

function createUpgradePool(scene) {
  return [
    { id: 'heavy-rivets', category: 'HERO', title: 'HEAVY RIVETS', desc: '+20% Rivet Gun damage.', weight: 1.25, available: () => upgradeLevel(scene, 'heavy-rivets') < 5, apply: () => { bumpUpgrade(scene, 'heavy-rivets'); scene.primaryWeapon.damage *= 1.2; scene.damage = scene.primaryWeapon.damage; } },
    { id: 'overclock', category: 'HERO', title: 'OVERCLOCK', desc: '12% faster fire rate.', weight: 1.2, available: () => upgradeLevel(scene, 'overclock') < 5, apply: () => { bumpUpgrade(scene, 'overclock'); scene.primaryWeapon.fireDelay = Math.max(145, scene.primaryWeapon.fireDelay * .88); scene.fireDelay = scene.primaryWeapon.fireDelay; } },
    { id: 'long-barrel', category: 'HERO', title: 'LONG BARREL', desc: '+18% projectile speed and +10% range.', weight: 1, available: () => upgradeLevel(scene, 'long-barrel') < 4, apply: () => { bumpUpgrade(scene, 'long-barrel'); scene.primaryWeapon.projectileSpeed *= 1.18; scene.primaryWeapon.range *= 1.1; } },
    { id: 'twin-riveter', category: 'HERO', title: 'TWIN RIVETER', desc: 'Fire a second rivet with slightly reduced damage.', weight: .75, available: () => scene.level >= 3 && upgradeLevel(scene, 'twin-riveter') < 1, apply: () => { bumpUpgrade(scene, 'twin-riveter'); scene.twinShots = 2; } },
    { id: 'fleet-feet', category: 'UTILITY', title: 'FLEET FEET', desc: '+11% move speed.', weight: 1.05, available: () => upgradeLevel(scene, 'fleet-feet') < 4, apply: () => { bumpUpgrade(scene, 'fleet-feet'); scene.speed *= 1.11; } },
    { id: 'armor-plate', category: 'UTILITY', title: 'ARMOR PLATE', desc: '+18 max integrity and repair 18.', weight: 1.05, available: () => upgradeLevel(scene, 'armor-plate') < 4, apply: () => { bumpUpgrade(scene, 'armor-plate'); scene.maxHp += 18; scene.hp = Math.min(scene.maxHp, scene.hp + 18); scene.updateHud?.(); } },
    { id: 'scrap-magnet', category: 'UTILITY', title: 'SCRAP MAGNET', desc: '+26 pickup range.', weight: 1, available: () => upgradeLevel(scene, 'scrap-magnet') < 5, apply: () => { bumpUpgrade(scene, 'scrap-magnet'); scene.magnetRange += 26; } },
    { id: 'call-rig', category: 'FORTRESS', title: 'CALL THE RIG', desc: 'Summon the moving Fortress companion.', weight: .7, available: () => scene.level >= 2 && !scene.rigSummoned, apply: () => summonRig(scene) },
    { id: 'rig-overdrive', category: 'FORTRESS', title: 'RIG OVERDRIVE', desc: 'Fortress cannon fires 15% faster.', weight: .92, available: () => scene.rigSummoned && upgradeLevel(scene, 'rig-overdrive') < 4, apply: () => { bumpUpgrade(scene, 'rig-overdrive'); scene.rigFireDelay = Math.max(360, scene.rigFireDelay * .85); } },
    { id: 'twin-cannon', category: 'FORTRESS', title: 'TWIN CANNON', desc: 'Fortress fires another support shot.', weight: .7, available: () => scene.rigSummoned && upgradeLevel(scene, 'twin-cannon') < 1, apply: () => { bumpUpgrade(scene, 'twin-cannon'); scene.rigShots = 2; } }
  ];
}

function chooseCards(scene, count = 3) {
  const pool = scene.upgradePool.filter(card => card.available());
  const picked = [];
  while (pool.length && picked.length < count) {
    let total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    let index = 0;
    for (; index < pool.length; index++) {
      roll -= pool[index].weight;
      if (roll <= 0) break;
    }
    picked.push(pool.splice(Math.min(index, pool.length - 1), 1)[0]);
  }
  return picked;
}

function createUpgradeScene(scene) {
  if (scene.game.scene.getScene('UpgradeSceneV2')) return;
  class UpgradeSceneV2 extends Phaser.Scene {
    constructor() { super('UpgradeSceneV2'); }
    create(data) {
      this.parentScene = data.parent;
      this.cards = data.cards;
      this.add.rectangle(400, 240, 800, 480, 0x060606, .84);
      this.add.rectangle(400, 88, 458, 54, 0x12100d, .95).setStrokeStyle(2, 0xd98446, .75);
      this.add.text(400, 70, 'SALVAGE BREAK', { fontFamily: 'Arial Black', fontSize: '25px', color: '#f0c277', stroke: '#1b120b', strokeThickness: 7 }).setOrigin(.5);
      this.add.text(400, 101, 'Choose one upgrade and keep moving.', { fontFamily: 'Arial', fontSize: '11px', color: '#bdad97' }).setOrigin(.5);
      const xs = [170, 400, 630];
      this.cards.forEach((card, index) => this.makeCard(card, xs[index] || 400, 280, index));
      this.input.keyboard?.on('keydown-ONE', () => this.choose(0));
      this.input.keyboard?.on('keydown-TWO', () => this.choose(1));
      this.input.keyboard?.on('keydown-THREE', () => this.choose(2));
    }
    makeCard(card, x, y, index) {
      const accent = CARD_COLORS[card.category] || 0xd98446;
      const container = this.add.container(x, y);
      const glow = this.add.rectangle(0, 0, 208, 258, accent, .08).setStrokeStyle(2, accent, .65);
      const panel = this.add.rectangle(0, 0, 194, 244, 0x15120f, .98).setStrokeStyle(1, 0x7b6b56, .7);
      const pattern = this.add.tileSprite(0, 0, 188, 238, 'c-card-pattern').setAlpha(.42);
      const stripe = this.add.rectangle(0, -91, 194, 44, accent, .13);
      const cat = this.add.text(0, -106, card.category, { fontFamily: 'Arial Black', fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(accent).rgba }).setOrigin(.5);
      const title = this.add.text(0, -76, card.title, { fontFamily: 'Arial Black', fontSize: '17px', color: '#f1dfbf', align: 'center', wordWrap: { width: 170 } }).setOrigin(.5);
      const icon = this.add.graphics();
      icon.lineStyle(3, accent, .95); icon.strokeCircle(0, -21, 29);
      icon.fillStyle(accent, .18); icon.fillCircle(0, -21, 24);
      icon.lineBetween(-16, -21, 16, -21); icon.lineBetween(0, -37, 0, -5);
      const desc = this.add.text(0, 40, card.desc, { fontFamily: 'Arial', fontSize: '12px', color: '#c9b99f', align: 'center', wordWrap: { width: 166 } }).setOrigin(.5);
      const pick = this.add.text(0, 92, `PICK ${index + 1}`, { fontFamily: 'Arial Black', fontSize: '11px', color: '#17100a', backgroundColor: '#d49a59', padding: { x: 18, y: 7 } }).setOrigin(.5).setInteractive({ useHandCursor: true });
      container.add([glow, panel, pattern, stripe, cat, title, icon, desc, pick]);
      container.setSize(208, 258).setInteractive({ useHandCursor: true });
      container.on('pointerover', () => { this.tweens.add({ targets: container, scale: 1.045, duration: 90 }); glow.setFillStyle(accent, .16); });
      container.on('pointerout', () => { this.tweens.add({ targets: container, scale: 1, duration: 90 }); glow.setFillStyle(accent, .08); });
      container.on('pointerdown', () => this.choose(index));
      pick.on('pointerdown', event => { event.stopPropagation(); this.choose(index); });
    }
    choose(index) {
      if (this.chosen) return;
      const card = this.cards[index];
      if (!card) return;
      this.chosen = true;
      card.apply();
      this.parentScene.upgradeOpen = false;
      this.parentScene.scene.resume();
      this.scene.stop();
      if (this.parentScene.pendingLevelUps > 0) {
        this.parentScene.pendingLevelUps--;
        this.parentScene.time.delayedCall(160, () => this.parentScene.openUpgradeCards());
      }
    }
  }
  scene.game.scene.add('UpgradeSceneV2', UpgradeSceneV2, false);
}

function installProgression(scene) {
  scene.scrapXp = 0;
  scene.scrapXpToNext = 20;
  scene.level = Math.max(1, scene.level || 1);
  scene.upgradeLevels = scene.upgradeLevels || {};
  scene.upgradePool = createUpgradePool(scene);
  scene.upgradeOpen = false;
  scene.pendingLevelUps = 0;
  scene.lastScrapTotalForXp = scene.scrap || 0;

  scene.openUpgradeCards = function () {
    if (this.upgradeOpen || this.gameOver) return;
    const cards = chooseCards(this, 3);
    if (!cards.length) return;
    this.upgradeOpen = true;
    this.scene.pause();
    this.scene.launch('UpgradeSceneV2', { parent: this, cards });
  };
  scene.addScrapXp = function (amount) {
    this.scrapXp += amount;
    let levelsGained = 0;
    while (this.scrapXp >= this.scrapXpToNext) {
      this.scrapXp -= this.scrapXpToNext;
      this.level++;
      levelsGained++;
      this.scrapXpToNext = Math.floor(18 + this.level * 10 + Math.pow(this.level, 1.18) * 2.3);
      this.levelText?.setText?.(`LV ${this.level}`);
    }
    this.refreshProgressHud?.();
    if (levelsGained > 0) {
      this.pendingLevelUps += Math.max(0, levelsGained - 1);
      this.openUpgradeCards();
    }
  };

  scene.events.on('postupdate', () => {
    if (scene.gameOver || scene.upgradeOpen) return;
    const total = scene.scrap || 0;
    const gained = Math.max(0, total - scene.lastScrapTotalForXp);
    scene.lastScrapTotalForXp = total;
    if (gained > 0) scene.addScrapXp(gained);
  });
}

function updateRig(scene, time, delta) {
  if (!scene.rigSummoned || !scene.cart?.visible) return;
  const dt = Math.max(.001, delta / 1000);
  const moveLen = scene.move?.length?.() || 0;
  const desiredX = scene.hero.x - (scene.move?.x || 0) * 110 - 105;
  const desiredY = scene.hero.y - (scene.move?.y || 0) * 90 + 92;
  const dist = Phaser.Math.Distance.Between(scene.cart.x, scene.cart.y, desiredX, desiredY);
  const catchup = dist > 260 ? 7.4 : dist > 160 ? 5.2 : 3.3;
  const follow = 1 - Math.exp(-dt * catchup);
  scene.cart.x = Phaser.Math.Linear(scene.cart.x, desiredX, follow);
  scene.cart.y = Phaser.Math.Linear(scene.cart.y, desiredY, follow);
  scene.cart.rotation = Phaser.Math.Linear(scene.cart.rotation, (scene.move?.x || 0) * .025, .08);
  scene.cartWheels?.forEach((wheel, i) => wheel.rotation += .05 + moveLen * .08 * (i % 2 ? 1 : .92));

  const target = scene.weaponSystem.acquireTarget(scene.cart.x, scene.cart.y, 500);
  if (!target) return;
  const angle = Phaser.Math.Angle.Between(scene.cart.x, scene.cart.y - 18, target.x, target.y);
  scene.turrets?.forEach(turret => turret.rotation = Phaser.Math.Angle.RotateTo(turret.rotation, angle - scene.cart.rotation, .13));
  if (time < scene.lastRigShot + scene.rigFireDelay) return;
  scene.lastRigShot = time;
  scene.weaponSystem.fireSupportVolley({
    originX: scene.cart.x,
    originY: scene.cart.y - 18,
    angle,
    spreads: scene.rigShots > 1 ? [-.06, .06] : [0],
    muzzleDistance: 52,
    speed: 660,
    damage: scene.primaryWeapon.damage * scene.rigDamageScale,
    lifeMs: 1050,
    scale: .64
  });
  scene.playTone?.(118, .035, 'square', .012, -22);
}

function installUpdateLoop(scene) {
  const oldUpdate = (scene.sys?.sceneUpdate || scene.update).bind(scene);
  const phaseCUpdate = function (time, delta) {
    oldUpdate(time, delta);
    if (this.gameOver || this.upgradeOpen) return;
    updateRig(this, time, delta);
  };
  scene.update = phaseCUpdate;
  if (scene.sys) scene.sys.sceneUpdate = phaseCUpdate;
}

export async function applyPhaseC() {
  const scene = await getGameScene();
  if (!scene.weaponSystem?.fireSupportVolley || !scene.projectileSystem) throw new Error('Phase C requires WeaponSystem + ProjectileSystem foundation');
  ensureGeneratedTextures(scene);
  installPrimaryWeapon(scene);
  installRigVisual(scene);
  installHud(scene);
  createUpgradeScene(scene);
  installProgression(scene);
  installUpdateLoop(scene);
  window.__WM_PHASE_C__ = true;
  document.documentElement.dataset.wreckmarchPhaseC = 'active';
  window.__WM_LOG__?.('Phase C active: weapon rig + WeaponSystem profile + Scrap cards + optional Rig');
  return true;
}

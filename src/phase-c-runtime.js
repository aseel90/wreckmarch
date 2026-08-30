import { RUN_BALANCE, getPlayerMoveSpeed } from './balance/run-balance.js?v=6';
import { createRegisteredStatUpgradeChoice } from './upgrades/upgrade-runtime.js?v=2';

/* WRECKMARCH — Phase C: combat correction + Scrap level/card loop + optional Rig */
const W = 540;
const H = 960;
const WORLD_W = 2200;
const WORLD_H = 2200;
const TAU = Math.PI * 2;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.weaponSprite && scene.primaryWeapon) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase C');
}

function loadPhaseCAssets(scene) {
  if (scene.textures.exists('c-gun-arm')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Phase C asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      if (!failed) resolve();
    });
    scene.load.svg('c-gun-arm', './assets/hero/gun-arm.svg');
    scene.load.start();
  });
}

function tuneWorldScale(scene) {
  scene.children.list.forEach(obj => {
    const key = obj?.texture?.key || '';
    if (key === 'b1-wreck-a' || key === 'b1-wreck-b') obj.setScale(obj.scaleX * 1.48);
  });
}

function tuneEnemy(enemy) {
  if (!enemy?.active) return;
  const scale = enemy.elite ? .78 : .64;
  enemy.setScale(scale);
  enemy.hitRadius = enemy.elite ? 30 : 25;
  if (enemy.body) {
    enemy.body.setCircle(36, 32, 5);
    enemy.body.updateFromGameObject?.();
  }
}

function installEnemyScaleAndHitboxes(scene) {
  scene.enemies.children.iterate(tuneEnemy);
  const baseSpawn = scene.spawnEnemy.bind(scene);
  scene.spawnEnemy = function(elite = false) {
    const before = new Set(this.enemies.getChildren());
    baseSpawn(elite);
    this.enemies.children.iterate(enemy => {
      if (enemy?.active && !before.has(enemy)) tuneEnemy(enemy);
    });
  };
}

function installWeaponRig(scene) {
  const oldWeapon = scene.weaponSprite;
  scene.weaponRig?.destroy?.(true);

  const rig = scene.add.container(scene.hero.x, scene.hero.y).setDepth(25);
  const gun = scene.add.image(35, 0, 'b1-rivet-gun').setOrigin(.34, .72).setScale(.52);
  const arm = scene.add.image(0, 0, 'c-gun-arm').setOrigin(.05, .5).setScale(.72);
  rig.add([gun, arm]);

  oldWeapon.setVisible(false);
  scene.weaponRig = rig;
  scene.weaponSprite = gun;
  scene.weaponArmSprite = arm;
  scene.weaponMuzzleDistance = 67;
  scene.__weaponRigMode = 'phase-c-two-hand';

  const updateWeapon = scene.updateWeaponPose?.bind(scene);
  scene.updateWeaponPose = function() {
    updateWeapon?.();
    if (!this.weaponRig || !this.hero) return;
    const angle = Number.isFinite(this.aimAngle) ? this.aimAngle : 0;
    this.weaponRig.setPosition(this.hero.x, this.hero.y).setRotation(angle);
    const flip = Math.cos(angle) < 0;
    this.weaponRig.setScale(1, flip ? -1 : 1);
  };
}

function installPrimaryWeaponProfile(scene) {
  scene.primaryWeapon = scene.primaryWeapon || {};
  scene.primaryWeapon.damage = scene.primaryWeapon.damage || scene.damage || 24;
  scene.primaryWeapon.fireDelay = scene.primaryWeapon.fireDelay || scene.fireDelay || 390;
  scene.primaryWeapon.projectileSpeed = scene.primaryWeapon.projectileSpeed || 720;
  scene.primaryWeapon.range = scene.primaryWeapon.range || 570;
  scene.damage = scene.primaryWeapon.damage;
  scene.fireDelay = scene.primaryWeapon.fireDelay;
}

function installWeaponSystemProfile(scene) {
  const system = scene.weaponSystem;
  if (!system?.setProfile) return;
  system.setProfile({
    getDamage: () => scene.primaryWeapon.damage,
    getFireDelay: () => scene.primaryWeapon.fireDelay,
    getProjectileSpeed: () => scene.primaryWeapon.projectileSpeed,
    getRange: () => scene.primaryWeapon.range,
    getMuzzleDistance: () => scene.weaponMuzzleDistance || 67,
    getMultishot: () => scene.twinShots || 1
  });
}

function installProgressHud(scene) {
  scene.level = scene.level || 1;
  scene.scrapXp = scene.scrapXp || 0;
  scene.scrapNeeded = scene.scrapNeeded || 12;
  scene.pendingLevelUps = scene.pendingLevelUps || 0;
  scene.upgradeLevels = scene.upgradeLevels || {};

  scene.levelText?.destroy?.();
  scene.xpBg?.destroy?.();
  scene.xpFill?.destroy?.();

  scene.levelText = scene.add.text(28, 71, 'LV 1', {
    fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#f0cb8f'
  }).setDepth(920).setScrollFactor(0);
  scene.xpBg = scene.add.rectangle(W / 2, 96, 328, 10, 0x111820, .98)
    .setStrokeStyle(2, 0x59636d, .75).setDepth(918).setScrollFactor(0);
  scene.xpFill = scene.add.rectangle(W / 2 - 162, 96, 324, 6, 0x55d7e5, 1)
    .setOrigin(0, .5).setDepth(919).setScrollFactor(0).setScale(0, 1);
  scene.waveText.setY(69);
  scene.scrapText.setY(69);

  scene.refreshProgressHud = function() {
    const ratio = Phaser.Math.Clamp(this.scrapXp / Math.max(1, this.scrapNeeded), 0, 1);
    this.levelText.setText(`LV ${this.level}`);
    this.scrapText.setText(`SCRAP ${this.scrapXp}/${this.scrapNeeded}`);
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
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    { id: 'overclock', category: 'HERO', title: 'OVERCLOCK', desc: '12% faster fire rate.', weight: 1.2, available: () => upgradeLevel(scene, 'overclock') < 5, apply: () => { bumpUpgrade(scene, 'overclock'); scene.primaryWeapon.fireDelay = Math.max(145, scene.primaryWeapon.fireDelay * .88); scene.fireDelay = scene.primaryWeapon.fireDelay; } },
    { id: 'long-barrel', category: 'HERO', title: 'LONG BARREL', desc: '+18% projectile speed and +10% range.', weight: 1, available: () => upgradeLevel(scene, 'long-barrel') < 4, apply: () => { bumpUpgrade(scene, 'long-barrel'); scene.primaryWeapon.projectileSpeed *= 1.18; scene.primaryWeapon.range *= 1.1; } },
    { id: 'twin-riveter', category: 'HERO', title: 'TWIN RIVETER', desc: 'Fire an extra rivet with slight spread.', weight: .72, available: () => upgradeLevel(scene, 'twin-riveter') < 1, apply: () => { bumpUpgrade(scene, 'twin-riveter'); scene.twinShots = 2; } },
    { id: 'fleet-feet', category: 'UTILITY', title: 'FLEET FEET', desc: '+3% movement speed.', weight: 1.05, available: () => upgradeLevel(scene, 'fleet-feet') < RUN_BALANCE.player.fleetFeetMaxLevel, apply: () => { bumpUpgrade(scene, 'fleet-feet'); scene.heroSpeed = getPlayerMoveSpeed(scene.__baseHeroMoveSpeed, upgradeLevel(scene, 'fleet-feet')); } },
    { id: 'scrap-magnet', category: 'UTILITY', title: 'SCRAP MAGNET', desc: 'Increase Scrap pickup radius by 25%.', weight: 1, available: () => upgradeLevel(scene, 'scrap-magnet') < 4, apply: () => { bumpUpgrade(scene, 'scrap-magnet'); scene.magnetRadius *= 1.25; } },
    { id: 'armor-plate', category: 'UTILITY', title: 'ARMOR PLATE', desc: '+15 max HP and restore 15 HP.', weight: .95, available: () => upgradeLevel(scene, 'armor-plate') < 4, apply: () => { bumpUpgrade(scene, 'armor-plate'); scene.heroMaxHp += 15; scene.heroHp = Math.min(scene.heroMaxHp, scene.heroHp + 15); } },
    { id: 'call-rig', category: 'FORTRESS', title: 'CALL THE RIG', desc: 'Summon the moving Fortress companion.', weight: .7, available: () => scene.level >= 2 && !scene.rigSummoned, apply: () => summonRig(scene) },
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
    chosen.push(available.splice(Math.min(index, available.length - 1), 1)[0]);
  }
  return chosen;
}

function makeCard(scene, y, upgrade, index) {
  const card = scene.add.container(W / 2, y).setDepth(4200).setScrollFactor(0);
  const bg = scene.add.rectangle(0, 0, 430, 142, 0x151b22, .98).setStrokeStyle(2, index === 0 ? 0xd0a862 : 0x56636f, .95).setInteractive({ useHandCursor: true });
  const category = scene.add.text(-190, -50, upgrade.category, { fontFamily: 'Arial Black, Arial', fontSize: '11px', color: upgrade.category === 'FORTRESS' ? '#55d8e6' : '#d8b06d' }).setOrigin(0, .5);
  const title = scene.add.text(-190, -20, upgrade.title, { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#f0f2f4' }).setOrigin(0, .5);
  const desc = scene.add.text(-190, 18, upgrade.desc, { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#aeb8c2', wordWrap: { width: 360 } }).setOrigin(0, 0);
  card.add([bg, category, title, desc]);
  bg.on('pointerdown', (_p, _x, _y, event) => {
    event?.stopPropagation?.();
    if (!scene.upgradeOpen) return;
    upgrade.apply();
    scene.closeUpgradeCards();
  });
  return card;
}

function installUpgradeCards(scene) {
  scene.upgradeUi = [];
  scene.openUpgradeCards = function() {
    if (this.upgradeOpen || this.gameOver) return;
    const choices = weightedChoices(this, 3);
    if (!choices.length) return;
    this.upgradeOpen = true;
    this.physics.pause();
    this.spawnEvent.paused = true;
    this.waveEvent.paused = true;
    this.joy.active = false;
    this.joy.id = null;
    this.joyBase.setPosition(92, H - 118).setAlpha(.2);
    this.joyKnob.setPosition(92, H - 118).setAlpha(.2);

    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x070a0e, .88).setDepth(4100).setScrollFactor(0);
    const label = this.add.text(W / 2, 150, `LEVEL ${this.level}`, { fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#61d9e6' }).setOrigin(.5).setDepth(4201).setScrollFactor(0);
    const title = this.add.text(W / 2, 186, 'CHOOSE AN UPGRADE', { fontFamily: 'Arial Black, Arial', fontSize: '25px', color: '#f0d09b' }).setOrigin(.5).setDepth(4201).setScrollFactor(0);
    this.upgradeUi = [shade, label, title];
    [300, 465, 630].forEach((y, i) => { if (choices[i]) this.upgradeUi.push(makeCard(this, y, choices[i], i)); });
  };

  scene.closeUpgradeCards = function() {
    this.upgradeUi.forEach(obj => obj?.destroy?.(true));
    this.upgradeUi.length = 0;
    this.upgradeOpen = false;
    if (!this.gameOver) {
      this.physics.resume();
      this.spawnEvent.paused = false;
      this.waveEvent.paused = false;
    }
    this.joyBase.setAlpha(.38);
    this.joyKnob.setAlpha(.4);
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.time.delayedCall(80, () => this.openUpgradeCards());
    }
  };
}

function installScrapProgression(scene) {
  scene.magnetRadius = 135;
  scene.lastScrapTotalForXp = scene.scrap || 0;
  scene.updateScrapMagnet = function() {
    this.scraps.children.iterate(s => {
      if (!s?.active) return;
      const dx = this.hero.x - s.x;
      const dy = this.hero.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist > this.magnetRadius || dist < 4) return;
      const pull = Phaser.Math.Clamp((this.magnetRadius - dist) / this.magnetRadius, .12, 1);
      s.x += dx * pull * .115;
      s.y += dy * pull * .115;
    });
  };

  const baseUpdate = scene.update.bind(scene);
  scene.update = function(time, delta) {
    baseUpdate(time, delta);
    this.updateWeaponPose?.();
    this.updateScrapMagnet?.();
    this.refreshProgressHud?.();
  };

  const originalCollect = scene.collectScrap?.bind(scene);
  if (originalCollect) {
    scene.collectScrap = function(scrap) {
      const before = this.scrap || 0;
      originalCollect(scrap);
      const gained = Math.max(0, (this.scrap || 0) - before);
      if (gained) {
        this.scrapXp += gained;
        while (this.scrapXp >= this.scrapNeeded) {
          this.scrapXp -= this.scrapNeeded;
          this.level += 1;
          this.scrapNeeded = Math.round(this.scrapNeeded * 1.24 + 4);
          if (this.upgradeOpen) this.pendingLevelUps += 1;
          else this.time.delayedCall(70, () => this.openUpgradeCards());
        }
        this.refreshProgressHud();
      }
    };
  }
}

function installRigSupport(scene) {
  scene.rigSummoned = false;
  scene.cart?.setVisible?.(false)?.setActive?.(false);
  scene.rigFireDelay = 920;
  scene.rigDamageScale = .58;
  scene.rigShots = 1;
  scene.lastRigShot = 0;

  const oldUpdate = scene.update.bind(scene);
  scene.update = function(time, delta) {
    oldUpdate(time, delta);
    if (!this.rigSummoned || !this.cart?.active) return;
    const dx = (this.hero.x - 135) - this.cart.x;
    const dy = (this.hero.y + 92) - this.cart.y;
    this.cart.x += dx * Math.min(1, delta * .0046);
    this.cart.y += dy * Math.min(1, delta * .0046);
    this.cart.setDepth(this.hero.y + 1);
    if (time < this.lastRigShot + this.rigFireDelay) return;
    const target = this.enemies.getChildren().filter(e => e?.active).sort((a, b) => Phaser.Math.Distance.Between(this.cart.x, this.cart.y, a.x, a.y) - Phaser.Math.Distance.Between(this.cart.x, this.cart.y, b.x, b.y))[0];
    if (!target) return;
    this.lastRigShot = time;
    const angle = Phaser.Math.Angle.Between(this.cart.x, this.cart.y, target.x, target.y);
    const shots = Math.max(1, this.rigShots || 1);
    for (let i = 0; i < shots; i++) {
      const spread = shots === 1 ? 0 : (i - (shots - 1) / 2) * .13;
      const shotAngle = angle + spread;
      const bullet = this.bullets.get(this.cart.x, this.cart.y, 'spark');
      if (!bullet) continue;
      bullet.enableBody(true, this.cart.x, this.cart.y, true, true);
      bullet.setTint(0x64dce7).setScale(.78);
      bullet.damage = this.primaryWeapon.damage * this.rigDamageScale;
      bullet.range = this.primaryWeapon.range * .8;
      bullet.startX = this.cart.x;
      bullet.startY = this.cart.y;
      bullet.body.setVelocity(Math.cos(shotAngle) * this.primaryWeapon.projectileSpeed * .78, Math.sin(shotAngle) * this.primaryWeapon.projectileSpeed * .78);
    }
  };
}

function installPhaseCSelfTest(scene) {
  if (new URLSearchParams(location.search).get('autotest') !== '1') return;
  const checks = {
    profile: !!scene.primaryWeapon,
    weaponSystem: !!scene.weaponSystem,
    progress: !!scene.upgradeLevels,
    cards: typeof scene.openUpgradeCards === 'function',
    rig: scene.rigSummoned === false
  };
  const ok = Object.values(checks).every(Boolean);
  window.__WM_PHASE_C_SELF_TEST__ = { ok, ...checks };
  document.documentElement.dataset.wreckmarchPhaseCSelfTest = ok ? 'passed' : 'failed';
  window.__WM_LOG__?.(`Phase C self-test ${ok ? 'PASSED' : 'FAILED'}: ${Object.entries(checks).map(([k, v]) => `${k}=${v ? 'ok' : 'FAIL'}`).join(' ')}`);
  if (!ok) throw new Error('Phase C self-test failed');
}

export async function applyPhaseC() {
  const scene = await getScene();
  await loadPhaseCAssets(scene);
  tuneWorldScale(scene);
  installEnemyScaleAndHitboxes(scene);
  installPrimaryWeaponProfile(scene);
  installWeaponRig(scene);
  installWeaponSystemProfile(scene);
  installProgressHud(scene);
  installUpgradeCards(scene);
  installScrapProgression(scene);
  installRigSupport(scene);
  installPhaseCSelfTest(scene);
  window.__WM_LOG__?.('Phase C active: weapon rig + WeaponSystem profile + Scrap cards + optional Rig');
  return scene;
}

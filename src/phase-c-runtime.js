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
  oldWeapon?.destroy?.();

  scene.weaponRig = rig;
  scene.weaponSprite = gun;
  scene.weaponArm = arm;
  scene.weaponAim = scene.weaponAim || 0;
  scene.weaponMuzzleLocal = 67;
  scene.primaryWeapon = {
    ...scene.primaryWeapon,
    damage: scene.primaryWeapon.damage || scene.damage || 24,
    fireDelay: scene.primaryWeapon.fireDelay || scene.fireDelay || 390,
    projectileSpeed: scene.primaryWeapon.projectileSpeed || 720,
    range: scene.primaryWeapon.range || 570
  };
  scene.twinShots = scene.twinShots || 1;

  scene.updateWeaponPose = function() {
    const ang = this.weaponAim;
    const facesLeft = Math.cos(ang) < 0;
    const shoulderX = this.hero.x + (facesLeft ? -8 : 8);
    const shoulderY = this.hero.y + 9;
    this.weaponRig.setPosition(shoulderX, shoulderY).setRotation(ang);
    this.weaponRig.setDepth(Math.sin(ang) < -.18 ? 19 : 25);
    this.weaponSprite.setFlipY(facesLeft);
    this.weaponArm.setFlipY(facesLeft);
  };

  scene.projectileSystem.configureBounds({ minX: -80, maxX: WORLD_W + 80, minY: -80, maxY: WORLD_H + 80 });
  scene.weaponSystem.configureHero({
    aimYOffset: 6,
    targetTurnRate: .22,
    moveTurnRate: .14,
    twinSpread2: .055,
    twinSpread3: .085,
    projectile: { lifeMs: 1180, scale: .74, radius: 8, offsetX: 2, offsetY: 2 },
    muzzleResolver: spread => {
      const ang = scene.weaponAim + spread;
      return new Phaser.Math.Vector2(
        scene.weaponRig.x + Math.cos(ang) * scene.weaponMuzzleLocal,
        scene.weaponRig.y + Math.sin(ang) * scene.weaponMuzzleLocal
      );
    },
    fireFeedback: ({ angle, muzzle }) => {
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash').setDepth(31).setRotation(angle).setScale(.52);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .1, duration: 70, onComplete: () => flash.destroy() });
      scene.weaponRig.x -= Math.cos(angle) * 4;
      scene.weaponRig.y -= Math.sin(angle) * 4;
      scene.playTone?.(165, .045, 'square', .019, -34);
    }
  });

  scene.updateWeaponPose();
}

function installHitboxDebug(scene) {
  if (!window.__WM_DEBUG__) return;
  scene.hitboxDebugEnabled = false;
  scene.hitboxGraphics = scene.add.graphics().setDepth(5000);
  scene.hitboxButton = scene.add.text(W - 18, H - 88, 'HITBOX OFF', {
    fontFamily: 'Arial Black, Arial', fontSize: '11px', color: '#7cfb9b',
    backgroundColor: '#07100dcc', padding: { x: 10, y: 7 }
  }).setOrigin(1, 1).setDepth(5100).setScrollFactor(0).setInteractive({ useHandCursor: true });

  scene.hitboxButton.on('pointerdown', (_p, _x, _y, event) => {
    event?.stopPropagation?.();
    scene.hitboxDebugEnabled = !scene.hitboxDebugEnabled;
    scene.hitboxButton.setText(scene.hitboxDebugEnabled ? 'HITBOX ON' : 'HITBOX OFF');
    if (!scene.hitboxDebugEnabled) scene.hitboxGraphics.clear();
  });

  scene.drawHitboxes = function() {
    const g = this.hitboxGraphics;
    if (!this.hitboxDebugEnabled) { g.clear(); return; }
    g.clear();
    g.lineStyle(2, 0x67ff83, .9);
    g.strokeCircle(this.hero.x, this.hero.y, 25);
    g.lineStyle(2, 0xff6c60, .95);
    this.enemies.children.iterate(enemy => {
      if (enemy?.active) g.strokeCircle(enemy.x + (enemy.flipX ? -4 : 4), enemy.y + 1, (enemy.hitRadius || 25) + 5);
    });
    g.lineStyle(2, 0x67dff5, .95);
    this.bullets.children.iterate(bullet => {
      if (bullet?.active) g.strokeCircle(bullet.x, bullet.y, 7);
    });
  };
}

function xpNeeded(level) {
  const l = Math.max(1, level);
  return 6 + (l - 1) * 4 + Math.floor(Math.pow(l - 1, 1.18));
}

function installProgressHud(scene) {
  scene.level = 1;
  scene.scrapXp = 0;
  scene.scrapNeeded = xpNeeded(scene.level);
  scene.pendingLevelUps = 0;
  scene.upgradeOpen = false;
  scene.upgradeLevels = {};

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
    { id: 'twin-riveter', category: 'HERO', title: 'TWIN RIVETER', desc: 'Fire an extra rivet with slight spread.', weight: .72, available: () => upgradeLevel(scene, 'twin-riveter') < 2, apply: () => { bumpUpgrade(scene, 'twin-riveter'); scene.twinShots = Math.min(3, (scene.twinShots || 1) + 1); } },
    { id: 'fleet-feet', category: 'UTILITY', title: 'FLEET FEET', desc: '+8% movement speed.', weight: 1.05, available: () => upgradeLevel(scene, 'fleet-feet') < 4, apply: () => { bumpUpgrade(scene, 'fleet-feet'); scene.heroSpeed = Math.min(365, scene.heroSpeed * 1.08); } },
    { id: 'scrap-magnet', category: 'UTILITY', title: 'SCRAP MAGNET', desc: 'Increase Scrap pickup radius by 25%.', weight: 1, available: () => upgradeLevel(scene, 'scrap-magnet') < 4, apply: () => { bumpUpgrade(scene, 'scrap-magnet'); scene.magnetRadius *= 1.25; } },
    { id: 'armor-plate', category: 'UTILITY', title: 'ARMOR PLATE', desc: '+15 max HP and restore 15 HP.', weight: .95, available: () => upgradeLevel(scene, 'armor-plate') < 4, apply: () => { bumpUpgrade(scene, 'armor-plate'); scene.heroMaxHp += 15; scene.heroHp = Math.min(scene.heroMaxHp, scene.heroHp + 15); } },
    { id: 'call-rig', category: 'FORTRESS', title: 'CALL THE RIG', desc: 'Summon the moving Fortress companion.', weight: .7, available: () => scene.level >= 2 && !scene.rigSummoned, apply: () => summonRig(scene) },
    { id: 'rig-overdrive', category: 'FORTRESS', title: 'RIG OVERDRIVE', desc: 'Fortress cannon fires 15% faster.', weight: .92, available: () => scene.rigSummoned && upgradeLevel(scene, 'rig-overdrive') < 4, apply: () => { bumpUpgrade(scene, 'rig-overdrive'); scene.rigFireDelay = Math.max(360, scene.rigFireDelay * .85); } },
    { id: 'twin-cannon', category: 'FORTRESS', title: 'TWIN CANNON', desc: 'Fortress fires another support shot.', weight: .7, available: () => scene.rigSummoned && upgradeLevel(scene, 'twin-cannon') < 1, apply: () => { bumpUpgrade(scene, 'twin-cannon'); scene.rigShots = 2; } }
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
      const d = Phaser.Math.Distance.Between(s.x, s.y, this.hero.x, this.hero.y);
      if (d < this.magnetRadius) {
        const strength = Phaser.Math.Clamp((this.magnetRadius + 8 - d) / (this.magnetRadius + 8), .08, 1);
        const ang = Phaser.Math.Angle.Between(s.x, s.y, this.hero.x, this.hero.y);
        s.setVelocity(Math.cos(ang) * (140 + strength * 350), Math.sin(ang) * (140 + strength * 350));
      } else s.setVelocity(s.body.velocity.x * .9, s.body.velocity.y * .9);
      s.rotation += .045;
    });
  };

  scene.addScrapXp = function(amount) {
    this.scrapXp += amount;
    let levelsGained = 0;
    while (this.scrapXp >= this.scrapNeeded) {
      this.scrapXp -= this.scrapNeeded;
      this.level += 1;
      this.scrapNeeded = xpNeeded(this.level);
      levelsGained += 1;
    }
    this.refreshProgressHud();
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

function installUpdateCoordinator(scene) {
  const baseSceneUpdate = (scene.sys?.sceneUpdate || scene.update).bind(scene);
  const coordinatedUpdate = function(time, delta) {
    if (this.upgradeOpen) {
      this.updateWeaponPose?.();
      this.drawHitboxes?.();
      return;
    }

    baseSceneUpdate(time, delta);
    if (this.gameOver) return;
    this.refreshProgressHud?.();
    updateRig(this, time, delta);
    this.drawHitboxes?.();
  };

  scene.update = coordinatedUpdate;
  if (scene.sys) scene.sys.sceneUpdate = coordinatedUpdate;
}

export async function applyPhaseC() {
  const scene = await getScene();
  await loadPhaseCAssets(scene);
  tuneWorldScale(scene);
  installEnemyScaleAndHitboxes(scene);
  installWeaponRig(scene);
  installProgressHud(scene);
  installUpgradeCards(scene);
  installScrapProgression(scene);
  installHitboxDebug(scene);
  installUpdateCoordinator(scene);

  window.__WM_PHASE_C__ = true;
  document.documentElement.dataset.wreckmarchPhaseC = 'active';
  window.__WM_LOG__?.('Phase C active: weapon rig + WeaponSystem profile + Scrap cards + optional Rig');
  return true;
}

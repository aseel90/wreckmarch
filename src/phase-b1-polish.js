/* WRECKMARCH — Phase B.1 polish: hand-anchored weapon + asset-based wasteland */
const WORLD_W = 2200;
const WORLD_H = 2200;
const TAU = Math.PI * 2;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.weaponSprite) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase B.1');
}

function loadPolishAssets(scene) {
  const assets = [
    ['b1-ground-a', './assets/wasteland/ground-a.svg'],
    ['b1-ground-b', './assets/wasteland/ground-b.svg'],
    ['b1-wreck-a', './assets/wasteland/wreck-a.svg'],
    ['b1-wreck-b', './assets/wasteland/wreck-b.svg'],
    ['b1-rivet-gun', './assets/weapons/rivet-gun.svg']
  ];
  const missing = assets.filter(([key]) => !scene.textures.exists(key));
  if (!missing.length) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      reject(new Error(`Phase B.1 asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      if (!failed) resolve();
    });
    missing.forEach(([key, url]) => scene.load.svg(key, url));
    scene.load.start();
  });
}

function clearOldWorldArt(scene) {
  const keep = new Set([
    scene.hero, scene.heroShadow, scene.heroHpBg, scene.heroHpBar,
    scene.titleText, scene.timerText, scene.waveText, scene.scrapText,
    scene.hint, scene.joyBase, scene.joyKnob, scene.weaponSprite
  ]);
  [...scene.children.list].forEach(obj => {
    if (!obj || keep.has(obj) || !obj.visible) return;
    if ((obj.depth ?? 0) <= 3) obj.destroy();
  });
}

function addGroundDetails(scene) {
  const cols = Math.ceil(WORLD_W / 500) + 1;
  const rows = Math.ceil(WORLD_H / 500) + 1;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const key = (gx + gy) % 2 ? 'b1-ground-a' : 'b1-ground-b';
      const tile = scene.add.image(gx * 500 + 250, gy * 500 + 250, key)
        .setDepth(-5).setAlpha(.9).setScale(1.06)
        .setRotation(((gx * 3 + gy * 5) % 4) * Math.PI / 2);
      if ((gx + gy) % 3 === 0) tile.setFlipX(true);
      if ((gx * 2 + gy) % 4 === 0) tile.setFlipY(true);
    }
  }
}

function addRoads(scene) {
  const roads = scene.add.graphics().setDepth(-4);
  roads.lineStyle(170, 0x2b3034, .92);
  roads.beginPath();
  roads.moveTo(80, 1710); roads.lineTo(420, 1510); roads.lineTo(760, 1560); roads.lineTo(1130, 1608); roads.lineTo(1500, 1480); roads.lineTo(1800, 1325); roads.lineTo(2140, 1245); roads.strokePath();
  roads.lineStyle(150, 0x2c3135, .9);
  roads.beginPath();
  roads.moveTo(120, 470); roads.lineTo(440, 610); roads.lineTo(760, 560); roads.lineTo(1040, 520); roads.lineTo(1320, 660); roads.lineTo(1600, 805); roads.lineTo(2050, 790); roads.strokePath();
  roads.lineStyle(4, 0x665c4e, .38);
  roads.beginPath();
  roads.moveTo(82, 1710); roads.lineTo(420, 1510); roads.lineTo(760, 1560); roads.lineTo(1130, 1608); roads.lineTo(1500, 1480); roads.lineTo(1800, 1325); roads.lineTo(2140, 1245); roads.strokePath();
  roads.beginPath();
  roads.moveTo(120, 470); roads.lineTo(440, 610); roads.lineTo(760, 560); roads.lineTo(1040, 520); roads.lineTo(1320, 660); roads.lineTo(1600, 805); roads.lineTo(2050, 790); roads.strokePath();
}

function addWorldProps(scene) {
  const wrecks = [
    [372, 620, 'b1-wreck-a', -.25, .78], [1600, 500, 'b1-wreck-b', .17, .8],
    [1710, 1540, 'b1-wreck-a', -.18, .82], [520, 1755, 'b1-wreck-b', .25, .78],
    [1280, 1040, 'b1-wreck-a', -.08, .68], [1970, 1020, 'b1-wreck-b', -.23, .7]
  ];
  wrecks.forEach(([x, y, key, rot, scale]) => scene.add.image(x, y, key).setDepth(3).setRotation(rot).setScale(scale).setAlpha(.96));
  if (scene.textures.exists('art-scrap-pile') && scene.textures.exists('art-barrel')) {
    [
      [244,240,'art-scrap-pile',.62,.12],[484,722,'art-barrel',.54,-.08],[882,402,'art-scrap-pile',.58,-.12],
      [1174,815,'art-barrel',.52,.16],[1516,295,'art-barrel',.58,-.14],[1812,654,'art-scrap-pile',.62,.08],
      [302,1332,'art-barrel',.54,.18],[772,1570,'art-scrap-pile',.60,-.16],[1102,1220,'art-barrel',.50,.06],
      [1478,1708,'art-scrap-pile',.64,.18],[1908,1390,'art-barrel',.54,-.12],[1740,1950,'art-scrap-pile',.60,.08],
      [1002,1888,'art-barrel',.52,.16],[274,1965,'art-scrap-pile',.58,-.18]
    ].forEach(([x, y, key, scale, rot]) => scene.add.image(x, y, key).setDepth(3).setScale(scale).setRotation(rot).setAlpha(.82));
  }
}

function rebuildWasteland(scene) {
  clearOldWorldArt(scene);
  scene.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x251f1b, 1).setDepth(-6);
  addGroundDetails(scene);
  addRoads(scene);
  addWorldProps(scene);
}

function repinWeapon(scene) {
  scene.primaryWeapon = { ...scene.primaryWeapon, texture: 'b1-rivet-gun', muzzleDistance: 37 };
  scene.weaponSprite.setTexture('b1-rivet-gun').setScale(.54).setDepth(24);
  scene.weaponAnchor = new Phaser.Math.Vector2();
  scene.weaponHandSide = 1;
  scene.updateWeaponPose = function() {
    const ang = this.weaponAim;
    const side = Math.cos(ang) < 0 ? -1 : 1;
    this.weaponHandSide = side;
    const handX = this.hero.x + side * 28;
    const handY = this.hero.y + 16;
    this.weaponAnchor.set(handX, handY);
    this.weaponSprite.setOrigin(side < 0 ? .84 : .16, .58);
    this.weaponSprite.setPosition(handX, handY);
    this.weaponSprite.setRotation(ang);
    this.weaponSprite.setFlipY(side < 0);
  };
  scene.getWeaponMuzzle = function() {
    const ang = this.weaponAim;
    const side = this.weaponHandSide || 1;
    const anchorX = this.weaponAnchor.x || this.hero.x + side * 28;
    const anchorY = this.weaponAnchor.y || this.hero.y + 16;
    return new Phaser.Math.Vector2(anchorX + Math.cos(ang) * this.primaryWeapon.muzzleDistance, anchorY + Math.sin(ang) * this.primaryWeapon.muzzleDistance);
  };
  scene.autoFire = function(time) {
    const target = this.findNearestEnemy(this.hero.x, this.hero.y, this.primaryWeapon.range);
    if (target) {
      const desired = Phaser.Math.Angle.Between(this.hero.x, this.hero.y + 7, target.x, target.y);
      this.weaponAim = Phaser.Math.Angle.RotateTo(this.weaponAim, desired, .22);
    } else if (this.move.lengthSq() > .05) {
      this.weaponAim = Phaser.Math.Angle.RotateTo(this.weaponAim, Math.atan2(this.move.y, this.move.x), .14);
    }
    this.updateWeaponPose();
    if (!target || time < this.lastShot + this.primaryWeapon.fireDelay) return;
    this.lastShot = time;
    const ang = this.weaponAim;
    const muzzle = this.getWeaponMuzzle();
    const bullet = this.bullets.create(muzzle.x, muzzle.y, 'bullet').setDepth(30).setScale(.74);
    bullet.setCircle(7, 3, 3);
    bullet.damage = this.primaryWeapon.damage;
    bullet.life = 1120;
    bullet.setVelocity(Math.cos(ang) * this.primaryWeapon.projectileSpeed, Math.sin(ang) * this.primaryWeapon.projectileSpeed);
    const flash = this.add.image(muzzle.x, muzzle.y, 'flash').setDepth(31).setRotation(ang).setScale(.52);
    this.tweens.add({ targets: flash, alpha: 0, scale: .1, duration: 70, onComplete: () => flash.destroy() });
    this.weaponSprite.x -= Math.cos(ang) * 4;
    this.weaponSprite.y -= Math.sin(ang) * 4;
    this.playTone?.(165, .045, 'square', .019, -34);
  };
  scene.updateWeaponPose();
}

export async function applyPhaseB1Polish() {
  const scene = await getScene();
  await loadPolishAssets(scene);
  rebuildWasteland(scene);
  repinWeapon(scene);
  window.__WM_PHASE_B1__ = true;
  document.documentElement.dataset.wreckmarchPolish = 'b1';
  window.__WM_LOG__?.('Phase B.1 polish active: hand-anchored Rivet Gun + asset-based wasteland');
  return true;
}

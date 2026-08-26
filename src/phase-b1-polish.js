/* WRECKMARCH — Phase B.1 polish: hand-anchored weapon + asset-based wasteland */
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
    if (!obj || keep.has(obj) || !obj.visible || obj.__terrainSystemObject) return;
    if ((obj.depth ?? 0) <= 3) obj.destroy();
  });
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
  // TerrainSystem remains untouched; B.1 only installs its higher fidelity props.
  addWorldProps(scene);
}

function repinWeapon(scene) {
  scene.primaryWeapon = { ...scene.primaryWeapon, texture: 'b1-rivet-gun', muzzleDistance: 37 };
  scene.weaponSystem.configureHero({
    aimYOffset: 7,
    targetTurnRate: .22,
    moveTurnRate: .14,
    projectile: { lifeMs: 1120, scale: .74, radius: 7, offsetX: 3, offsetY: 3 },
    muzzleResolver: () => {
      const ang = scene.weaponAim;
      const side = scene.weaponHandSide || 1;
      const anchorX = scene.weaponAnchor.x || scene.hero.x + side * 28;
      const anchorY = scene.weaponAnchor.y || scene.hero.y + 16;
      return new Phaser.Math.Vector2(anchorX + Math.cos(ang) * scene.primaryWeapon.muzzleDistance, anchorY + Math.sin(ang) * scene.primaryWeapon.muzzleDistance);
    },
    fireFeedback: ({ angle, muzzle }) => {
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash').setDepth(31).setRotation(angle).setScale(.52);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .1, duration: 70, onComplete: () => flash.destroy() });
      scene.weaponSprite.x -= Math.cos(angle) * 4;
      scene.weaponSprite.y -= Math.sin(angle) * 4;
      scene.playTone?.(165, .045, 'square', .019, -34);
    }
  });
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

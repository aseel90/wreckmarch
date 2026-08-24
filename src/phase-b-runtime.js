/* WRECKMARCH — Phase B runtime: large world + camera + visible swappable starter weapon */
const WORLD_W = 2200;
const WORLD_H = 2200;
const BASE_HERO_SPEED = 285;
const TAU = Math.PI * 2;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase B');
}

function makeRivetGunTexture(scene) {
  if (scene.textures.exists('weapon-rivet')) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x1b2023).fillRoundedRect(8, 6, 36, 14, 5);
  g.fillStyle(0x5b666a).fillRoundedRect(13, 4, 31, 13, 4);
  g.lineStyle(2, 0x24292b, 1).strokeRoundedRect(13, 4, 31, 13, 4);
  g.fillStyle(0xb86f3d).fillRect(40, 8, 15, 9);
  g.fillStyle(0xd08b48).fillRect(52, 10, 10, 5);
  g.fillStyle(0x2d3336).fillRoundedRect(18, 16, 10, 9, 2);
  g.fillStyle(0x49d3e1).fillCircle(19, 9, 2.3);
  g.fillStyle(0xe0b26f).fillCircle(33, 10, 1.7);
  g.generateTexture('weapon-rivet', 64, 26);
  g.destroy();
}

function clearOldArena(scene) {
  const keep = new Set([
    scene.hero, scene.heroShadow, scene.heroHpBg, scene.heroHpBar,
    scene.titleText, scene.timerText, scene.waveText, scene.scrapText,
    scene.hint, scene.joyBase, scene.joyKnob, scene.cart, scene.cartCore
  ]);
  [...scene.children.list].forEach(obj => {
    if (!obj || keep.has(obj) || !obj.visible) return;
    if ((obj.depth ?? 0) <= 3) obj.destroy();
  });
}

function addWreck(scene, x, y, rot = 0) {
  const c = scene.add.container(x, y).setDepth(3).setRotation(rot);
  const shadow = scene.add.ellipse(0, 16, 128, 28, 0x000000, .22);
  const shell = scene.add.rectangle(0, 0, 112, 42, 0x49392e, 1).setStrokeStyle(3, 0x1d1a18, 1);
  const hood = scene.add.rectangle(42, -8, 42, 24, 0x596165, 1).setStrokeStyle(2, 0x25292b, 1);
  const wheelA = scene.add.circle(-37, 24, 15, 0x141719, 1).setStrokeStyle(3, 0x4d5558, 1);
  const wheelB = scene.add.circle(38, 24, 15, 0x141719, 1).setStrokeStyle(3, 0x4d5558, 1);
  const rust = scene.add.rectangle(-16, -5, 25, 7, 0xa35d34, .8).setRotation(-.18);
  c.add([shadow, shell, hood, wheelA, wheelB, rust]);
  return c;
}

function buildExpandedWasteland(scene) {
  clearOldArena(scene);

  const bg = scene.add.graphics().setDepth(-5);
  bg.fillStyle(0x29231e).fillRect(0, 0, WORLD_W, WORLD_H);

  if (scene.textures.exists('art-wasteland')) {
    const texture = scene.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'art-wasteland')
      .setDepth(-4).setAlpha(.24).setTint(0xe8c49a);
    texture.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  const roads = scene.add.graphics().setDepth(-3);
  roads.fillStyle(0x292e32, .94);
  roads.fillRoundedRect(110, 270, 1980, 340, 96);
  roads.fillRoundedRect(620, 110, 365, 1980, 96);
  roads.lineStyle(4, 0x51493e, .55);
  roads.strokeRoundedRect(110, 270, 1980, 340, 96);
  roads.strokeRoundedRect(620, 110, 365, 1980, 96);

  const terrain = scene.add.graphics().setDepth(-2);
  for (let i = 0; i < 130; i++) {
    const x = Phaser.Math.Between(45, WORLD_W - 45);
    const y = Phaser.Math.Between(45, WORLD_H - 45);
    const w = Phaser.Math.Between(38, 175);
    const h = Phaser.Math.Between(18, 84);
    const c = Phaser.Math.RND.pick([0x3a3027, 0x46382b, 0x252a2d, 0x5a4330, 0x394044]);
    terrain.fillStyle(c, Phaser.Math.FloatBetween(.16, .42)).fillEllipse(x, y, w, h);
  }

  terrain.lineStyle(3, 0x16191b, .3);
  for (let i = 0; i < 58; i++) {
    const x = Phaser.Math.Between(80, WORLD_W - 80);
    const y = Phaser.Math.Between(80, WORLD_H - 80);
    const len = Phaser.Math.Between(38, 100);
    const a = Phaser.Math.FloatBetween(0, TAU);
    terrain.beginPath();
    terrain.moveTo(x, y);
    terrain.lineTo(x + Math.cos(a) * len * .42, y + Math.sin(a) * len * .42);
    terrain.lineTo(x + Math.cos(a + .22) * len, y + Math.sin(a + .22) * len);
    terrain.strokePath();
  }

  for (let i = 0; i < 120; i++) {
    const x = Phaser.Math.Between(35, WORLD_W - 35);
    const y = Phaser.Math.Between(35, WORLD_H - 35);
    const c = Phaser.Math.RND.pick([0x7b5b3e, 0x576064, 0x9a6840, 0x34393b]);
    scene.add.rectangle(x, y, Phaser.Math.Between(5, 20), Phaser.Math.Between(2, 7), c, Phaser.Math.FloatBetween(.25, .58))
      .setDepth(-1).setRotation(Phaser.Math.FloatBetween(0, TAU));
  }

  addWreck(scene, 330, 790, -.18);
  addWreck(scene, 1550, 470, .11);
  addWreck(scene, 1780, 1520, -.28);
  addWreck(scene, 510, 1720, .22);

  if (scene.textures.exists('art-scrap-pile') && scene.textures.exists('art-barrel')) {
    [
      [240,190,'art-scrap-pile',.62,.08],[520,690,'art-barrel',.56,-.12],
      [860,340,'art-scrap-pile',.58,-.08],[1180,760,'art-barrel',.54,.12],
      [1490,260,'art-barrel',.62,-.16],[1830,610,'art-scrap-pile',.64,.1],
      [330,1280,'art-barrel',.56,.18],[740,1510,'art-scrap-pile',.62,-.12],
      [1120,1190,'art-barrel',.5,.08],[1450,1660,'art-scrap-pile',.66,.16],
      [1900,1320,'art-barrel',.58,-.1],[1740,1980,'art-scrap-pile',.62,.06],
      [980,1940,'art-barrel',.54,.15],[260,1980,'art-scrap-pile',.6,-.14]
    ].forEach(([x,y,key,scale,rot]) => scene.add.image(x,y,key).setDepth(3).setScale(scale).setRotation(rot).setAlpha(.76));
  }
}

function pinHud(scene) {
  [scene.titleText, scene.timerText, scene.waveText, scene.scrapText, scene.hint, scene.joyBase, scene.joyKnob]
    .forEach(obj => obj?.setScrollFactor?.(0));

  const top = scene.add.rectangle(270, 52, 540, 105, 0x0b0e13, .84)
    .setDepth(500).setScrollFactor(0);
  top.name = 'phase-b-hud-shade';
}

function installLargeWorld(scene) {
  scene.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
  scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  scene.hero.setPosition(WORLD_W / 2, WORLD_H / 2);
  scene.hero.body?.reset?.(WORLD_W / 2, WORLD_H / 2);
  scene.heroShadow.setPosition(scene.hero.x, scene.hero.y + 50);
  scene.heroHpBg.setPosition(scene.hero.x, scene.hero.y - 64);
  scene.heroHpBar.setPosition(scene.hero.x - 34, scene.hero.y - 64);

  scene.cameras.main.startFollow(scene.hero, true, .105, .105);
  scene.cameras.main.setDeadzone(86, 132);
  scene.cameraLook = new Phaser.Math.Vector2();

  buildExpandedWasteland(scene);
  pinHud(scene);
}

function installMovementTuning(scene) {
  scene.heroSpeed = BASE_HERO_SPEED;
  scene.heroMoveVelocity = new Phaser.Math.Vector2();
  scene.movePower = 0;

  scene.updateMovement = function(time) {
    const delta = Phaser.Math.Clamp(this.game?.loop?.delta || 16.67, 8, 40);
    this.move.set(0, 0);
    this.movePower = 0;

    if (this.joy.active) {
      const raw = new Phaser.Math.Vector2(this.joy.current.x - this.joy.origin.x, this.joy.current.y - this.joy.origin.y);
      const len = raw.length();
      if (len > 8) {
        this.move.copy(raw.normalize());
        const analog = Phaser.Math.Clamp((len - 8) / (this.joy.radius - 8), 0, 1);
        this.movePower = .46 + analog * .54;
      }
    }

    const kb = this.input.keyboard;
    if (kb) {
      const c = kb.createCursorKeys();
      let used = false;
      if (c.left.isDown) { this.move.x -= 1; used = true; }
      if (c.right.isDown) { this.move.x += 1; used = true; }
      if (c.up.isDown) { this.move.y -= 1; used = true; }
      if (c.down.isDown) { this.move.y += 1; used = true; }
      if (used) {
        if (this.move.lengthSq() > 1) this.move.normalize();
        this.movePower = 1;
      }
    }

    const moving = this.move.lengthSq() > .05 && this.movePower > .01;
    const targetX = moving ? this.move.x * this.heroSpeed * this.movePower : 0;
    const targetY = moving ? this.move.y * this.heroSpeed * this.movePower : 0;
    const responseMs = moving ? 72 : 48;
    const blend = 1 - Math.exp(-delta / responseMs);

    this.heroMoveVelocity.x = Phaser.Math.Linear(this.heroMoveVelocity.x, targetX, blend);
    this.heroMoveVelocity.y = Phaser.Math.Linear(this.heroMoveVelocity.y, targetY, blend);

    let vx = this.heroMoveVelocity.x, vy = this.heroMoveVelocity.y;
    if (time < this.heroKnockbackUntil) {
      const strength = Phaser.Math.Clamp((this.heroKnockbackUntil - time) / 140, 0, 1);
      vx += this.heroKnockback.x * strength;
      vy += this.heroKnockback.y * strength;
    }
    this.hero.setVelocity(vx, vy);

    this.hero.rotation = Phaser.Math.Linear(this.hero.rotation, moving ? this.move.x * .075 : 0, .15);
    this.hero.setFlipX(this.move.x < -.12);
    if (moving && this.hero.anims.currentAnim?.key !== 'hero-run') this.hero.play('hero-run', true);
    if (!moving && this.hero.anims.currentAnim?.key !== 'hero-idle') this.hero.play('hero-idle', true);

    const shadowY = this.textures.exists('art-hero-idle-0') ? 50 : 36;
    this.heroShadow.setPosition(this.hero.x, this.hero.y + shadowY).setScale(moving ? 1.12 : 1.04, moving ? .82 : .9);

    const lookX = moving ? -this.move.x * 56 : 0;
    const lookY = moving ? -this.move.y * 82 : 0;
    this.cameraLook.x = Phaser.Math.Linear(this.cameraLook.x, lookX, .075);
    this.cameraLook.y = Phaser.Math.Linear(this.cameraLook.y, lookY, .075);
    this.cameras.main.setFollowOffset(this.cameraLook.x, this.cameraLook.y);

    if (moving && time > this.lastDustAt + 105) {
      this.lastDustAt = time;
      this.spawnDust(this.hero.x - this.move.x * 22, this.hero.y + 36, .65);
    }
  };
}

function installOutsideViewportSpawns(scene) {
  const baseSpawn = scene.spawnEnemy.bind(scene);

  scene.spawnEnemy = function(elite = false) {
    if (this.gameOver) return;
    const before = new Set(this.enemies.getChildren());

    baseSpawn(elite);
    let enemy = null;
    this.enemies.children.iterate(e => {
      if (e?.active && !before.has(e)) enemy = e;
    });
    if (!enemy) return;

    const view = this.cameras.main.worldView;
    let x = this.hero.x, y = this.hero.y;
    for (let tries = 0; tries < 14; tries++) {
      const angle = Phaser.Math.FloatBetween(0, TAU);
      const radius = Phaser.Math.Between(610, 790);
      const cx = Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * radius, 38, WORLD_W - 38);
      const cy = Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * radius, 38, WORLD_H - 38);
      const visible = cx > view.left - 75 && cx < view.right + 75 && cy > view.top - 75 && cy < view.bottom + 75;
      x = cx; y = cy;
      if (!visible) break;
    }
    enemy.setPosition(x, y);
    enemy.body?.reset?.(x, y);
  };

  scene.updateBullets = function(delta) {
    this.bullets.children.iterate(b => {
      if (!b?.active) return;
      b.life -= delta;
      if (b.life <= 0 || b.x < -60 || b.x > WORLD_W + 60 || b.y < -60 || b.y > WORLD_H + 60) b.destroy();
    });
  };
}

function installVisibleStarterWeapon(scene) {
  makeRivetGunTexture(scene);

  scene.primaryWeapon = {
    id: 'scrap-rivet-gun',
    texture: 'weapon-rivet',
    damage: scene.damage,
    fireDelay: scene.fireDelay,
    range: 570,
    projectileSpeed: 760,
    muzzleDistance: 38
  };
  scene.weaponAim = 0;
  scene.weaponSprite?.destroy?.();
  scene.weaponSprite = scene.add.image(scene.hero.x + 18, scene.hero.y + 8, scene.primaryWeapon.texture)
    .setOrigin(.18, .5).setScale(.72).setDepth(24);

  scene.updateWeaponPose = function() {
    const ang = this.weaponAim;
    this.weaponSprite.setPosition(this.hero.x + Math.cos(ang) * 13, this.hero.y + 8 + Math.sin(ang) * 13);
    this.weaponSprite.setRotation(ang);
    this.weaponSprite.setFlipY(Math.cos(ang) < 0);
  };

  scene.getWeaponMuzzle = function() {
    const ang = this.weaponAim;
    return new Phaser.Math.Vector2(
      this.weaponSprite.x + Math.cos(ang) * this.primaryWeapon.muzzleDistance,
      this.weaponSprite.y + Math.sin(ang) * this.primaryWeapon.muzzleDistance
    );
  };

  scene.equipPrimaryWeapon = function(definition) {
    this.primaryWeapon = { ...this.primaryWeapon, ...definition };
    if (definition.texture) this.weaponSprite.setTexture(definition.texture);
    this.damage = this.primaryWeapon.damage;
    this.fireDelay = this.primaryWeapon.fireDelay;
  };

  scene.autoFire = function(time) {
    const target = this.findNearestEnemy(this.hero.x, this.hero.y, this.primaryWeapon.range);

    if (target) {
      const desired = Phaser.Math.Angle.Between(this.hero.x, this.hero.y + 4, target.x, target.y);
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

    const flash = this.add.image(muzzle.x, muzzle.y, 'flash').setDepth(31).setRotation(ang).setScale(.58);
    this.tweens.add({ targets: flash, alpha: 0, scale: .12, duration: 70, onComplete: () => flash.destroy() });

    this.weaponSprite.x -= Math.cos(ang) * 5;
    this.weaponSprite.y -= Math.sin(ang) * 5;
    this.playTone(165, .045, 'square', .019, -34);
  };
}

export async function applyPhaseB() {
  const scene = await getScene();
  installLargeWorld(scene);
  installMovementTuning(scene);
  installOutsideViewportSpawns(scene);
  installVisibleStarterWeapon(scene);

  window.__WM_PHASE_B__ = true;
  document.documentElement.dataset.wreckmarchPhase = 'b';
  window.__WM_LOG__?.('Phase B applied: 2200x2200 world + tuned movement + visible Rivet Gun');
  return true;
}

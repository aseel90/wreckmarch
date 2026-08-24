/* WRECKMARCH — visual slice v1: Scrap Runner + Scrap Rat + Fortress */
const W = 540;
const H = 960;
const TAU = Math.PI * 2;

class WreckmarchScene extends Phaser.Scene {
  constructor() {
    super('Wreckmarch');
    this.runTime = 0;
    this.scrap = 0;
    this.level = 1;
    this.nextUpgrade = 14;
    this.fireDelay = 430;
    this.lastShot = 0;
    this.weaponLevel = 1;
    this.damage = 24;
    this.gameOver = false;
    this.upgrading = false;
    this.enemySerial = 0;
    this.lastDustAt = 0;
    this.lastSmokeAt = 0;
  }

  create() {
    this.createTextures();
    this.createAnimations();
    this.createWorld();
    this.createGroups();
    this.createFortress();
    this.createHero();
    this.createHUD();
    this.createJoystick();
    this.createAudio();
    this.cameras.main.setBackgroundColor('#171d26');
    this.physics.world.setBounds(24, 92, W - 48, H - 155);
    this.spawnEvent = this.time.addEvent({ delay: 680, loop: true, callback: () => this.spawnEnemy() });
    this.waveEvent = this.time.addEvent({ delay: 15000, loop: true, callback: () => this.advanceWave() });
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, undefined, this);
    this.physics.add.overlap(this.hero, this.scraps, this.collectScrap, undefined, this);
    this.physics.add.overlap(this.cartCore, this.enemies, this.enemyTouchesCart, undefined, this);
    this.physics.add.overlap(this.hero, this.enemies, this.enemyTouchesHero, undefined, this);
    this.input.once('pointerdown', () => this.unlockAudio());
    if (window.__WM_LOG__) window.__WM_LOG__('Visual slice v1 ready: Scrap Runner + Rat + Fortress');
    document.body.classList.add('ready');
  }

  makeTexture(key, width, height, painter) {
    const g = this.make.graphics({ add: false });
    g.clear();
    painter(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  drawHero(g, phase = 0) {
    const bob = Math.round(Math.sin(phase * Math.PI / 3) * 2);
    const stride = Math.round(Math.sin(phase * Math.PI / 3) * 7);
    const arm = Math.round(Math.cos(phase * Math.PI / 3) * 5);
    g.fillStyle(0xb84e2f, 1);
    g.fillTriangle(24, 40 + bob, 8 - Math.max(0, stride), 45 + bob, 25, 50 + bob);
    g.fillTriangle(25, 44 + bob, 12 - Math.max(0, stride), 54 + bob, 30, 52 + bob);
    g.fillStyle(0x2d211b, 1);
    g.fillTriangle(35, 13 + bob, 42, 1 + bob, 47, 15 + bob);
    g.fillTriangle(45, 13 + bob, 56, 4 + bob, 55, 20 + bob);
    g.fillTriangle(29, 15 + bob, 30, 3 + bob, 39, 14 + bob);
    g.fillStyle(0x2a2b2b, 1);
    g.fillRoundedRect(31 + stride * 0.45, 70 + bob, 13, 22, 5);
    g.fillRoundedRect(47 - stride * 0.45, 70 + bob, 13, 22, 5);
    g.fillStyle(0x5b3a26, 1);
    g.fillRoundedRect(27 + stride * 0.55, 87 + bob, 20, 10, 4);
    g.fillRoundedRect(43 - stride * 0.55, 87 + bob, 20, 10, 4);
    g.lineStyle(2, 0xc17a40, 0.75);
    g.strokeRoundedRect(27 + stride * 0.55, 87 + bob, 20, 10, 4);
    g.strokeRoundedRect(43 - stride * 0.55, 87 + bob, 20, 10, 4);
    g.fillStyle(0x6f5237, 1);
    g.fillRoundedRect(25, 45 + bob, 42, 38, 10);
    g.fillStyle(0x273038, 1);
    g.fillRoundedRect(34, 47 + bob, 25, 30, 7);
    g.fillStyle(0x2d211b, 1);
    g.fillRect(27, 72 + bob, 39, 7);
    g.fillStyle(0xd08a48, 1);
    g.fillRoundedRect(43, 72 + bob, 9, 7, 2);
    g.fillStyle(0x6f5237, 1);
    g.fillRoundedRect(16 - arm * 0.35, 48 + bob + arm * 0.18, 13, 28, 6);
    g.fillRoundedRect(63 + arm * 0.35, 48 + bob - arm * 0.18, 13, 28, 6);
    g.fillStyle(0x25292d, 1);
    g.fillCircle(21 - arm * 0.35, 75 + bob + arm * 0.18, 6);
    g.fillCircle(69 + arm * 0.35, 75 + bob - arm * 0.18, 6);
    g.fillStyle(0x697178, 1);
    g.fillRoundedRect(59, 45 + bob, 17, 14, 5);
    g.lineStyle(2, 0xca6f3c, 0.9);
    g.strokeRoundedRect(59, 45 + bob, 17, 14, 5);
    g.fillStyle(0x41b5c9, 1);
    g.fillCircle(68, 52 + bob, 2.5);
    g.fillStyle(0xe1aa72, 1);
    g.fillCircle(45, 31 + bob, 18);
    g.fillStyle(0x33231c, 1);
    g.fillTriangle(28, 25 + bob, 32, 11 + bob, 39, 22 + bob);
    g.fillTriangle(35, 20 + bob, 41, 8 + bob, 47, 21 + bob);
    g.fillTriangle(44, 20 + bob, 52, 9 + bob, 56, 24 + bob);
    g.lineStyle(3, 0x2b211d, 1);
    g.beginPath(); g.moveTo(34, 29 + bob); g.lineTo(40, 27 + bob); g.strokePath();
    g.beginPath(); g.moveTo(50, 27 + bob); g.lineTo(57, 29 + bob); g.strokePath();
    g.fillStyle(0x161b1d, 1);
    g.fillCircle(39, 32 + bob, 2.2); g.fillCircle(53, 32 + bob, 2.2);
    g.fillStyle(0x17424b, 1);
    g.fillTriangle(30, 35 + bob, 61, 35 + bob, 46, 51 + bob);
    g.fillStyle(0x22616e, 1);
    g.fillTriangle(34, 37 + bob, 57, 37 + bob, 46, 47 + bob);
    g.fillStyle(0x402e23, 1);
    g.fillRoundedRect(28, 15 + bob, 36, 8, 4);
    g.fillStyle(0x363b3d, 1);
    g.fillCircle(36, 18 + bob, 10); g.fillCircle(56, 18 + bob, 10);
    g.fillStyle(0x55d6e7, 1);
    g.fillCircle(36, 18 + bob, 6.5); g.fillCircle(56, 18 + bob, 6.5);
    g.fillStyle(0xbcecf1, 0.8);
    g.fillCircle(34, 16 + bob, 2); g.fillCircle(54, 16 + bob, 2);
    g.fillStyle(0xb5a67d, 1);
    g.fillRoundedRect(68, 62 + bob, 5, 20, 2);
    g.fillCircle(70.5, 60 + bob, 5);
    g.fillStyle(0x273038, 1); g.fillCircle(70.5, 60 + bob, 2.3);
  }

  drawRat(g, phase = 0) {
    const bob = Math.round(Math.sin(phase * Math.PI / 2) * 2);
    const stride = Math.round(Math.sin(phase * Math.PI / 2) * 4);
    g.lineStyle(5, 0x4a352b, 1);
    g.beginPath(); g.moveTo(18, 34 + bob); g.lineTo(5, 28 + bob - stride); g.lineTo(1, 17 + bob); g.strokePath();
    g.fillStyle(0x3a2922, 1);
    g.fillEllipse(29 + stride, 50 + bob, 17, 7);
    g.fillEllipse(50 - stride, 50 + bob, 17, 7);
    g.fillStyle(0x6e5a45, 1);
    g.fillEllipse(43, 35 + bob, 52, 34);
    g.fillStyle(0x40342d, 1);
    g.fillEllipse(34, 38 + bob, 26, 18);
    g.fillStyle(0x515c61, 1);
    g.fillRoundedRect(27, 24 + bob, 17, 13, 4);
    g.fillRoundedRect(42, 19 + bob, 16, 14, 4);
    g.lineStyle(2, 0xc67539, 0.9);
    g.strokeRoundedRect(27, 24 + bob, 17, 13, 4);
    g.strokeRoundedRect(42, 19 + bob, 16, 14, 4);
    g.fillStyle(0x78634d, 1);
    g.fillEllipse(63, 32 + bob, 31, 27);
    g.fillTriangle(70, 27 + bob, 82, 34 + bob, 69, 38 + bob);
    g.fillStyle(0x5d4638, 1);
    g.fillTriangle(52, 20 + bob, 55, 7 + bob, 64, 21 + bob);
    g.fillTriangle(65, 21 + bob, 73, 10 + bob, 75, 27 + bob);
    g.fillStyle(0xef553f, 1); g.fillCircle(67, 29 + bob, 4);
    g.fillStyle(0xffcf8a, 1); g.fillCircle(68, 28 + bob, 1.3);
    g.fillStyle(0xeee0c8, 1); g.fillTriangle(76, 35 + bob, 80, 37 + bob, 76, 39 + bob);
    g.fillStyle(0xf29b45, 1); g.fillCircle(34, 29 + bob, 2.2); g.fillCircle(50, 24 + bob, 2.2);
  }

  createTextures() {
    for (let i = 0; i < 6; i++) this.makeTexture(`hero-run-${i}`, 92, 104, g => this.drawHero(g, i));
    for (let i = 0; i < 2; i++) this.makeTexture(`hero-idle-${i}`, 92, 104, g => this.drawHero(g, i ? 1 : 0));
    for (let i = 0; i < 4; i++) this.makeTexture(`rat-run-${i}`, 86, 60, g => this.drawRat(g, i));

    this.makeTexture('bullet', 20, 20, g => {
      g.fillStyle(0xffc85e, 1); g.fillCircle(10, 10, 7);
      g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 3);
    });
    this.makeTexture('scrap', 28, 28, g => {
      g.fillStyle(0x5d4a35, 1); g.fillCircle(14, 14, 12);
      g.fillStyle(0xc79553, 1); g.fillRect(11, 3, 6, 22); g.fillRect(3, 11, 22, 6);
      g.fillStyle(0xe8c68d, 1); g.fillCircle(14, 14, 5);
      g.fillStyle(0x5d4a35, 1); g.fillCircle(14, 14, 2.5);
    });
    this.makeTexture('core', 76, 76, g => { g.fillStyle(0xffffff, 1); g.fillCircle(38, 38, 35); });
    this.makeTexture('fortress-shadow', 130, 48, g => { g.fillStyle(0x000000, 0.32); g.fillEllipse(65, 25, 116, 30); });
    this.makeTexture('wheel', 30, 30, g => {
      g.fillStyle(0x12171a, 1); g.fillCircle(15, 15, 14);
      g.lineStyle(3, 0x2c3438, 1); g.strokeCircle(15, 15, 10);
      g.fillStyle(0x7c674c, 1); g.fillCircle(15, 15, 6);
      g.lineStyle(2, 0xc18446, 0.9); g.beginPath(); g.moveTo(15, 9); g.lineTo(15, 21); g.moveTo(9, 15); g.lineTo(21, 15); g.strokePath();
    });
    this.makeTexture('fortress-body', 126, 82, g => {
      g.fillStyle(0x302a24, 1); g.fillRoundedRect(7, 50, 112, 20, 7);
      g.fillStyle(0x69503a, 1); g.fillRoundedRect(12, 31, 102, 31, 8);
      g.lineStyle(3, 0x2c241f, 1); g.strokeRoundedRect(12, 31, 102, 31, 8);
      g.fillStyle(0x8a6946, 1); g.fillRoundedRect(18, 24, 45, 30, 6);
      g.fillStyle(0x5f6a6d, 1); g.fillRoundedRect(67, 22, 37, 32, 5);
      g.fillStyle(0x1d3137, 1); g.fillRoundedRect(73, 27, 23, 13, 3);
      g.fillStyle(0x54d4e7, 0.85); g.fillRoundedRect(76, 29, 17, 8, 2);
      g.fillStyle(0x4c5458, 1); g.fillTriangle(109, 46, 126, 38, 119, 58); g.fillTriangle(109, 53, 126, 48, 117, 66);
      g.fillStyle(0xd18a47, 1); [24, 39, 54, 75, 91, 106].forEach(x => g.fillCircle(x, 57, 2));
      g.fillStyle(0x3d332a, 1); g.fillRect(17, 11, 24, 17);
      g.lineStyle(2, 0xb9834c, 0.8); g.strokeRect(17, 11, 24, 17);
      g.lineStyle(3, 0x352b24, 1); g.beginPath(); g.moveTo(47, 30); g.lineTo(47, 3); g.strokePath();
      g.fillStyle(0xb74332, 1); g.fillTriangle(48, 5, 68, 10, 48, 17);
      g.fillStyle(0x424b4e, 1); g.fillRoundedRect(101, 12, 9, 25, 3);
      g.fillStyle(0x1b2022, 1); g.fillRect(99, 10, 13, 5);
      g.fillStyle(0xffc861, 1); g.fillCircle(111, 42, 4);
    });
    this.makeTexture('turret', 66, 42, g => {
      g.fillStyle(0x2e373b, 1); g.fillCircle(20, 22, 17);
      g.fillStyle(0x697578, 1); g.fillCircle(20, 22, 11);
      g.fillStyle(0x3b4448, 1); g.fillRoundedRect(19, 16, 38, 12, 4);
      g.fillStyle(0xa86a39, 1); g.fillRect(51, 18, 11, 8);
      g.fillStyle(0x1d2325, 1); g.fillRect(60, 19, 6, 6);
      g.fillStyle(0x4fd5e3, 1); g.fillCircle(17, 18, 3);
    });
    this.makeTexture('flash', 28, 18, g => {
      g.fillStyle(0xffd56c, 1); g.fillTriangle(0, 9, 28, 0, 20, 9);
      g.fillStyle(0xff7d34, 1); g.fillTriangle(0, 9, 24, 18, 18, 9);
    });
  }

  createAnimations() {
    this.anims.create({ key: 'hero-run', frames: [0,1,2,3,4,5].map(i => ({ key: `hero-run-${i}` })), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'hero-idle', frames: [0,1].map(i => ({ key: `hero-idle-${i}` })), frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'rat-run', frames: [0,1,2,3].map(i => ({ key: `rat-run-${i}` })), frameRate: 10, repeat: -1 });
  }

  createWorld() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x3a3028, 0x332b25, 0x171d26, 0x171d26, 1);
    bg.fillRect(0, 0, W, H);
    const road = this.add.graphics();
    road.fillStyle(0x2b3037, 1); road.fillRoundedRect(68, 80, W - 136, H - 126, 70);
    road.lineStyle(2, 0x4b443d, 0.8); road.strokeRoundedRect(68, 80, W - 136, H - 126, 70);
    for (let i = 0; i < 52; i++) {
      const x = Phaser.Math.Between(30, W - 30), y = Phaser.Math.Between(105, H - 55);
      const c = Phaser.Math.RND.pick([0x6f5842, 0x4a4f51, 0x8a6b48]);
      this.add.rectangle(x, y, Phaser.Math.Between(3, 12), Phaser.Math.Between(2, 5), c, Phaser.Math.FloatBetween(.15, .38)).setRotation(Phaser.Math.FloatBetween(0, TAU));
    }
    const top = this.add.graphics().setDepth(500);
    top.fillStyle(0x0b0e13, .84); top.fillRect(0, 0, W, 105);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.scraps = this.physics.add.group();
  }

  createFortress() {
    this.cart = this.add.container(W / 2, H * .64).setDepth(15);
    this.cartShadow = this.add.image(0, 20, 'fortress-shadow');
    this.cartBody = this.add.image(0, 0, 'fortress-body');
    this.cartWheels = [
      this.add.image(-43, 29, 'wheel'), this.add.image(-14, 31, 'wheel'),
      this.add.image(22, 31, 'wheel'), this.add.image(48, 29, 'wheel')
    ];
    this.cart.add(this.cartShadow);
    this.cartWheels.forEach(w => this.cart.add(w));
    this.cart.add(this.cartBody);
    this.turrets = [];
    this.addTurret(2, -25);
    this.cartCore = this.physics.add.image(this.cart.x, this.cart.y, 'core').setVisible(false).setCircle(35).setImmovable(true);
    this.cartCore.body.setOffset(3, 3);
    this.cartMaxHp = 220;
    this.cartHp = this.cartMaxHp;
  }

  addTurret(x, y) {
    const turret = this.add.image(x, y, 'turret').setOrigin(.3, .5).setScale(.92);
    this.cart.add(turret);
    this.turrets.push(turret);
    this.weaponLevel = this.turrets.length;
    if (this.cameras?.main) this.cameras.main.flash(90, 240, 180, 88, false);
    this.playTone?.(310, .045, 'square', .025);
  }

  createHero() {
    this.heroShadow = this.add.ellipse(W / 2, H * .78 + 38, 52, 17, 0x000000, .28).setDepth(20);
    this.hero = this.physics.add.sprite(W / 2, H * .78, 'hero-idle-0').setDepth(22).setScale(.78);
    this.hero.play('hero-idle');
    this.hero.setCollideWorldBounds(true);
    this.hero.body.setCircle(22, 24, 46);
    this.heroHp = 100;
    this.heroMaxHp = 100;
    this.heroSpeed = 255;
    this.lastHeroHit = 0;
    this.move = new Phaser.Math.Vector2();
  }

  createHUD() {
    const small = { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#d7dde5', fontStyle: 'bold' };
    this.titleText = this.add.text(28, 20, 'WRECKMARCH', { fontFamily: 'Arial Black, Arial', fontSize: '23px', color: '#f2d19b' }).setDepth(700);
    this.timerText = this.add.text(W - 28, 23, '00:00', small).setOrigin(1, 0).setDepth(700);
    this.hpBg = this.add.rectangle(28, 58, W - 56, 13, 0x0b0f14, .9).setOrigin(0, .5).setDepth(700);
    this.hpBar = this.add.rectangle(28, 58, W - 56, 9, 0xd26a45, 1).setOrigin(0, .5).setDepth(701);
    this.add.text(28, 74, 'FORTRESS', { ...small, fontSize: '12px', color: '#aeb7c2' }).setDepth(700);
    this.scrapText = this.add.text(W - 28, 74, 'SCRAP  0 / 14', { ...small, fontSize: '14px', color: '#e8c68d' }).setOrigin(1, 0).setDepth(700);
    this.waveText = this.add.text(W / 2, 108, 'WAVE 1', { ...small, fontSize: '13px', color: '#8793a0' }).setOrigin(.5).setDepth(700);
    this.hint = this.add.text(W / 2, H - 28, 'DRAG TO MOVE • AUTO FIRE', { ...small, fontSize: '12px', color: '#77818d' }).setOrigin(.5, 1).setDepth(700);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: this.hint, alpha: 0, duration: 700 }));
  }

  createJoystick() {
    this.joy = { id: null, origin: new Phaser.Math.Vector2(), current: new Phaser.Math.Vector2(), radius: 62, active: false };
    this.joyBase = this.add.circle(92, H - 118, 55, 0x111820, .38).setStrokeStyle(2, 0x9ba8b6, .18).setDepth(650);
    this.joyKnob = this.add.circle(92, H - 118, 24, 0xe7c38d, .4).setDepth(651);
    this.input.on('pointerdown', p => {
      if (this.gameOver || this.upgrading || p.y < H * .36) return;
      this.joy.id = p.id; this.joy.active = true; this.joy.origin.set(p.x, p.y); this.joy.current.set(p.x, p.y);
      this.joyBase.setPosition(p.x, p.y).setAlpha(.75); this.joyKnob.setPosition(p.x, p.y).setAlpha(.85);
    });
    this.input.on('pointermove', p => {
      if (!this.joy.active || p.id !== this.joy.id) return;
      this.joy.current.set(p.x, p.y);
      const d = new Phaser.Math.Vector2(p.x - this.joy.origin.x, p.y - this.joy.origin.y);
      if (d.length() > this.joy.radius) d.setLength(this.joy.radius);
      this.joyKnob.setPosition(this.joy.origin.x + d.x, this.joy.origin.y + d.y);
    });
    const release = p => {
      if (p.id !== this.joy.id) return;
      this.joy.active = false; this.joy.id = null;
      this.joyBase.setPosition(92, H - 118).setAlpha(.38); this.joyKnob.setPosition(92, H - 118).setAlpha(.4);
    };
    this.input.on('pointerup', release); this.input.on('pointerupoutside', release);
  }

  createAudio() {
    this.audioCtx = null;
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (this.audioCtx.state === 'running') this.audioCtx.suspend(); } catch (_) {}
  }
  unlockAudio() { if (this.audioCtx?.state === 'suspended') this.audioCtx.resume(); }
  playTone(freq, duration = .05, type = 'sine', volume = .03, slide = 0) {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    const now = this.audioCtx.currentTime, osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(this.audioCtx.destination); osc.start(now); osc.stop(now + duration);
  }

  advanceWave() {
    if (this.gameOver) return;
    const wave = Math.floor(this.runTime / 15) + 1;
    this.waveText.setText(`WAVE ${wave}`);
    this.spawnEvent.delay = Math.max(255, 680 - wave * 82);
    this.showBanner(wave % 2 === 0 ? 'Horde incoming' : 'The road gets meaner');
    for (let i = 0; i < Math.min(8, wave * 2); i++) this.time.delayedCall(i * 85, () => this.spawnEnemy(true));
  }

  spawnEnemy(elite = false) {
    if (this.gameOver || this.upgrading) return;
    const side = Phaser.Math.Between(0, 3); let x, y;
    if (side === 0) { x = Phaser.Math.Between(20, W - 20); y = 105; }
    if (side === 1) { x = W - 20; y = Phaser.Math.Between(130, H - 180); }
    if (side === 2) { x = Phaser.Math.Between(20, W - 20); y = H - 165; }
    if (side === 3) { x = 20; y = Phaser.Math.Between(130, H - 180); }
    const e = this.enemies.create(x, y, 'rat-run-0').setDepth(12).setScale(elite ? 1.08 : .88);
    e.play('rat-run'); e.name = `scraprat-${this.enemySerial++}`; e.setCircle(21, 24, 17);
    e.hp = elite ? 110 + this.runTime * 2.4 : 54 + this.runTime * 1.25; e.maxHp = e.hp;
    e.speed = elite ? Phaser.Math.Between(70, 88) : Phaser.Math.Between(88, 122); e.damage = elite ? 19 : 10; e.elite = elite; e.lastTouch = 0;
    if (elite) e.setTint(0xe69b56);
  }

  update(time, delta) {
    if (this.gameOver || this.upgrading) return;
    const dt = delta / 1000;
    this.runTime += dt;
    this.updateTimer(); this.updateMovement(time); this.updateFortress(dt, time); this.updateEnemies(time);
    this.updateBullets(delta); this.updateScrapMagnet(); this.autoFire(time); this.updateHUD();
  }

  updateMovement(time) {
    this.move.set(0, 0);
    if (this.joy.active) {
      this.move.set(this.joy.current.x - this.joy.origin.x, this.joy.current.y - this.joy.origin.y);
      if (this.move.length() > 8) this.move.normalize(); else this.move.set(0, 0);
    }
    const kb = this.input.keyboard;
    if (kb) {
      const c = kb.createCursorKeys();
      if (c.left.isDown) this.move.x -= 1; if (c.right.isDown) this.move.x += 1;
      if (c.up.isDown) this.move.y -= 1; if (c.down.isDown) this.move.y += 1;
      if (this.move.lengthSq() > 1) this.move.normalize();
    }
    const moving = this.move.lengthSq() > .05;
    this.hero.setVelocity(this.move.x * this.heroSpeed, this.move.y * this.heroSpeed);
    this.hero.rotation = Phaser.Math.Linear(this.hero.rotation, moving ? this.move.x * .09 : 0, .16);
    this.hero.setFlipX(this.move.x < -.12);
    if (moving && this.hero.anims.currentAnim?.key !== 'hero-run') this.hero.play('hero-run', true);
    if (!moving && this.hero.anims.currentAnim?.key !== 'hero-idle') this.hero.play('hero-idle', true);
    this.heroShadow.setPosition(this.hero.x, this.hero.y + 36).setScale(moving ? 1.08 : 1, moving ? .85 : 1);
    if (moving && time > this.lastDustAt + 110) { this.lastDustAt = time; this.spawnDust(this.hero.x - this.move.x * 22, this.hero.y + 36, .65); }
  }

  spawnDust(x, y, scale = 1) {
    const p = this.add.ellipse(x + Phaser.Math.Between(-6, 6), y, 20 * scale, 9 * scale, 0x9a8066, .33).setDepth(9);
    this.tweens.add({ targets: p, x: x - Phaser.Math.Between(6, 20), y: y - Phaser.Math.Between(1, 8), scale: 1.7, alpha: 0, duration: 300, onComplete: () => p.destroy() });
  }

  spawnSmoke(x, y) {
    const p = this.add.circle(x, y, Phaser.Math.Between(5, 9), 0x575a57, .38).setDepth(13);
    this.tweens.add({ targets: p, x: x - Phaser.Math.Between(8, 18), y: y - Phaser.Math.Between(18, 30), scale: 1.8, alpha: 0, duration: 650, onComplete: () => p.destroy() });
  }

  updateFortress(dt, time) {
    const desiredX = Phaser.Math.Clamp(this.hero.x - this.move.x * 82, 72, W - 72);
    const desiredY = Phaser.Math.Clamp(this.hero.y - this.move.y * 82 + 12, 135, H - 190);
    const follow = 1 - Math.pow(.001, dt);
    this.cart.x = Phaser.Math.Linear(this.cart.x, desiredX, follow * .27);
    this.cart.y = Phaser.Math.Linear(this.cart.y, desiredY, follow * .27);
    this.cart.rotation = Phaser.Math.Linear(this.cart.rotation, this.move.x * .025, .08);
    const rolling = Phaser.Math.Clamp(this.move.length(), 0, 1);
    this.cartWheels.forEach((w, i) => { w.rotation += .055 + rolling * .12 * (i % 2 ? 1 : .95); });
    this.cartBody.y = Math.sin(time * .012) * (1 + rolling * 1.2);
    this.cartCore.setPosition(this.cart.x, this.cart.y); this.cartCore.body.updateFromGameObject();
    if (time > this.lastSmokeAt + (rolling ? 180 : 420)) {
      this.lastSmokeAt = time;
      this.spawnSmoke(this.cart.x + 47, this.cart.y - 30);
      if (rolling) this.spawnDust(this.cart.x - 40, this.cart.y + 38, .9);
    }
    const target = this.findNearestEnemy(this.cart.x, this.cart.y, 430);
    if (target) {
      const angle = Phaser.Math.Angle.Between(this.cart.x, this.cart.y - 18, target.x, target.y);
      this.turrets.forEach(t => t.rotation = Phaser.Math.Angle.RotateTo(t.rotation, angle - this.cart.rotation, .14));
    }
  }

  updateEnemies(time) {
    this.enemies.children.iterate(e => {
      if (!e?.active) return;
      const dHero = Phaser.Math.Distance.Between(e.x, e.y, this.hero.x, this.hero.y);
      const tx = dHero < 90 ? this.hero.x : this.cart.x, ty = dHero < 90 ? this.hero.y : this.cart.y;
      const ang = Phaser.Math.Angle.Between(e.x, e.y, tx, ty);
      e.setVelocity(Math.cos(ang) * e.speed, Math.sin(ang) * e.speed);
      e.setFlipX(Math.cos(ang) < 0);
      if (Math.random() < .012) this.spawnDust(e.x, e.y + 22, .38);
    });
  }

  updateBullets(delta) {
    this.bullets.children.iterate(b => {
      if (!b?.active) return;
      b.life -= delta;
      if (b.life <= 0 || b.x < -30 || b.x > W + 30 || b.y < 80 || b.y > H + 30) b.destroy();
    });
  }

  updateScrapMagnet() {
    this.scraps.children.iterate(s => {
      if (!s?.active) return;
      const d = Phaser.Math.Distance.Between(s.x, s.y, this.hero.x, this.hero.y);
      if (d < 135) {
        const strength = Phaser.Math.Clamp((142 - d) / 142, .08, 1), ang = Phaser.Math.Angle.Between(s.x, s.y, this.hero.x, this.hero.y);
        s.setVelocity(Math.cos(ang) * (140 + strength * 350), Math.sin(ang) * (140 + strength * 350));
      } else { s.setVelocity(s.body.velocity.x * .9, s.body.velocity.y * .9); }
      s.rotation += .045;
    });
  }

  autoFire(time) {
    if (time < this.lastShot + this.fireDelay) return;
    const target = this.findNearestEnemy(this.cart.x, this.cart.y, 430); if (!target) return;
    this.lastShot = time;
    const shots = Math.min(this.turrets.length, 3);
    for (let i = 0; i < shots; i++) {
      const spread = (i - (shots - 1) / 2) * .09;
      const ang = Phaser.Math.Angle.Between(this.cart.x, this.cart.y - 18, target.x, target.y) + spread;
      const sx = this.cart.x + Math.cos(ang) * 42, sy = this.cart.y - 25 + Math.sin(ang) * 42;
      const b = this.bullets.create(sx, sy, 'bullet').setDepth(18).setScale(.82);
      b.setCircle(7, 3, 3); b.damage = this.damage; b.life = 1000; b.setVelocity(Math.cos(ang) * 640, Math.sin(ang) * 640);
      const flash = this.add.image(sx, sy, 'flash').setDepth(19).setRotation(ang).setScale(.72);
      this.tweens.add({ targets: flash, alpha: 0, scale: .15, duration: 75, onComplete: () => flash.destroy() });
    }
    this.turrets.forEach(t => {
      const ox = t.x, oy = t.y;
      this.tweens.killTweensOf(t);
      this.tweens.add({ targets: t, x: ox - Math.cos(t.rotation) * 5, y: oy - Math.sin(t.rotation) * 5, duration: 45, yoyo: true, ease: 'Quad.Out' });
    });
    this.cartBody.x = -2; this.time.delayedCall(60, () => { if (this.cartBody) this.cartBody.x = 0; });
    this.playTone(145, .045, 'square', .022, -35);
  }

  findNearestEnemy(x, y, maxD = Infinity) {
    let best = null, bestSq = maxD * maxD;
    this.enemies.children.iterate(e => { if (!e?.active) return; const d = Phaser.Math.Distance.Squared(x, y, e.x, e.y); if (d < bestSq) { best = e; bestSq = d; } });
    return best;
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    const vx = bullet.body.velocity.x, vy = bullet.body.velocity.y;
    bullet.destroy(); enemy.hp -= bullet.damage ?? this.damage;
    enemy.setTintFill(0xffffff); this.time.delayedCall(55, () => enemy?.active && enemy.clearTint());
    enemy.body.velocity.x += vx * .05; enemy.body.velocity.y += vy * .05;
    this.spawnHitFx(enemy.x, enemy.y, vx, vy); this.playTone(78, .025, 'square', .013, 35);
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  spawnHitFx(x, y, vx, vy) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 4), i === 0 ? 0x61d9e6 : 0xf1c675, .9).setDepth(30);
      const a = Math.atan2(vy, vx) + Math.PI + Phaser.Math.FloatBetween(-.8, .8), dist = Phaser.Math.Between(16, 36);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, alpha: 0, scale: .2, duration: 170, onComplete: () => p.destroy() });
    }
  }

  killEnemy(enemy) {
    const x = enemy.x, y = enemy.y, elite = enemy.elite;
    enemy.body.enable = false; enemy.setVelocity(0, 0); enemy.anims.stop();
    this.cameras.main.shake(elite ? 90 : 40, elite ? .0045 : .0015);
    this.playTone(elite ? 52 : 64, elite ? .11 : .06, 'sawtooth', .025, -18);
    this.tweens.add({ targets: enemy, angle: enemy.flipX ? -28 : 28, y: y + 12, scaleX: enemy.scaleX * 1.15, scaleY: enemy.scaleY * .55, alpha: .35, duration: 180, onComplete: () => enemy.destroy() });
    const burst = this.add.circle(x, y, elite ? 28 : 18, 0xd8954f, .55).setDepth(13);
    this.tweens.add({ targets: burst, scale: 2.4, alpha: 0, duration: 180, onComplete: () => burst.destroy() });
    for (let i = 0; i < (elite ? 3 : 1); i++) {
      const s = this.scraps.create(x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-12, 12), 'scrap').setDepth(10);
      s.setScale(elite ? .95 : .78); s.setCircle(11, 3, 3); s.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-90, 90)); s.setBounce(.4);
    }
  }

  collectScrap(hero, scrap) {
    if (!scrap.active) return;
    scrap.disableBody(true, true); this.scrap += 1;
    this.playTone(620 + Math.min(this.scrap % 6, 5) * 55, .035, 'sine', .018, 80);
    this.tweens.add({ targets: this.scrapText, scale: 1.12, duration: 70, yoyo: true });
    const glow = this.add.circle(this.hero.x, this.hero.y, 18, 0x55d9e6, .35).setDepth(21);
    this.tweens.add({ targets: glow, scale: 2.1, alpha: 0, duration: 180, onComplete: () => glow.destroy() });
    if (this.scrap >= this.nextUpgrade) {
      this.level += 1; this.scrap -= this.nextUpgrade; this.nextUpgrade = Math.round(this.nextUpgrade * 1.34 + 3);
      this.time.delayedCall(110, () => this.showUpgrade());
    }
  }

  enemyTouchesCart(cart, enemy) {
    const now = this.time.now;
    if (!enemy.active || now < (enemy.lastDamageToCart || 0) + 520) return;
    enemy.lastDamageToCart = now; this.cartHp -= enemy.damage;
    this.cart.setAlpha(.6); this.time.delayedCall(70, () => this.cart?.setAlpha(1));
    this.cameras.main.shake(65, .0035); this.playTone(90, .06, 'sawtooth', .025, -25);
    if (this.cartHp <= 0) this.endRun('FORTRESS LOST');
  }

  enemyTouchesHero(hero, enemy) {
    const now = this.time.now;
    if (!enemy.active || now < this.lastHeroHit + 520) return;
    this.lastHeroHit = now; this.heroHp -= enemy.damage * .55;
    this.hero.setTintFill(0xffffff); this.time.delayedCall(80, () => this.hero?.active && this.hero.clearTint());
    this.cameras.main.shake(45, .0025); this.playTone(110, .045, 'square', .018, -40);
    if (this.heroHp <= 0) this.endRun('RUNNER DOWN');
  }

  showUpgrade() {
    if (this.upgrading || this.gameOver) return;
    this.upgrading = true; this.physics.pause(); this.spawnEvent.paused = true;
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x090d12, .86).setDepth(1000);
    const title = this.add.text(W / 2, 180, 'FORTRESS UPGRADE', { fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#f0cc91' }).setOrigin(.5).setDepth(1001);
    const sub = this.add.text(W / 2, 220, 'Choose what the scrap becomes', { fontFamily: 'Arial', fontSize: '15px', color: '#9ca8b5' }).setOrigin(.5).setDepth(1001);
    const options = [
      { title: 'TWIN CANNON', icon: 'II', desc: 'Bolt another gun onto the rig.', apply: () => { const x = this.turrets.length % 2 ? -25 : 25, y = -25 - Math.floor(this.turrets.length / 2) * 8; this.addTurret(x, y); } },
      { title: 'HOT CHAMBER', icon: '>>', desc: 'Fire 22% faster. More noise. More scrap.', apply: () => { this.fireDelay = Math.max(175, this.fireDelay * .78); } },
      { title: 'HEAVY SLUGS', icon: '+', desc: 'Shots hit 40% harder and kick deeper.', apply: () => { this.damage *= 1.4; } }
    ];
    const cards = [];
    options.forEach((opt, i) => {
      const y = 330 + i * 155, card = this.add.container(W / 2, y).setDepth(1002);
      const bg = this.add.rectangle(0, 0, W - 76, 126, 0x1c242d, .98).setStrokeStyle(2, 0x6f7a86, .36);
      const badge = this.add.circle(-178, 0, 31, 0xb87945, 1), icon = this.add.text(-178, -1, opt.icon, { fontFamily: 'Arial Black', fontSize: '22px', color: '#171d26' }).setOrigin(.5);
      const t = this.add.text(-128, -25, opt.title, { fontFamily: 'Arial Black', fontSize: '19px', color: '#f2d19b' }).setOrigin(0, .5);
      const d = this.add.text(-128, 18, opt.desc, { fontFamily: 'Arial', fontSize: '14px', color: '#aeb8c3', wordWrap: { width: 280 } }).setOrigin(0, .5);
      card.add([bg, badge, icon, t, d]); bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => card.setScale(1.025)); bg.on('pointerout', () => card.setScale(1));
      bg.on('pointerdown', () => {
        opt.apply(); this.playTone(240, .07, 'square', .025, 450); this.cameras.main.flash(160, 226, 174, 96, false);
        [shade, title, sub, ...cards].forEach(o => o.destroy()); this.physics.resume(); this.spawnEvent.paused = false; this.upgrading = false; this.showBanner(opt.title);
      }); cards.push(card);
    });
  }

  showBanner(text) {
    const t = this.add.text(W / 2, 142, text.toUpperCase(), { fontFamily: 'Arial Black', fontSize: '16px', color: '#f0cc91', backgroundColor: '#111820cc', padding: { x: 16, y: 8 } }).setOrigin(.5).setDepth(850).setAlpha(0).setY(132);
    this.tweens.add({ targets: t, alpha: 1, y: 142, duration: 180, hold: 800, yoyo: true, onComplete: () => t.destroy() });
  }
  updateTimer() { const sec = Math.floor(this.runTime), m = String(Math.floor(sec / 60)).padStart(2, '0'), s = String(sec % 60).padStart(2, '0'); this.timerText.setText(`${m}:${s}`); }
  updateHUD() { const hp = Phaser.Math.Clamp(this.cartHp / this.cartMaxHp, 0, 1); this.hpBar.width = (W - 56) * hp; this.scrapText.setText(`SCRAP  ${this.scrap} / ${this.nextUpgrade}`); }

  endRun(reason) {
    if (this.gameOver) return;
    this.gameOver = true; this.physics.pause(); this.spawnEvent.paused = true;
    this.cameras.main.shake(260, .008); this.playTone(90, .35, 'sawtooth', .04, -55);
    this.add.rectangle(W / 2, H / 2, W, H, 0x090d12, .88).setDepth(2000);
    this.add.text(W / 2, H * .38, reason, { fontFamily: 'Arial Black', fontSize: '32px', color: '#d56a49' }).setOrigin(.5).setDepth(2001);
    this.add.text(W / 2, H * .45, `SURVIVED ${Math.floor(this.runTime)}s  •  FORTRESS LV.${this.level}`, { fontFamily: 'Arial', fontSize: '16px', color: '#c0c8d1' }).setOrigin(.5).setDepth(2001);
    const btn = this.add.rectangle(W / 2, H * .56, 260, 64, 0xb97945, 1).setDepth(2001).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * .56, 'RUN AGAIN', { fontFamily: 'Arial Black', fontSize: '20px', color: '#171d26' }).setOrigin(.5).setDepth(2002);
    btn.on('pointerdown', () => this.scene.restart());
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#171d26',
  render: { antialias: true, pixelArt: false, roundPixels: false },
  physics: { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  input: { activePointers: 3 },
  scene: [WreckmarchScene]
};
new Phaser.Game(config);

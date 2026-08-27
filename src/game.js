import { InputManager } from './input/input-manager.js?v=1';

/* WRECKMARCH — Phase A: hero-owned combat core */
const W = 540;
const H = 960;
const TAU = Math.PI * 2;

class WreckmarchScene extends Phaser.Scene {
  constructor() {
    super('Wreckmarch');
    this.runTime = 0;
    this.scrap = 0;
    this.fireDelay = 390;
    this.lastShot = 0;
    this.damage = 24;
    this.heroMaxHp = 100;
    this.heroHp = 100;
    this.heroInvulnMs = 450;
    this.lastHeroHit = -99999;
    this.heroKnockbackUntil = 0;
    this.enemySerial = 0;
    this.gameOver = false;
    this.lastDustAt = 0;
  }

  create() {
    this.createTextures();
    this.createAnimations();
    this.createWorld();
    this.createGroups();
    this.createHero();
    this.createArtCompatibility();
    this.createHUD();
    this.createJoystick();
    this.inputManager = new InputManager({ keyboard: this.input.keyboard, joystick: this.joy });
    this.createAudio();

    this.physics.world.setBounds(24, 105, W - 48, H - 158);
    this.spawnEvent = this.time.addEvent({ delay: 690, loop: true, callback: () => this.spawnEnemy() });
    this.waveEvent = this.time.addEvent({ delay: 15000, loop: true, callback: () => this.advanceWave() });

    this.physics.add.overlap(this.hero, this.scraps, this.collectScrap, undefined, this);

    this.input.once('pointerdown', () => this.unlockAudio());
    window.__WM_LOG__?.('Phase A ready: hero-only combat core');
    document.body.classList.add('ready');
  }

  makeTexture(key, width, height, painter) {
    const g = this.make.graphics({ add: false });
    painter(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  createTextures() {
    // Lightweight fallbacks shown only until the production SVG art pack is applied.
    for (let i = 0; i < 2; i++) {
      this.makeTexture(`hero-idle-${i}`, 92, 104, g => {
        const bob = i ? 1 : 0;
        g.fillStyle(0xb74d31).fillTriangle(20, 46 + bob, 4, 56 + bob, 26, 61 + bob);
        g.fillStyle(0x7f5d3e).fillRoundedRect(24, 43 + bob, 45, 42, 10);
        g.fillStyle(0x153f49).fillTriangle(28, 37 + bob, 65, 37 + bob, 47, 55 + bob);
        g.fillStyle(0xe0a673).fillCircle(47, 29 + bob, 20);
        g.fillStyle(0x34241d).fillTriangle(28, 27 + bob, 39, 6 + bob, 45, 25 + bob);
        g.fillTriangle(43, 22 + bob, 58, 4 + bob, 64, 29 + bob);
        g.fillStyle(0x2f3437).fillCircle(38, 18 + bob, 10).fillCircle(58, 18 + bob, 10);
        g.fillStyle(0x55d7e7).fillCircle(38, 18 + bob, 6).fillCircle(58, 18 + bob, 6);
        g.fillStyle(0x2b2d2f).fillRoundedRect(29, 76 + bob, 14, 23, 5).fillRoundedRect(52, 76 + bob, 14, 23, 5);
      });
    }
    for (let i = 0; i < 2; i++) {
      this.makeTexture(`hero-run-${i}`, 92, 104, g => {
        const s = i ? 6 : -6;
        g.fillStyle(0xb74d31).fillTriangle(20, 46, 2, 51 - s / 2, 28, 61);
        g.fillStyle(0x7f5d3e).fillRoundedRect(24, 43, 45, 42, 10);
        g.fillStyle(0x153f49).fillTriangle(28, 37, 65, 37, 47, 55);
        g.fillStyle(0xe0a673).fillCircle(47, 29, 20);
        g.fillStyle(0x34241d).fillTriangle(28, 27, 39, 6, 45, 25).fillTriangle(43, 22, 58, 4, 64, 29);
        g.fillStyle(0x2f3437).fillCircle(38, 18, 10).fillCircle(58, 18, 10);
        g.fillStyle(0x55d7e7).fillCircle(38, 18, 6).fillCircle(58, 18, 6);
        g.fillStyle(0x2b2d2f).fillRoundedRect(29 + s * .35, 76, 14, 23, 5).fillRoundedRect(52 - s * .35, 76, 14, 23, 5);
      });
    }
    for (let i = 0; i < 2; i++) {
      this.makeTexture(`rat-run-${i}`, 86, 60, g => {
        const s = i ? 4 : -4;
        g.lineStyle(5, 0x4a352b).beginPath().moveTo(18, 34).lineTo(3, 25 - s).lineTo(2, 12).strokePath();
        g.fillStyle(0x715844).fillEllipse(43, 35, 55, 34);
        g.fillStyle(0x4c5559).fillRoundedRect(28, 22, 27, 18, 4);
        g.fillStyle(0x81634b).fillEllipse(67, 32, 30, 27);
        g.fillStyle(0xef5541).fillCircle(69, 29, 4);
        g.fillStyle(0x32251f).fillEllipse(31 + s, 51, 18, 7).fillEllipse(54 - s, 51, 18, 7);
      });
    }
    this.makeTexture('bullet', 20, 20, g => {
      g.fillStyle(0xffca62).fillCircle(10, 10, 7);
      g.fillStyle(0xffffff).fillCircle(8, 8, 3);
    });
    this.makeTexture('scrap', 28, 28, g => {
      g.fillStyle(0x5d4a35).fillCircle(14, 14, 12);
      g.fillStyle(0xc79553).fillRect(11, 3, 6, 22).fillRect(3, 11, 22, 6);
      g.fillStyle(0xe8c68d).fillCircle(14, 14, 5);
      g.fillStyle(0x5d4a35).fillCircle(14, 14, 2.5);
    });
    this.makeTexture('flash', 28, 18, g => {
      g.fillStyle(0xffd56c).fillTriangle(0, 9, 28, 0, 20, 9);
      g.fillStyle(0xff7d34).fillTriangle(0, 9, 24, 18, 18, 9);
    });
    this.makeTexture('art-compat', 2, 2, g => g.fillStyle(0xffffff, 0).fillRect(0, 0, 2, 2));
  }

  createAnimations() {
    this.anims.create({ key: 'hero-idle', frames: [{ key: 'hero-idle-0' }, { key: 'hero-idle-1' }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'hero-run', frames: [{ key: 'hero-run-0' }, { key: 'hero-run-1' }], frameRate: 9, repeat: -1 });
    this.anims.create({ key: 'rat-run', frames: [{ key: 'rat-run-0' }, { key: 'rat-run-1' }], frameRate: 10, repeat: -1 });
  }

  createWorld() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x3a3028, 0x332b25, 0x171d26, 0x171d26, 1).fillRect(0, 0, W, H);
    const road = this.add.graphics();
    road.fillStyle(0x2b3037).fillRoundedRect(68, 80, W - 136, H - 126, 70);
    road.lineStyle(2, 0x4b443d, .8).strokeRoundedRect(68, 80, W - 136, H - 126, 70);
    for (let i = 0; i < 52; i++) {
      const x = Phaser.Math.Between(30, W - 30), y = Phaser.Math.Between(105, H - 55);
      const c = Phaser.Math.RND.pick([0x6f5842, 0x4a4f51, 0x8a6b48]);
      this.add.rectangle(x, y, Phaser.Math.Between(3, 12), Phaser.Math.Between(2, 5), c, Phaser.Math.FloatBetween(.15, .38)).setRotation(Phaser.Math.FloatBetween(0, TAU));
    }
    this.add.rectangle(W / 2, 52, W, 105, 0x0b0e13, .84).setDepth(500);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.scraps = this.physics.add.group();
  }

  createHero() {
    this.heroShadow = this.add.ellipse(W / 2, H * .76 + 38, 52, 17, 0x000000, .28).setDepth(20);
    this.hero = this.physics.add.sprite(W / 2, H * .76, 'hero-idle-0').setDepth(22).setScale(.78);
    this.hero.play('hero-idle');
    this.hero.setCollideWorldBounds(true);
    this.hero.body.setCircle(22, 24, 46);
    this.heroSpeed = 255;
    this.heroKnockback = new Phaser.Math.Vector2();
    this.move = new Phaser.Math.Vector2();

    this.heroHpWidth = 68;
    this.heroHpBg = this.add.rectangle(this.hero.x, this.hero.y - 64, 72, 10, 0x0b0f14, .86).setDepth(60).setStrokeStyle(1, 0xffffff, .14);
    this.heroHpBar = this.add.rectangle(this.hero.x - 34, this.hero.y - 64, 68, 6, 0x55d66f).setOrigin(0, .5).setDepth(61);
  }

  createArtCompatibility() {
    // Hidden scaffold used only so the current production art loader can initialize.
    // It has no collision, no HP, no attack logic, and is never rendered in Phase A.
    this.cart = this.add.container(-5000, -5000).setVisible(false).setActive(false);
    this.cartShadow = this.add.image(0, 0, 'art-compat');
    this.cartBody = this.add.image(0, 0, 'art-compat');
    this.cartWheels = [0, 1, 2, 3].map(() => this.add.image(0, 0, 'art-compat'));
    this.turrets = [this.add.image(0, 0, 'art-compat')];
    this.cart.add([this.cartShadow, ...this.cartWheels, this.cartBody, ...this.turrets]);
    this.cartCore = this.physics.add.image(-5000, -5000, 'art-compat').setVisible(false).setActive(false);
  }

  createHUD() {
    const small = { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#d7dde5', fontStyle: 'bold' };
    this.titleText = this.add.text(28, 20, 'WRECKMARCH', { fontFamily: 'Arial Black, Arial', fontSize: '23px', color: '#f2d19b' }).setDepth(700);
    this.timerText = this.add.text(W - 28, 23, '00:00', small).setOrigin(1, 0).setDepth(700);
    this.waveText = this.add.text(W / 2, 74, 'WAVE 1', { ...small, fontSize: '13px', color: '#8793a0' }).setOrigin(.5).setDepth(700);
    this.scrapText = this.add.text(W - 28, 70, 'SCRAP  0', { ...small, fontSize: '14px', color: '#e8c68d' }).setOrigin(1, 0).setDepth(700);
    this.hint = this.add.text(W / 2, H - 28, 'DRAG TO MOVE • HERO AUTO-FIRES', { ...small, fontSize: '12px', color: '#77818d' }).setOrigin(.5, 1).setDepth(700);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: this.hint, alpha: 0, duration: 700 }));
  }

  createJoystick() {
    this.joy = { id: null, origin: new Phaser.Math.Vector2(), current: new Phaser.Math.Vector2(), radius: 62, active: false };
    this.joyBase = this.add.circle(92, H - 118, 55, 0x111820, .38).setStrokeStyle(2, 0x9ba8b6, .18).setDepth(650);
    this.joyKnob = this.add.circle(92, H - 118, 24, 0xe7c38d, .4).setDepth(651);
    this.input.on('pointerdown', p => {
      if (this.gameOver || p.y < H * .36) return;
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
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === 'running') this.audioCtx.suspend();
    } catch (_) {}
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
    const wave = 1 + Math.floor(this.runTime / 15);
    this.waveText.setText(`WAVE ${wave}`);
    this.showBanner(`Wave ${wave}`);
    this.spawnEvent.delay = Math.max(330, 690 - wave * 24);
  }

  spawnEnemy(elite = false) {
    const side = Phaser.Math.Between(0, 3);
    const margin = 34;
    let x, y;
    if (side === 0) { x = margin; y = Phaser.Math.Between(130, H - 85); }
    else if (side === 1) { x = W - margin; y = Phaser.Math.Between(130, H - 85); }
    else if (side === 2) { x = Phaser.Math.Between(50, W - 50); y = 120; }
    else { x = Phaser.Math.Between(50, W - 50); y = H - 70; }

    const e = this.enemies.create(x, y, 'rat-run-0').setDepth(18).setScale(elite ? 1.05 : .86);
    e.play('rat-run'); e.setTint(elite ? 0xd99658 : 0xffffff); e.elite = elite;
    e.hp = elite ? 110 : 54; e.maxHp = e.hp; e.speed = elite ? 120 : Phaser.Math.Between(92, 114);
    e.damage = elite ? 18 : 10; e.scrapDrop = elite ? 4 : 1; e.enemyId = `rat-${this.enemySerial++}`;
    e.body.setCircle(20, 23, 18);
    e.hpBg = this.add.rectangle(x, y - 37, 43, 6, 0x0b0f14, .75).setDepth(27);
    e.hpBar = this.add.rectangle(x - 20, y - 37, 40, 4, elite ? 0xef9c54 : 0xc74b40).setOrigin(0, .5).setDepth(28);
    this.tweens.add({ targets: e, alpha: { from: 0, to: 1 }, scale: { from: e.scale * .7, to: e.scale }, duration: 150 });
    return e;
  }

  update(time, delta) {
    if (this.gameOver) return;
    const dt = Math.min(delta / 1000, .034); this.runTime += dt;
    this.updateMovement(time, dt); this.updateEnemies(dt); this.updateBullets(time); this.updateScrapMagnet(); this.updateHUD(); this.updateTimer();
    if (this.runTime > 55 && !this.__eliteSpawned) { this.__eliteSpawned = true; this.spawnEnemy(true); this.showBanner('ELITE INBOUND'); }
  }

  updateMovement(_time, dt) {
    const input = this.inputManager?.read?.() || { x: 0, y: 0, active: false };
    this.move.set(input.x, input.y);
    if (this.move.lengthSq() > 1) this.move.normalize();

    if (performance.now() < this.heroKnockbackUntil) {
      this.hero.setVelocity(this.heroKnockback.x, this.heroKnockback.y);
      this.heroKnockback.scale(Math.pow(.05, dt * 4));
    } else this.hero.setVelocity(this.move.x * this.heroSpeed, this.move.y * this.heroSpeed);

    const moving = this.move.lengthSq() > .05;
    if (moving && this.hero.anims.currentAnim?.key !== 'hero-run') this.hero.play('hero-run', true);
    if (!moving && this.hero.anims.currentAnim?.key !== 'hero-idle') this.hero.play('hero-idle', true);
    if (Math.abs(this.move.x) > .08) this.hero.setFlipX(this.move.x < 0);
    this.heroShadow.setPosition(this.hero.x, this.hero.y + 38);
  }

  updateEnemies() {
    this.enemies.children.iterate(e => {
      if (!e?.active) return;
      const a = Phaser.Math.Angle.Between(e.x, e.y, this.hero.x, this.hero.y);
      e.setVelocity(Math.cos(a) * e.speed, Math.sin(a) * e.speed);
      e.setFlipX(Math.cos(a) < 0);
      e.hpBg?.setPosition(e.x, e.y - (e.elite ? 45 : 37)); e.hpBar?.setPosition(e.x - 20, e.y - (e.elite ? 45 : 37));
      const d = Phaser.Math.Distance.Between(e.x, e.y, this.hero.x, this.hero.y);
      if (d < (e.elite ? 44 : 37) && performance.now() - this.lastHeroHit > this.heroInvulnMs) this.hitHero(e.damage, e);
    });
  }

  updateBullets(time) {
    if (time - this.lastShot > this.fireDelay) {
      const alive = this.enemies.getChildren().filter(e => e.active);
      if (alive.length) {
        alive.sort((a, b) => Phaser.Math.Distance.Squared(a.x, a.y, this.hero.x, this.hero.y) - Phaser.Math.Distance.Squared(b.x, b.y, this.hero.x, this.hero.y));
        const target = alive[0], ang = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, target.x, target.y);
        this.fireBullet(this.hero.x + Math.cos(ang) * 29, this.hero.y + Math.sin(ang) * 29, ang, target);
        this.lastShot = time;
      }
    }
    this.bullets.children.iterate(b => {
      if (!b?.active) return;
      if (b.x < -30 || b.x > W + 30 || b.y < 70 || b.y > H + 30) b.destroy();
    });
  }

  fireBullet(x, y, angle) {
    const b = this.bullets.create(x, y, 'bullet').setDepth(25);
    b.setVelocity(Math.cos(angle) * 570, Math.sin(angle) * 570); b.damage = this.damage; b.birth = performance.now(); b.setScale(.65);
    const flash = this.add.image(x, y, 'flash').setDepth(24).setRotation(angle).setScale(.7);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.4, duration: 70, onComplete: () => flash.destroy() });
    this.playTone(190, .045, 'square', .018, 120);
    this.physics.add.overlap(b, this.enemies, (bullet, enemy) => this.hitEnemy(bullet, enemy), undefined, this);
  }

  hitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy(); enemy.hp -= bullet.damage;
    enemy.hpBar.width = 40 * Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
    this.spawnHitFx(enemy.x, enemy.y, enemy.body.velocity.x, enemy.body.velocity.y);
    this.tweens.add({ targets: enemy, scaleX: enemy.scaleX * 1.08, scaleY: enemy.scaleY * .9, duration: 45, yoyo: true });
    this.cameras.main.shake(55, .0012);
    this.playTone(260, .035, 'triangle', .014, -80);
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    const x = enemy.x, y = enemy.y, drop = enemy.scrapDrop;
    enemy.hpBg?.destroy(); enemy.hpBar?.destroy(); enemy.destroy();
    for (let i = 0; i < drop; i++) {
      const s = this.scraps.create(x + Phaser.Math.Between(-9, 9), y + Phaser.Math.Between(-9, 9), 'scrap').setDepth(15).setScale(.6);
      s.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-90, 90));
    }
  }

  hitHero(damage, enemy) {
    if (performance.now() - this.lastHeroHit < this.heroInvulnMs) return;
    this.lastHeroHit = performance.now(); this.heroHp -= damage;
    const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.hero.x, this.hero.y);
    this.heroKnockback.set(Math.cos(a) * 260, Math.sin(a) * 260); this.heroKnockbackUntil = performance.now() + 130;
    this.cameras.main.shake(100, .004); this.hero.setTint(0xff7c6d);
    this.time.delayedCall(90, () => this.hero?.clearTint()); this.playTone(110, .08, 'sawtooth', .03, -40);
    if (this.heroHp <= 0) this.endRun('WRECKED');
  }

  updateScrapMagnet() {
    this.scraps.children.iterate(s => {
      if (!s?.active) return;
      const d = Phaser.Math.Distance.Between(s.x, s.y, this.hero.x, this.hero.y);
      if (d < 135) {
        const strength = Phaser.Math.Clamp((142 - d) / 142, .08, 1);
        const ang = Phaser.Math.Angle.Between(s.x, s.y, this.hero.x, this.hero.y);
        s.setVelocity(Math.cos(ang) * (140 + strength * 350), Math.sin(ang) * (140 + strength * 350));
      } else s.setVelocity(s.body.velocity.x * .9, s.body.velocity.y * .9);
      s.rotation += .045;
    });
  }

  spawnHitFx(x, y, vx, vy) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 4), i === 0 ? 0x61d9e6 : 0xf1c675, .9).setDepth(30);
      const a = Math.atan2(vy, vx) + Math.PI + Phaser.Math.FloatBetween(-.8, .8), dist = Phaser.Math.Between(16, 36);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, alpha: 0, scale: .2, duration: 170, onComplete: () => p.destroy() });
    }
  }

  collectScrap(hero, scrap) {
    if (!scrap.active) return;
    scrap.disableBody(true, true); this.scrap += 1;
    this.playTone(620 + Math.min(this.scrap % 6, 5) * 55, .035, 'sine', .018, 80);
    this.tweens.add({ targets: this.scrapText, scale: 1.12, duration: 70, yoyo: true });
    const glow = this.add.circle(this.hero.x, this.hero.y, 18, 0x55d9e6, .35).setDepth(21);
    this.tweens.add({ targets: glow, scale: 2.1, alpha: 0, duration: 180, onComplete: () => glow.destroy() });
  }

  updateHUD() {
    const hp = Phaser.Math.Clamp(this.heroHp / this.heroMaxHp, 0, 1);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y - 64);
    this.heroHpBar.setPosition(this.hero.x - this.heroHpWidth / 2, this.hero.y - 64);
    this.heroHpBar.width = this.heroHpWidth * hp;
    this.heroHpBar.setFillStyle(hp > .55 ? 0x55d66f : hp > .25 ? 0xf0b84b : 0xe9574f, 1);
    const hpAlpha = hp >= .999 ? .32 : .96;
    this.heroHpBg.setAlpha(hpAlpha); this.heroHpBar.setAlpha(hpAlpha);
    this.scrapText.setText(`SCRAP  ${this.scrap}`);
  }

  updateTimer() {
    const sec = Math.floor(this.runTime), m = String(Math.floor(sec / 60)).padStart(2, '0'), s = String(sec % 60).padStart(2, '0');
    this.timerText.setText(`${m}:${s}`);
  }

  showBanner(text) {
    const t = this.add.text(W / 2, 142, text.toUpperCase(), { fontFamily: 'Arial Black', fontSize: '16px', color: '#f0cc91', backgroundColor: '#111820cc', padding: { x: 16, y: 8 } }).setOrigin(.5).setDepth(850).setAlpha(0).setY(132);
    this.tweens.add({ targets: t, alpha: 1, y: 142, duration: 180, hold: 800, yoyo: true, onComplete: () => t.destroy() });
  }

  endRun(reason) {
    if (this.gameOver) return;
    this.gameOver = true; this.physics.pause(); this.spawnEvent.paused = true;
    this.hero.setVelocity(0, 0); this.cameras.main.shake(260, .008); this.playTone(90, .35, 'sawtooth', .04, -55);
    this.add.rectangle(W / 2, H / 2, W, H, 0x090d12, .88).setDepth(2000);
    this.add.text(W / 2, H * .38, reason, { fontFamily: 'Arial Black', fontSize: '32px', color: '#d56a49' }).setOrigin(.5).setDepth(2001);
    this.add.text(W / 2, H * .45, `SURVIVED ${Math.floor(this.runTime)}s  •  SCRAP ${this.scrap}`, { fontFamily: 'Arial', fontSize: '16px', color: '#c0c8d1' }).setOrigin(.5).setDepth(2001);
    const btn = this.add.rectangle(W / 2, H * .56, 260, 64, 0xb97945).setDepth(2001).setInteractive({ useHandCursor: true });
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
// Publish one authoritative game handle, then mirror it into the legacy
// Phaser.GAMES registry expected by older runtime layers. The ESM bundle does
// not reliably expose/populate window.Phaser.GAMES, so keep both paths aligned.
const game = new Phaser.Game(config);
window.__WM_GAME__ = game;
if (window.Phaser) {
  if (!Array.isArray(window.Phaser.GAMES)) window.Phaser.GAMES = [];
  const games = window.Phaser.GAMES;
  const existingIndex = games.indexOf(game);
  if (existingIndex > 0) games.splice(existingIndex, 1);
  if (games[0] !== game) games.unshift(game);
}

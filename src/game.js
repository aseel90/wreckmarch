import { InputManager } from './input/input-manager.js?v=1';
import { EnemyCombatSystem } from './combat/enemy-combat-system.js?v=1';

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
    this.enemyCombatSystem = new EnemyCombatSystem(this);

    this.physics.world.setBounds(24, 105, W - 48, H - 158);
    this.spawnEvent = this.time.addEvent({ delay: 690, loop: true, callback: () => this.spawnEnemy() });
    this.waveEvent = this.time.addEvent({ delay: 15000, loop: true, callback: () => this.advanceWave() });

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, undefined, this);
    this.physics.add.overlap(this.hero, this.scraps, this.collectScrap, undefined, this);
    this.physics.add.overlap(this.hero, this.enemies, this.enemyTouchesHero, undefined, this);

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
        g.fillStyle(0x34241d).fillTriangle(28, 27, 39, 6, 45, 25);
        g.fillTriangle(43, 22, 58, 4, 64, 29);
        g.fillStyle(0x2f3437).fillCircle(38, 18, 10).fillCircle(58, 18, 10);
        g.fillStyle(0x55d7e7).fillCircle(38, 18, 6).fillCircle(58, 18, 6);
        g.fillStyle(0x2b2d2f).fillRoundedRect(29 + s / 2, 76, 14, 23, 5).fillRoundedRect(52 - s / 2, 76, 14, 23, 5);
      });
    }
    for (let i = 0; i < 2; i++) {
      this.makeTexture(`rat-run-${i}`, 90, 70, g => {
        const leg = i ? 5 : -5;
        g.fillStyle(0x5e4c40).fillEllipse(43, 38, 52, 32);
        g.fillStyle(0x735f4d).fillTriangle(12, 33, 3, 22, 17, 22).fillTriangle(13, 33, 5, 40, 18, 43);
        g.fillStyle(0x3e342e).fillCircle(62, 32, 13);
        g.fillStyle(0xe7a25e).fillCircle(66, 28, 4);
        g.fillStyle(0x9a7552).lineStyle(5, 0x9a7552, 1).beginPath().moveTo(17, 42).lineTo(4, 50).strokePath();
        g.lineStyle(5, 0x453932, 1).beginPath().moveTo(28, 49).lineTo(23 + leg, 62).moveTo(50, 49).lineTo(55 - leg, 62).strokePath();
      });
    }
    this.makeTexture('bullet', 18, 18, g => g.fillStyle(0xf0c35d).fillCircle(9, 9, 7));
    this.makeTexture('flash', 32, 18, g => g.fillStyle(0xffd66f).fillTriangle(0, 9, 25, 1, 25, 17));
    this.makeTexture('scrap', 28, 28, g => {
      g.fillStyle(0xd4974d).fillRect(5, 7, 18, 14);
      g.fillStyle(0x54453c).fillCircle(9, 10, 4).fillCircle(19, 18, 4);
      g.lineStyle(2, 0xf0c878).strokeRect(5, 7, 18, 14);
    });
  }

  createAnimations() {
    this.anims.create({ key: 'hero-idle', frames: [{ key: 'hero-idle-0' }, { key: 'hero-idle-1' }], frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'hero-run', frames: [{ key: 'hero-run-0' }, { key: 'hero-run-1' }], frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'rat-run', frames: [{ key: 'rat-run-0' }, { key: 'rat-run-1' }], frameRate: 8, repeat: -1 });
  }

  createWorld() {
    this.cameras.main.setBackgroundColor('#5f4935');
    this.physics.world.setBoundsCollision(true, true, true, true);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x604a36, 1).fillRect(0, 0, W, H);
    g.fillStyle(0x745a43, 1).fillRect(20, 120, W - 40, H - 190);
    g.fillStyle(0x3f4545, 1).fillRect(0, 210, W, 210);
    g.fillStyle(0x353b3c, 1).fillRect(180, 105, 180, H - 160);
    g.lineStyle(4, 0xa69573, .45).beginPath().moveTo(0, 315).lineTo(W, 315).moveTo(270, 105).lineTo(270, H - 55).strokePath();
    for (let y = 150; y < H - 90; y += 70) {
      for (let x = 45 + ((y / 70) % 2) * 18; x < W - 30; x += 85) {
        const c = (x + y) % 3 ? 0x846b4d : 0x4a4c46;
        g.fillStyle(c, .2).fillCircle(x, y, 6 + ((x * y) % 9));
      }
    }
    this.add.text(26, 136, 'WRECKMARCH', { fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#dcb878' }).setDepth(1).setAlpha(.7);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.scraps = this.physics.add.group();
  }

  createHero() {
    this.heroShadow = this.add.ellipse(W / 2, H * .62 + 38, 62, 24, 0x000000, .24).setDepth(9);
    this.hero = this.physics.add.sprite(W / 2, H * .62, 'hero-idle-0').setDepth(20).setScale(.82);
    this.hero.play('hero-idle'); this.hero.setCircle(22, 24, 27); this.hero.setCollideWorldBounds(true);
    this.move = new Phaser.Math.Vector2(); this.heroSpeed = 255;
    this.heroKnockback = new Phaser.Math.Vector2();
  }

  createArtCompatibility() {
    this.weaponContainer = this.add.container(this.hero.x + 20, this.hero.y - 7).setDepth(21);
    const body = this.add.rectangle(0, 0, 38, 12, 0x30383b).setOrigin(0, .5);
    const core = this.add.circle(7, 0, 5, 0x50d8e7, 1);
    const barrel = this.add.rectangle(26, 0, 28, 6, 0xb96f3a).setOrigin(0, .5);
    this.weaponContainer.add([body, core, barrel]);
  }

  createHUD() {
    const small = { fontFamily: 'Arial Black, Arial', fontStyle: 'bold', color: '#d9dde0' };
    this.add.rectangle(W / 2, 55, W - 28, 74, 0x071016, .92).setDepth(699);
    this.hpBack = this.add.rectangle(20, 34, 170, 13, 0x182127).setOrigin(0, .5).setDepth(700).setStrokeStyle(2, 0x35434a);
    this.hpBar = this.add.rectangle(22, 34, 166, 9, 0x4bd777).setOrigin(0, .5).setDepth(701);
    this.add.text(20, 14, 'RUNNER', { ...small, fontSize: '11px', color: '#e3b65f' }).setDepth(701);
    this.waveText = this.add.text(W / 2, 14, 'WAVE 1', { ...small, fontSize: '12px' }).setOrigin(.5, 0).setDepth(701);
    this.timerText = this.add.text(W - 20, 14, '00:00', { ...small, fontSize: '13px' }).setOrigin(1, 0).setDepth(701);
    this.scrapText = this.add.text(W - 28, 70, 'SCRAP  0', { ...small, fontSize: '14px', color: '#e8c68d' }).setOrigin(1, 0).setDepth(700);
    this.levelText = this.add.text(20, 70, 'LV 1', { ...small, fontSize: '14px', color: '#d6cfb4' }).setDepth(700);
    this.banner = this.add.text(W / 2, 102, '', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#f1c675', stroke: '#15110a', strokeThickness: 5 }).setOrigin(.5).setDepth(701).setAlpha(0);
  }

  createJoystick() {
    this.joyBase = this.add.circle(85, H - 92, 54, 0x111921, .38).setDepth(700).setScrollFactor(0).setStrokeStyle(3, 0xa1adad, .35);
    this.joyKnob = this.add.circle(85, H - 92, 22, 0xc9d1d2, .45).setDepth(701).setScrollFactor(0);
    this.joy = { pointer: null, baseX: 85, baseY: H - 92, dx: 0, dy: 0 };
    this.input.on('pointerdown', p => { if (p.x < W * .48 && p.y > H * .55) this.joy.pointer = p.id; });
    this.input.on('pointermove', p => {
      if (this.joy.pointer !== p.id || !p.isDown) return;
      const dx = p.x - this.joy.baseX, dy = p.y - this.joy.baseY, len = Math.hypot(dx, dy), max = 48, m = len > max ? max / len : 1;
      this.joy.dx = dx * m; this.joy.dy = dy * m; this.joyKnob.setPosition(this.joy.baseX + this.joy.dx, this.joy.baseY + this.joy.dy);
    });
    const end = p => { if (this.joy.pointer === p.id) { this.joy.pointer = null; this.joy.dx = this.joy.dy = 0; this.joyKnob.setPosition(this.joy.baseX, this.joy.baseY); } };
    this.input.on('pointerup', end); this.input.on('pointerupoutside', end);
  }

  createAudio() {
    this.audioCtx = null; this.audioUnlocked = false;
  }
  unlockAudio() {
    if (this.audioUnlocked) return;
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); this.audioCtx.resume(); this.audioUnlocked = true; } catch (_) {}
  }
  playTone(freq = 220, duration = .04, type = 'square', gain = .02, slide = 0) {
    if (!this.audioUnlocked || !this.audioCtx) return;
    const now = this.audioCtx.currentTime, osc = this.audioCtx.createOscillator(), vol = this.audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.linearRampToValueAtTime(Math.max(25, freq + slide), now + duration);
    vol.gain.setValueAtTime(gain, now); vol.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(vol).connect(this.audioCtx.destination); osc.start(now); osc.stop(now + duration);
  }

  showBanner(text) {
    this.banner.setText(text).setAlpha(1).setScale(.65);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, scale: 1, duration: 170, ease: 'Back.Out', hold: 720, yoyo: true, onComplete: () => this.banner.setAlpha(0) });
  }

  advanceWave() {
    if (this.gameOver) return;
    const wave = Math.floor(this.runTime / 15) + 1;
    this.waveText.setText(`WAVE ${wave}`);
    this.spawnEvent.delay = Math.max(270, 690 - wave * 78);
    this.showBanner(wave % 2 === 0 ? 'Horde incoming' : 'The road gets meaner');
    for (let i = 0; i < Math.min(8, wave * 2); i++) this.time.delayedCall(i * 85, () => this.spawnEnemy(true));
  }

  spawnEnemy(elite = false) {
    if (this.gameOver) return;
    const side = Phaser.Math.Between(0, 3); let x, y;
    if (side === 0) { x = Phaser.Math.Between(20, W - 20); y = 105; }
    if (side === 1) { x = W - 20; y = Phaser.Math.Between(130, H - 180); }
    if (side === 2) { x = Phaser.Math.Between(20, W - 20); y = H - 165; }
    if (side === 3) { x = 20; y = Phaser.Math.Between(130, H - 180); }
    const e = this.enemies.create(x, y, 'rat-run-0').setDepth(12).setScale(elite ? 1.08 : .88);
    e.play('rat-run'); e.name = `scraprat-${this.enemySerial++}`; e.setCircle(21, 24, 17);
    e.hp = elite ? 110 + this.runTime * 2.4 : 54 + this.runTime * 1.25;
    e.speed = elite ? Phaser.Math.Between(70, 88) : Phaser.Math.Between(88, 122);
    e.damage = elite ? 19 : 10; e.elite = elite;
    if (elite) e.setTint(0xe69b56);
  }

  update(time, delta) {
    if (this.gameOver) return;
    this.runTime += delta / 1000;
    this.updateTimer();
    this.updateMovement(time);
    this.updateEnemies();
    this.updateBullets(delta);
    this.updateScrapMagnet();
    this.autoFire(time);
    this.updateHUD();
  }

  updateMovement(time) {
    this.inputManager.readMove(this.move);
    const moving = this.move.lengthSq() > .05;
    let vx = this.move.x * this.heroSpeed, vy = this.move.y * this.heroSpeed;
    if (time < this.heroKnockbackUntil) {
      const strength = Phaser.Math.Clamp((this.heroKnockbackUntil - time) / 140, 0, 1);
      vx += this.heroKnockback.x * strength; vy += this.heroKnockback.y * strength;
    }
    this.hero.setVelocity(vx, vy);
    this.hero.rotation = Phaser.Math.Linear(this.hero.rotation, moving ? this.move.x * .09 : 0, .16);
    this.hero.setFlipX(this.move.x < -.12);
    if (moving && this.hero.anims.currentAnim?.key !== 'hero-run') this.hero.play('hero-run', true);
    if (!moving && this.hero.anims.currentAnim?.key !== 'hero-idle') this.hero.play('hero-idle', true);
    this.heroShadow.setPosition(this.hero.x, this.hero.y + 36).setScale(moving ? 1.08 : 1, moving ? .85 : 1);
    if (moving && time > this.lastDustAt + 115) { this.lastDustAt = time; this.spawnDust(this.hero.x - this.move.x * 22, this.hero.y + 36, .65); }
  }

  spawnDust(x, y, scale = 1) {
    const p = this.add.ellipse(x + Phaser.Math.Between(-6, 6), y, 20 * scale, 9 * scale, 0x9a8066, .33).setDepth(9);
    this.tweens.add({ targets: p, x: x - Phaser.Math.Between(6, 20), y: y - Phaser.Math.Between(1, 8), scale: 1.7, alpha: 0, duration: 300, onComplete: () => p.destroy() });
  }

  updateEnemies() {
    this.enemies.children.iterate(e => {
      if (!e?.active) return;
      const ang = Phaser.Math.Angle.Between(e.x, e.y, this.hero.x, this.hero.y);
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
        const strength = Phaser.Math.Clamp((142 - d) / 142, .08, 1);
        const ang = Phaser.Math.Angle.Between(s.x, s.y, this.hero.x, this.hero.y);
        s.setVelocity(Math.cos(ang) * (140 + strength * 350), Math.sin(ang) * (140 + strength * 350));
      } else s.setVelocity(s.body.velocity.x * .9, s.body.velocity.y * .9);
      s.rotation += .045;
    });
  }

  autoFire(time) {
    if (time < this.lastShot + this.fireDelay) return;
    const target = this.findNearestEnemy(this.hero.x, this.hero.y, 455);
    if (!target) return;
    this.lastShot = time;
    const ang = Phaser.Math.Angle.Between(this.hero.x, this.hero.y - 6, target.x, target.y);
    const sx = this.hero.x + Math.cos(ang) * 31, sy = this.hero.y - 8 + Math.sin(ang) * 31;
    const b = this.bullets.create(sx, sy, 'bullet').setDepth(30).setScale(.86);
    b.setCircle(7, 3, 3); b.damage = this.damage; b.life = 1000;
    b.setVelocity(Math.cos(ang) * 690, Math.sin(ang) * 690);
    const flash = this.add.image(sx, sy, 'flash').setDepth(31).setRotation(ang).setScale(.62);
    this.tweens.add({ targets: flash, alpha: 0, scale: .12, duration: 70, onComplete: () => flash.destroy() });
    this.hero.rotation += Phaser.Math.Clamp(Math.cos(ang) * -.035, -.035, .035);
    this.playTone(180, .04, 'square', .018, -28);
  }

  findNearestEnemy(x, y, maxD = Infinity) {
    let best = null, bestSq = maxD * maxD;
    this.enemies.children.iterate(e => {
      if (!e?.active) return;
      const d = Phaser.Math.Distance.Squared(x, y, e.x, e.y);
      if (d < bestSq) { best = e; bestSq = d; }
    });
    return best;
  }

  onBulletHit(bullet, enemy) {
    return this.enemyCombatSystem.hitByProjectile(bullet, enemy);
  }

  spawnHitFx(x, y, vx, vy) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 4), i === 0 ? 0x61d9e6 : 0xf1c675, .9).setDepth(30);
      const a = Math.atan2(vy, vx) + Math.PI + Phaser.Math.FloatBetween(-.8, .8), dist = Phaser.Math.Between(16, 36);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, alpha: 0, scale: .2, duration: 170, onComplete: () => p.destroy() });
    }
  }

  killEnemy(enemy) {
    return this.enemyCombatSystem.killEnemy(enemy);
  }

  collectScrap(hero, scrap) {
    if (!scrap.active) return;
    scrap.disableBody(true, true); this.scrap += 1;
    this.playTone(620 + Math.min(this.scrap % 6, 5) * 55, .035, 'sine', .018, 80);
    this.tweens.add({ targets: this.scrapText, scale: 1.12, duration: 70, yoyo: true });
    const glow = this.add.circle(this.hero.x, this.hero.y, 18, 0x55d9e6, .35).setDepth(21);
    this.tweens.add({ targets: glow, scale: 2.1, alpha: 0, duration: 180, onComplete: () => glow.destroy() });
  }

  enemyTouchesHero(hero, enemy) {
    const now = this.time.now;
    if (!enemy.active || now < this.lastHeroHit + this.heroInvulnMs) return;
    const damage = Math.max(1, Math.round(enemy.damage));
    this.lastHeroHit = now;
    this.heroHp = Math.max(0, this.heroHp - damage);

    const away = new Phaser.Math.Vector2(this.hero.x - enemy.x, this.hero.y - enemy.y);
    if (away.lengthSq() < 1) away.set(1, 0);
    away.normalize().scale(190); this.heroKnockback.copy(away); this.heroKnockbackUntil = now + 140;

    this.hero.setTintFill(0xff6a5d);
    this.tweens.add({ targets: this.hero, alpha: .45, duration: 55, yoyo: true, repeat: 2, onComplete: () => { if (this.hero?.active) { this.hero.clearTint(); this.hero.setAlpha(1); } } });
    this.cameras.main.shake(100, .0045);
    this.playTone(58, .09, 'sawtooth', .025, -20);

    const damageText = this.add.text(this.hero.x, this.hero.y - 72, `-${damage}`, {
      fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#ff8072', stroke: '#210806', strokeThickness: 4
    }).setOrigin(.5).setDepth(705);
    this.tweens.add({ targets: damageText, y: damageText.y - 34, alpha: 0, duration: 520, ease: 'Cubic.Out', onComplete: () => damageText.destroy() });
    if (this.heroHp <= 0) this.endGame();
  }

  updateTimer() {
    const total = Math.floor(this.runTime), m = String(Math.floor(total / 60)).padStart(2, '0'), s = String(total % 60).padStart(2, '0');
    this.timerText.setText(`${m}:${s}`);
  }

  updateHUD() {
    const hpRatio = Phaser.Math.Clamp(this.heroHp / this.heroMaxHp, 0, 1);
    this.hpBar.width = 166 * hpRatio;
    this.hpBar.fillColor = hpRatio > .55 ? 0x4bd777 : hpRatio > .25 ? 0xe6b54f : 0xe65a4f;
    this.scrapText.setText(`SCRAP  ${this.scrap}`);
    this.levelText.setText(`LV ${1 + Math.floor(this.scrap / 9)}`);
    this.weaponContainer.setPosition(this.hero.x + (this.hero.flipX ? -26 : 22), this.hero.y - 7).setScale(this.hero.flipX ? -1 : 1, 1);
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true; this.physics.pause(); this.spawnEvent.remove(false); this.waveEvent.remove(false);
    this.hero.setTint(0xff5f52); this.hero.setAlpha(.65);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x05080b, .8).setDepth(1999);
    this.add.text(W / 2, H * .36, 'RUN ENDED', { fontFamily: 'Arial Black, Arial', fontSize: '38px', color: '#e75c4c', stroke: '#180606', strokeThickness: 7 }).setOrigin(.5).setDepth(2001);
    this.add.text(W / 2, H * .45, `SURVIVED ${Math.floor(this.runTime)}s  •  SCRAP ${this.scrap}`, { fontFamily: 'Arial', fontSize: '16px', color: '#c0c8d1' }).setOrigin(.5).setDepth(2001);
    const retry = this.add.text(W / 2, H * .56, 'TAP TO RETRY', { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#f0c15e', backgroundColor: '#182027', padding: { x: 24, y: 12 } }).setOrigin(.5).setDepth(2001).setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => location.reload());
    shade.setInteractive();
  }
}

const config = {
  type: Phaser.AUTO, width: W, height: H, parent: 'game', backgroundColor: '#4e3d2f',
  pixelArt: false, antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: WreckmarchScene
};

const game = new Phaser.Game(config);
window.__WM_GAME__ = game;

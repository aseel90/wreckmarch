import { installMobileHudPolish } from './mobile-hud-polish.js?v=3';
/* WRECKMARCH — final presentation polish layer. No balance or spawn changes. */
const VERSION = 'presentation-v1';

function installImpactFx(scene) {
  scene.spawnHitFx = function(x, y, vx = 0, vy = 0) {
    const incoming = Math.atan2(vy, vx || 1) + Math.PI;
    const colors = [0x61d9e6, 0xf1c675, 0xe6a85d];
    for (let i = 0; i < 3; i += 1) {
      const angle = incoming + Phaser.Math.FloatBetween(-.58, .58);
      const length = Phaser.Math.Between(12, 24);
      const travel = Phaser.Math.Between(10, 24);
      const streak = this.add.rectangle(x, y, length, i === 0 ? 3 : 2, colors[i], .92)
        .setOrigin(0, .5).setRotation(angle).setDepth(82);
      this.tweens.add({
        targets: streak,
        x: x + Math.cos(angle) * travel,
        y: y + Math.sin(angle) * travel,
        alpha: 0,
        scaleX: .32,
        duration: 125 + i * 18,
        ease: 'Quad.Out',
        onComplete: () => streak.destroy()
      });
    }
    for (let i = 0; i < 2; i += 1) {
      const angle = incoming + Phaser.Math.FloatBetween(-1.0, 1.0);
      const travel = Phaser.Math.Between(14, 30);
      const spark = this.add.circle(x, y, Phaser.Math.Between(2, 3), i ? 0xf1c675 : 0x79e7ef, .9).setDepth(83);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * travel,
        y: y + Math.sin(angle) * travel,
        alpha: 0,
        scale: .2,
        duration: 150,
        ease: 'Cubic.Out',
        onComplete: () => spark.destroy()
      });
    }
  };
}

function installWaveBanner(scene) {
  scene.showBanner = function(text) {
    const W = this.scale.gameSize.width;
    const rail = Number(this.__mobileHudPolish?.railHeight) || 62;
    const label = String(text || '').toUpperCase();
    const width = Phaser.Math.Clamp(150 + label.length * 7, 230, 410);
    const y = rail + 28;
    const plate = this.add.rectangle(W / 2, y, width, 34, 0x0d141b, .9)
      .setStrokeStyle(1, 0xd7ad72, .34)
      .setScrollFactor(0).setDepth(848).setAlpha(0).setScale(.96);
    const accent = this.add.rectangle(W / 2, y - 16, Math.min(width - 34, 118), 2, 0x55d7e5, .72)
      .setScrollFactor(0).setDepth(849).setAlpha(0);
    const title = this.add.text(W / 2, y, label, {
      fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#f0cc91', align: 'center'
    }).setOrigin(.5).setScrollFactor(0).setDepth(850).setAlpha(0);
    this.tweens.add({
      targets: [plate, accent, title], alpha: 1, duration: 150, ease: 'Quad.Out', hold: 760, yoyo: true,
      onComplete: () => { plate.destroy(); accent.destroy(); title.destroy(); }
    });
    this.tweens.add({ targets: plate, scaleX: 1, scaleY: 1, duration: 150, ease: 'Quad.Out' });
  };
}

function installLowHealthReadability(scene) {
  if (scene.__finalPolishHudPatch) return;
  const baseUpdateHud = scene.updateHUD?.bind(scene);
  if (!baseUpdateHud) return;
  scene.__finalPolishHudPatch = true;
  scene.updateHUD = function(...args) {
    const result = baseUpdateHud(...args);
    const hp = Phaser.Math.Clamp(this.heroHp / Math.max(1, this.heroMaxHp), 0, 1);
    if (hp < .26) {
      const pulse = .76 + (Math.sin((Number(this.time?.now) || 0) * .012) + 1) * .10;
      this.heroHpBg?.setStrokeStyle?.(1.5, 0xe9574f, .68);
      this.heroHpBg?.setAlpha?.(pulse);
      this.heroHpBar?.setAlpha?.(Math.min(1, pulse + .12));
    } else {
      this.heroHpBg?.setStrokeStyle?.(1, 0xffffff, .14);
    }
    return result;
  };
}

function installPickupPolish(scene) {
  if (scene.__finalPolishCollectPatch || !scene.collectScrap) return;
  const baseCollect = scene.collectScrap.bind(scene);
  scene.__finalPolishCollectPatch = true;
  scene.collectScrap = function(hero, scrap) {
    const before = Number(this.scrap) || 0;
    const result = baseCollect(hero, scrap);
    if ((Number(this.scrap) || 0) > before && this.scrapText?.active) {
      this.tweens.killTweensOf?.(this.scrapText);
      this.scrapText.setScale?.(1);
      this.tweens.add({ targets: this.scrapText, scaleX: 1.10, scaleY: 1.10, duration: 55, yoyo: true, ease: 'Quad.Out' });
    }
    return result;
  };
}

export function applyFinalPolish(scene) {
  if (!scene?.sys?.isActive?.()) throw new Error('Final polish requires an active Wreckmarch scene');
  if (scene.__finalPolishVersion === VERSION) return true;
  installMobileHudPolish(scene);
  installImpactFx(scene);
  installWaveBanner(scene);
  installLowHealthReadability(scene);
  installPickupPolish(scene);
  scene.__finalPolishVersion = VERSION;
  scene.__finalPolishReady = true;
  window.__WM_FINAL_POLISH__ = { version: VERSION, safeArea: scene.__mobileHudPolish?.safeInsets || null };
  document.documentElement.dataset.wreckmarchFinalPolish = VERSION;
  window.__WM_LOG__?.('Final polish active: safe-area HUD + restrained impact, pickup and wave feedback');
  return true;
}

import { createActiveUpgradeOfferChoices } from './upgrade-offer-pool.js?v=1';
import { rollUpgradeChoices } from './upgrade-roll-service.js?v=2';

// U7 canonical owner for upgrade selection scene lifecycle; phase runtimes must not wrap it.

const CATEGORY_COLORS = {
  HERO: 0xd98446,
  UTILITY: 0x4fc8d8,
  FORTRESS: 0xd4ad62,
  EVOLUTION: 0x9d6be8,
};

const colorFor = category => CATEGORY_COLORS[category] || CATEGORY_COLORS.HERO;

function fitFrame(image, maxWidth, maxHeight) {
  const frameWidth = image.frame?.realWidth || image.width || 1;
  const frameHeight = image.frame?.realHeight || image.height || 1;
  const scale = Math.min(maxWidth / frameWidth, maxHeight / frameHeight);
  image.setDisplaySize(frameWidth * scale, frameHeight * scale);
}

export class UpgradeSceneV4 extends Phaser.Scene {
  constructor() { super('UpgradeSceneV4'); }

  init(data) {
    this.payload = data || {};
    this.selectedIndex = 0;
    this.locked = false;
    this.cards = [];
  }

  create() {
    const { gameScene, choices = [], level = 1 } = this.payload;
    this.gameScene = gameScene;
    this.choices = choices;
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x05080c, .94);
    this.add.text(W / 2, 22, `LEVEL ${level}`, { fontFamily: 'Arial Black,Arial', fontSize: '13px', color: '#55d8e5' }).setOrigin(.5);
    this.add.text(W / 2, 49, 'CHOOSE YOUR UPGRADE', { fontFamily: 'Arial Black,Arial', fontSize: '25px', color: '#f1d09a' }).setOrigin(.5);
    this.add.text(W / 2, 74, 'Build the run. Change the machine.', { fontFamily: 'Arial', fontSize: '11px', color: '#8a96a0' }).setOrigin(.5);
    const margin = Phaser.Math.Clamp(W * .045, 28, 48);
    const gap = Phaser.Math.Clamp(W * .018, 12, 20);
    const cardW = Math.min(308, (W - margin * 2 - gap * 2) / 3);
    const cardH = Math.min(370, H - 114);
    const total = cardW * 3 + gap * 2;
    const start = (W - total) / 2 + cardW / 2;
    choices.forEach((upgrade, index) => this.card(start + index * (cardW + gap), H * .59, cardW, cardH, upgrade, index));
    this.refresh();
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-ONE', () => this.choose(0));
    this.input.keyboard?.on('keydown-TWO', () => this.choose(1));
    this.input.keyboard?.on('keydown-THREE', () => this.choose(2));
  }

  card(x, y, width, height, upgrade, index) {
    const accent = colorFor(upgrade.category);
    const rarity = Number.isInteger(upgrade.rarityColor) ? upgrade.rarityColor : accent;
    const group = this.add.container(x, y);
    const shadow = this.add.rectangle(7, 9, width, height, 0, .38);
    const bg = this.add.rectangle(0, 0, width, height, 0x151b22, .995).setStrokeStyle(2, rarity, .82);
    const strip = this.add.rectangle(0, -height / 2 + 7, width, 14, accent, .96);
    const category = this.add.text(-width / 2 + 17, -height / 2 + 28, upgrade.category, { fontFamily: 'Arial Black,Arial', fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(accent).rgba }).setOrigin(0, .5);
    const rarityText = this.add.text(width / 2 - 17, -height / 2 + 28, `${upgrade.rarityLabel || upgrade.rarity || 'COMMON'} • ${Math.round((Number(upgrade.rarityPowerMultiplier) || 1) * 100)}% POWER`, { fontFamily: 'Arial Black,Arial', fontSize: '9px', color: Phaser.Display.Color.IntegerToColor(rarity).rgba }).setOrigin(1, .5);
    const artHeight = Math.min(176, height * .43);
    const artY = -height * .18;
    const artBg = this.add.rectangle(0, artY, width - 26, artHeight, 0x0b1015, .72).setStrokeStyle(1.5, rarity, .34);
    const frame = `c5-card-${upgrade.id}`;
    const canUseArt = this.textures.exists('c5-upgrade-sheet') && this.textures.get('c5-upgrade-sheet')?.has?.(frame);
    const art = canUseArt
      ? this.add.image(0, artY, 'c5-upgrade-sheet', frame)
      : this.add.rectangle(0, artY, width - 38, artHeight - 10, 0x10171d, .92);
    if (canUseArt) fitFrame(art, width - 38, artHeight - 10);
    const title = this.add.text(0, height * .08, upgrade.title, { fontFamily: 'Arial Black,Arial', fontSize: `${Math.max(15, Math.min(20, width / 14))}px`, color: '#f2f4f6', align: 'center', wordWrap: { width: width - 30 } }).setOrigin(.5);
    const desc = this.add.text(0, height * .23, upgrade.desc, { fontFamily: 'Arial', fontSize: '12px', color: '#b3bdc6', align: 'center', wordWrap: { width: width - 36 }, lineSpacing: 2 }).setOrigin(.5, 0);
    const currentLevel = this.gameScene?.upgradeLevels?.[upgrade.id] || 0;
    const footer = this.add.text(0, height / 2 - 23, currentLevel ? `CURRENT LV ${currentLevel}` : 'NEW UPGRADE', { fontFamily: 'Arial Black,Arial', fontSize: '9px', color: '#77838d' }).setOrigin(.5);
    const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { this.selectedIndex = index; this.refresh(); });
    hit.on('pointerdown', () => this.choose(index));
    group.add([shadow, bg, strip, category, rarityText, artBg, art, title, desc, footer, hit]);
    this.cards.push({ group, bg, strip, rarity });
  }

  move(delta) {
    if (this.locked || !this.choices.length) return;
    this.selectedIndex = (this.selectedIndex + delta + this.choices.length) % this.choices.length;
    this.refresh();
  }

  refresh() {
    this.cards.forEach((view, index) => {
      const selected = index === this.selectedIndex;
      view.group.setScale(selected ? 1.025 : 1);
      view.bg.setStrokeStyle(selected ? 4 : 2, view.rarity, selected ? 1 : .74);
      view.strip.setAlpha(selected ? 1 : .84);
    });
  }

  choose(index) {
    if (this.locked || !this.choices[index]) return;
    this.locked = true;
    this.choices[index].apply();
    this.cameras.main.flash(70, 75, 198, 215, false);
    this.time.delayedCall(80, () => this.gameScene?.closeUpgradeCards?.());
  }
}

async function waitForSceneRegistration(gameScene, key, timeoutMs = 2000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    try {
      const registered = gameScene.scene.get(key);
      if (registered) return registered;
    } catch (_error) {
      // ScenePlugin queues add/remove operations until the SceneManager can safely process them.
    }
    await new Promise(resolve => setTimeout(resolve, 16));
  }
  throw new Error(`Timed out waiting for queued scene registration: ${key}`);
}

export async function installUpgradeScene(gameScene) {
  if (!gameScene?.scene) throw new Error('Upgrade scene install requires an active ScenePlugin');
  let upgradeScene = null;
  try { upgradeScene = gameScene.scene.get('UpgradeSceneV4'); } catch (_error) { upgradeScene = null; }
  if (!upgradeScene) {
    gameScene.scene.add('UpgradeSceneV4', UpgradeSceneV4, false);
    upgradeScene = await waitForSceneRegistration(gameScene, 'UpgradeSceneV4');
  }
  gameScene.__upgradeSceneOwner = 'src/upgrades/upgrade-scene.js';

  gameScene.openUpgradeCards = function() {
    if (this.upgradeOpen || this.gameOver) return;
    const choices = rollUpgradeChoices(createActiveUpgradeOfferChoices(this), { count: 3 });
    if (!choices.length) return;
    this.upgradeOpen = true;
    this.physics.pause();
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.waveEvent) this.waveEvent.paused = true;
    this.joy.active = false;
    this.joy.id = null;
    this.hero.setVelocity(0, 0);
    this.input.enabled = false;
    document.body.classList.add('wm-upgrade-active');
    this.scene.launch('UpgradeSceneV4', { gameScene: this, choices, level: this.level });
    this.scene.bringToTop('UpgradeSceneV4');
  };

  gameScene.closeUpgradeCards = function() {
    if (!this.upgradeOpen) return;
    document.body.classList.remove('wm-upgrade-active');
    this.scene.stop('UpgradeSceneV4');
    this.upgradeOpen = false;
    this.input.enabled = true;
    if (!this.gameOver) {
      this.physics.resume();
      if (this.spawnEvent) this.spawnEvent.paused = false;
      if (this.waveEvent) this.waveEvent.paused = false;
    }
    this.joyBase.setAlpha(.38);
    this.joyKnob.setAlpha(.4);
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.time.delayedCall(100, () => this.openUpgradeCards());
    }
  };
}
/* WRECKMARCH — U3 Elite reward / WRECK CRATE owner */
import { normalizeUpgradeRarity } from './upgrade-rarity.js?v=2';

export const ELITE_REWARD_SOURCE = 'elite';
export const WRECK_CRATE_TEXTURE = 'wreck-crate-u3';

export function createEliteRewardOfferOptions(config = {}) {
  const count = Math.max(1, Math.floor(Number(config.choices) || 3));
  const minimumRarity = normalizeUpgradeRarity(config.minimumRarity || 'RARE');
  return Object.freeze({
    source: ELITE_REWARD_SOURCE,
    count,
    minimumRarity,
    eyebrow: 'WRECK CRATE',
    heading: 'ELITE REWARD',
    subheading: `${minimumRarity}+ choice • pick one`
  });
}

function ensureWreckCrateTexture(scene) {
  if (scene.textures?.exists?.(WRECK_CRATE_TEXTURE)) return;
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(0x171d22, 1);
  graphics.fillRoundedRect(2, 6, 58, 42, 5);
  graphics.lineStyle(3, 0xd49a52, 1);
  graphics.strokeRoundedRect(2, 6, 58, 42, 5);
  graphics.fillStyle(0x8f5f35, 1);
  graphics.fillRect(7, 11, 48, 6);
  graphics.fillRect(7, 37, 48, 6);
  graphics.fillStyle(0xc5cbd0, 1);
  graphics.fillRect(27, 8, 8, 38);
  graphics.fillStyle(0x55d8e6, .9);
  graphics.fillRect(29, 23, 4, 7);
  graphics.generateTexture(WRECK_CRATE_TEXTURE, 62, 54);
  graphics.destroy();
}

function destroyCrateEntry(scene, entry) {
  entry?.overlap?.destroy?.();
  entry?.glow?.destroy?.();
  entry?.crate?.destroy?.();
  scene.__eliteRewardCrates?.delete?.(entry);
}

export function installEliteRewardSystem(scene, config = {}) {
  if (!scene || scene.__eliteRewardSystemReady) return false;
  if (typeof scene.openUpgradeCards !== 'function') {
    throw new Error('EliteRewardSystem requires canonical openUpgradeCards()');
  }

  const offerOptions = createEliteRewardOfferOptions(config);
  ensureWreckCrateTexture(scene);
  scene.__eliteRewardOfferOptions = offerOptions;
  scene.pendingEliteRewards = Math.max(0, Math.floor(Number(scene.pendingEliteRewards) || 0));
  scene.__eliteRewardCrates = new Set();

  scene.openEliteRewardCards = function() {
    if (this.upgradeOpen) {
      this.pendingEliteRewards += 1;
      return false;
    }
    this.__nextUpgradeOfferOptions = offerOptions;
    return this.openUpgradeCards?.();
  };

  scene.dropEliteRewardCrate = function({ x, y, enemyId = null } = {}) {
    if (this.gameOver) return null;
    const crateX = Number.isFinite(Number(x)) ? Number(x) : Number(this.hero?.x) || 0;
    const crateY = Number.isFinite(Number(y)) ? Number(y) : Number(this.hero?.y) || 0;
    const crate = this.physics.add.image(crateX, crateY, WRECK_CRATE_TEXTURE)
      .setDepth(19)
      .setScale(.92);
    crate.body?.setAllowGravity?.(false);
    crate.setVelocity?.(Phaser.Math.Between(-45, 45), Phaser.Math.Between(-45, 45));
    crate.setDrag?.(420, 420);
    crate.__wreckCrate = true;
    crate.__eliteEnemyId = enemyId;

    const glow = this.add.circle(crateX, crateY, 28, 0x55d8e6, .10)
      .setStrokeStyle(2, 0xe2b36f, .72)
      .setDepth(18);
    this.tweens.add({
      targets: glow,
      scale: 1.18,
      alpha: .22,
      duration: 620,
      yoyo: true,
      repeat: -1
    });

    const entry = { crate, glow, overlap: null };
    const syncGlow = () => {
      if (!crate.active || !glow.active) return;
      glow.setPosition(crate.x, crate.y);
    };
    crate.__syncGlowEvent = this.time.addEvent({ delay: 40, loop: true, callback: syncGlow });

    const collect = () => {
      if (!crate.active || crate.__collected) return;
      crate.__collected = true;
      crate.__syncGlowEvent?.remove?.(false);
      this.playTone?.(440, .06, 'triangle', .025, 120);
      this.showBanner?.('WRECK CRATE');
      try {
        this.runTelemetry?.recordEvent?.('elite_reward_crate_collected', {
          enemyId,
          minimumRarity: offerOptions.minimumRarity,
          choices: offerOptions.count
        });
      } catch (_) {}
      destroyCrateEntry(this, entry);
      this.openEliteRewardCards();
    };
    entry.overlap = this.physics.add.overlap(this.hero, crate, collect, undefined, this);
    this.__eliteRewardCrates.add(entry);
    return crate;
  };

  const previousEliteKilled = typeof scene.onEliteKilled === 'function'
    ? scene.onEliteKilled.bind(scene)
    : null;
  scene.onEliteKilled = function(payload = {}) {
    previousEliteKilled?.(payload);
    return this.dropEliteRewardCrate(payload);
  };

  scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const entry of [...scene.__eliteRewardCrates]) {
      entry?.crate?.__syncGlowEvent?.remove?.(false);
      destroyCrateEntry(scene, entry);
    }
    scene.__eliteRewardCrates?.clear?.();
  });

  scene.__eliteRewardSystemReady = true;
  window.__WM_LOG__?.(`U3 Elite rewards active: WRECK CRATE -> ${offerOptions.count} choices at ${offerOptions.minimumRarity}+ when pool allows`);
  return true;
}

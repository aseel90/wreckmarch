import { RUN_BALANCE } from '../balance/run-balance.js?v=7';
import { normalizeUpgradeRarity } from '../upgrades/upgrade-rarity.js?v=2';

export const ELITE_REWARD_SOURCE = 'elite-crate';

function requireChoiceCount(value) {
  if (!Number.isInteger(value) || value < 1) throw new TypeError(`Elite reward choices must be a positive integer: ${String(value)}`);
  return value;
}

export function createEliteRewardContext({
  choices = RUN_BALANCE.eliteRewards.choices,
  minimumRarity = RUN_BALANCE.eliteRewards.minimumRarity
} = {}) {
  return Object.freeze({
    source: ELITE_REWARD_SOURCE,
    label: 'WRECK CRATE',
    subtitle: 'ELITE REWARD',
    choices: requireChoiceCount(choices),
    minimumRarity: normalizeUpgradeRarity(minimumRarity)
  });
}

export class EliteRewardSystem {
  constructor(scene, options = {}) {
    if (!scene) throw new TypeError('EliteRewardSystem requires a scene');
    this.scene = scene;
    this.rewardContext = createEliteRewardContext(options);
    this.crates = null;
    this.overlap = null;
  }

  install() {
    if (this.crates) return this;
    const add = this.scene?.physics?.add;
    if (!add || typeof add.group !== 'function' || typeof add.overlap !== 'function') {
      throw new Error('EliteRewardSystem requires Phaser Arcade physics');
    }
    this.crates = add.group();
    this.overlap = add.overlap(
      this.scene.hero,
      this.crates,
      (_hero, crate) => this.openCrate(crate),
      undefined,
      this
    );
    this.scene.__eliteRewardSystemReady = true;
    return this;
  }

  dropCrate({ x, y } = {}) {
    const px = Number(x);
    const py = Number(y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) throw new TypeError('WRECK CRATE drop requires finite x/y coordinates');
    if (!this.crates) this.install();

    const crate = this.crates.create(px, py, 'scrap');
    crate.__wreckCrate = true;
    crate.__wreckCrateOpened = false;
    crate.setDepth?.(16);
    crate.setScale?.(1.34);
    crate.setTint?.(0x55aaff);
    crate.setImmovable?.(true);
    crate.body?.setAllowGravity?.(false);

    const label = this.scene.add?.text?.(px, py - 28, 'WRECK CRATE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '10px',
      color: '#8ec8ff',
      stroke: '#081018',
      strokeThickness: 3
    });
    label?.setOrigin?.(.5);
    label?.setDepth?.(17);
    crate.__wreckCrateLabel = label || null;
    return crate;
  }

  openCrate(crate) {
    if (!crate || crate.__wreckCrateOpened || crate.active === false) return false;
    if (this.scene.gameOver || this.scene.upgradeOpen || typeof this.scene.openUpgradeCards !== 'function') return false;

    crate.__wreckCrateOpened = true;
    this.scene.pendingUpgradeRewardContext = this.rewardContext;
    crate.__wreckCrateLabel?.destroy?.();
    crate.disableBody?.(true, true);
    crate.destroy?.();
    this.scene.openUpgradeCards();
    return true;
  }
}

import { RUN_BALANCE } from '../balance/run-balance.js?v=7';
import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from '../upgrades/upgrade-runtime.js?v=14';
import { rollUpgradeChoices } from '../upgrades/upgrade-roll-service.js?v=3';
import { EliteRewardSystem, createEliteRewardContext } from './elite-reward-system.js?v=2';

function eliteUpgradePool(scene) {
  return [
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'overclock', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'long-barrel', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'piercing-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'ricochet', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'shrapnel-impact', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'critical-rivet', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'triple-riveter', { category: 'EVOLUTION' }),
    createRegisteredUpgradeChoice(scene, 'explosive-rivet', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'field-repair', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'impact-shield', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })
  ];
}

function activeEnemies(scene) {
  return (scene.enemies?.getChildren?.() || []).filter(enemy => enemy?.active);
}

export class EliteMilestoneController {
  constructor(scene, milestones = RUN_BALANCE.eliteRewards.guaranteedAtSeconds) {
    this.scene = scene;
    this.milestones = Object.freeze([...milestones]);
    this.completed = new Set();
  }

  getDueMilestone(runTime = this.scene.runTime || 0) {
    const elapsed = Math.max(0, Number(runTime) || 0);
    return this.milestones.find(seconds => elapsed >= seconds && !this.completed.has(seconds)) ?? null;
  }

  trySpawn(runTime = this.scene.runTime || 0) {
    const milestone = this.getDueMilestone(runTime);
    if (milestone == null || typeof this.scene.spawnEnemy !== 'function') return null;
    const before = new Set(activeEnemies(this.scene));
    this.scene.spawnEnemy(true);
    const spawned = activeEnemies(this.scene).find(enemy => !before.has(enemy) && enemy.elite) || null;
    if (!spawned) return null;
    this.completed.add(milestone);
    spawned.__eliteRewardMilestoneSeconds = milestone;
    return spawned;
  }
}

function installEliteChoiceFlow(scene) {
  if (scene.__eliteChoiceFlowReady) return;
  const previousClose = scene.closeUpgradeCards?.bind(scene);

  scene.openEliteRewardCards = function(rewardContext = createEliteRewardContext()) {
    if (this.upgradeOpen || this.gameOver) return false;
    const choices = rollUpgradeChoices(eliteUpgradePool(this), {
      count: rewardContext.choices,
      minimumRarity: rewardContext.minimumRarity
    });
    if (!choices.length) return false;

    this.upgradeOpen = true;
    this.activeUpgradeRewardContext = rewardContext;
    this.physics.pause();
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.waveEvent) this.waveEvent.paused = true;
    this.joy.active = false;
    this.joy.id = null;
    this.hero.setVelocity(0, 0);
    this.input.enabled = false;
    this.showBanner?.(`WRECK CRATE • ${rewardContext.minimumRarity}+`);
    const targetScene = this.game.scene.getScene('UpgradeSceneV4') ? 'UpgradeSceneV4' : 'UpgradeScene';
    this.scene.launch(targetScene, { gameScene: this, choices, level: this.level, rewardContext });
    this.scene.bringToTop(targetScene);
    return true;
  };

  if (previousClose) {
    scene.closeUpgradeCards = function() {
      const result = previousClose();
      this.activeUpgradeRewardContext = null;
      return result;
    };
  }
  scene.__eliteChoiceFlowReady = true;
}

function installEliteDeathReward(scene, rewards) {
  const combat = scene.enemyCombatSystem;
  if (!combat || combat.__eliteRewardWrapped) return;
  const previousKill = combat.killEnemy.bind(combat);
  combat.killEnemy = function(enemy) {
    const eligible = Boolean(enemy?.active && enemy.elite && !enemy.__eliteRewardDropped);
    const drop = eligible ? { x: Number(enemy.x) || 0, y: Number(enemy.y) || 0 } : null;
    const result = previousKill(enemy);
    if (result && drop) {
      enemy.__eliteRewardDropped = true;
      rewards.dropCrate(drop);
    }
    return result;
  };
  combat.__eliteRewardWrapped = true;
}

export function installU3EliteRewards(scene) {
  if (!scene || scene.__u3EliteRewardsReady) return false;
  if (!scene.runDirector) throw new Error('U3 Elite rewards require the RunDirector Threat Budget owner first');

  installEliteChoiceFlow(scene);
  const rewards = new EliteRewardSystem(scene).install();
  installEliteDeathReward(scene, rewards);
  const milestones = new EliteMilestoneController(scene);
  scene.eliteRewardSystem = rewards;
  scene.eliteMilestoneController = milestones;

  const sync = () => {
    if (!scene?.sys?.isActive?.() || scene.gameOver) return;
    const elite = milestones.trySpawn(scene.runTime || 0);
    if (elite) scene.showBanner?.('ELITE INCOMING');
    window.__WM_ELITE_REWARDS__ = {
      active: true,
      version: 'u3-v1',
      completedMilestones: [...milestones.completed],
      minimumRarity: rewards.rewardContext.minimumRarity,
      choices: rewards.rewardContext.choices
    };
  };
  sync();
  scene.__u3EliteRewardTick = scene.time.addEvent({ delay: 1000, loop: true, callback: sync });
  scene.__u3EliteRewardsReady = true;
  document.documentElement.dataset.wreckmarchEliteRewards = 'u3-v1';
  window.__WM_LOG__?.('U3 Elite rewards active: Threat Budget milestones -> WRECK CRATE -> 3-choice Rare+ reward floor');
  return true;
}

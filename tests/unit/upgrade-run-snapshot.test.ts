import { describe, expect, it, vi } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { applyRegisteredUpgrade } from '../../src/upgrades/upgrade-runtime.js';
import {
  UPGRADE_RUN_SNAPSHOT_SCHEMA,
  UPGRADE_RUN_SNAPSHOT_VERSION,
  createRunStatModifierSnapshot,
  createUpgradeLevelSnapshot,
  createUpgradeMechanicalSnapshot,
  createUpgradeRunSnapshot,
  restoreUpgradeRunSnapshot
} from '../../src/upgrades/upgrade-run-snapshot.js';

function makeScene(heroHp = 40) {
  const runStatState = createRunStatState({
    characterBase: {
      maxHp: 100,
      moveSpeed: 255,
      armor: 0,
      critChance: 0,
      critDamageMultiplier: 1,
      pickupRadiusMultiplier: 1
    },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 },
    caps: { character: { moveSpeed: { max: 280 } } }
  });
  const scene: any = {
    level: 5,
    runStatState,
    upgradeLevels: {},
    upgradeRarityHistory: {},
    upgradeMechanicalState: {},
    heroHp,
    heroMaxHp: 100,
    heroSpeed: 255,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 },
    damage: 24,
    twinShots: 1,
    rigSummoned: false,
    hero: { x: 100, y: 100 },
    cart: {}
  };
  scene.rigSystem = {
    summon: vi.fn(() => {
      if (scene.rigSummoned) return false;
      scene.rigSummoned = true;
      return true;
    })
  };
  return scene;
}

function buildMixedSourceScene() {
  const scene = makeScene();
  applyRegisteredUpgrade(scene, 'heavy-rivets', { rarity: 'RARE' });
  applyRegisteredUpgrade(scene, 'critical-rivet', { rarity: 'COMMON' });
  applyRegisteredUpgrade(scene, 'armor-plate', { rarity: 'LEGENDARY' });
  applyRegisteredUpgrade(scene, 'twin-riveter', { rarity: 'COMMON' });
  applyRegisteredUpgrade(scene, 'twin-riveter', { rarity: 'COMMON' });
  applyRegisteredUpgrade(scene, 'call-rig', { rarity: 'COMMON' });
  scene.heroHp = 17;
  return scene;
}

describe('Upgrade System 2.0 run-state snapshot readiness', () => {
  it('defines versioned JSON-safe level, stat and persistent mechanical snapshot formats', () => {
    const scene = buildMixedSourceScene();
    const levels = createUpgradeLevelSnapshot(scene);
    const stats = createRunStatModifierSnapshot(scene);
    const mechanical = createUpgradeMechanicalSnapshot(scene, levels);
    const snapshot = createUpgradeRunSnapshot(scene);

    expect(levels.levels).toEqual({
      'heavy-rivets': 1,
      'critical-rivet': 1,
      'armor-plate': 1,
      'twin-riveter': 2,
      'call-rig': 1
    });
    expect(levels.rarityHistory).toEqual({
      'heavy-rivets': ['RARE'],
      'critical-rivet': ['COMMON'],
      'armor-plate': ['LEGENDARY'],
      'twin-riveter': ['COMMON', 'COMMON'],
      'call-rig': ['COMMON']
    });
    expect(stats.modifiers.weapon.damage[0]).toMatchObject({ id: 'heavy-rivets@1:0', value: 0.138 });
    expect(stats.modifiers.character.maxHp[0]).toMatchObject({ id: 'armor-plate@1:0', value: 22.5 });
    expect(stats.modifiers.character.critChance[0]).toMatchObject({ id: 'critical-rivet@1:0', value: 0.05 });
    expect(mechanical.effects['twin-riveter']).toMatchObject({
      effectId: 'TWIN_RIVETER',
      level: 2,
      rarity: 'COMMON',
      projectileCount: 2,
      volleyDamageMultiplier: 1.4,
      projectileDamageScale: 0.7
    });
    expect(mechanical.effects['call-rig']).toMatchObject({ effectId: 'SUMMON_RIG', summoned: true });
    expect(mechanical.effects['armor-plate']).toBeUndefined();

    expect(snapshot.schema).toBe(UPGRADE_RUN_SNAPSHOT_SCHEMA);
    expect(snapshot.version).toBe(UPGRADE_RUN_SNAPSHOT_VERSION);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it('round-trips canonical upgrade state without replaying acquisition-only healing', () => {
    const source = buildMixedSourceScene();
    const sourceResolved = source.runStatState.resolve();
    const encoded = JSON.stringify(createUpgradeRunSnapshot(source));
    const target = makeScene(9);

    const restored = restoreUpgradeRunSnapshot(target, JSON.parse(encoded));

    expect(restored).toMatchObject({
      schema: UPGRADE_RUN_SNAPSHOT_SCHEMA,
      version: UPGRADE_RUN_SNAPSHOT_VERSION
    });
    expect(new Set(restored.restoredUpgradeIds)).toEqual(new Set(['heavy-rivets', 'critical-rivet', 'armor-plate', 'twin-riveter', 'call-rig']));
    expect(target.upgradeLevels).toEqual(source.upgradeLevels);
    expect(target.upgradeRarityHistory).toEqual(source.upgradeRarityHistory);
    expect(target.runStatState.state.modifiers).toEqual(source.runStatState.state.modifiers);
    expect(target.runStatState.state.caps).toEqual(source.runStatState.state.caps);
    expect(target.runStatState.resolve()).toEqual(sourceResolved);
    expect(target.primaryWeapon.damage).toBeCloseTo(source.primaryWeapon.damage);
    expect(target.heroMaxHp).toBeCloseTo(source.heroMaxHp);
    expect(target.runCombatStats.critChance).toBeCloseTo(0.05);
    expect(target.heroHp).toBe(9);
    expect(target.upgradeMechanicalState['twin-riveter']).toMatchObject({ level: 2, projectileCount: 2, volleyDamageMultiplier: 1.4, projectileDamageScale: 0.7 });
    expect(target.twinShots).toBe(2);
    expect(target.rigSystem.summon).toHaveBeenCalledTimes(1);
    expect(target.rigSummoned).toBe(true);
  });

  it('rejects inconsistent persistent mechanical snapshots instead of silently dropping state', () => {
    const missingTwin = makeScene();
    missingTwin.upgradeLevels['twin-riveter'] = 1;
    missingTwin.upgradeRarityHistory['twin-riveter'] = ['COMMON'];
    expect(() => createUpgradeRunSnapshot(missingTwin)).toThrow(/missing persistent mechanical state/i);

    const missingRig = makeScene();
    missingRig.upgradeLevels['call-rig'] = 1;
    missingRig.upgradeRarityHistory['call-rig'] = ['COMMON'];
    expect(() => createUpgradeRunSnapshot(missingRig)).toThrow(/summoned=true/i);
  });

  it('validates snapshot versions and refuses restore into a dirty run', () => {
    const source = buildMixedSourceScene();
    const snapshot: any = JSON.parse(JSON.stringify(createUpgradeRunSnapshot(source)));

    expect(() => restoreUpgradeRunSnapshot(makeScene(), { ...snapshot, version: 999 })).toThrow(/Unsupported upgrade run snapshot version/);

    const invalidLevel = JSON.parse(JSON.stringify(snapshot));
    invalidLevel.upgrades.levels['heavy-rivets'] = 999;
    expect(() => restoreUpgradeRunSnapshot(makeScene(), invalidLevel)).toThrow(/Invalid snapshot level/);

    const invalidHistory = JSON.parse(JSON.stringify(snapshot));
    invalidHistory.upgrades.rarityHistory['heavy-rivets'] = [];
    expect(() => restoreUpgradeRunSnapshot(makeScene(), invalidHistory)).toThrow(/Rarity history length/);

    const dirtyTarget = makeScene();
    dirtyTarget.upgradeLevels['heavy-rivets'] = 1;
    expect(() => restoreUpgradeRunSnapshot(dirtyTarget, snapshot)).toThrow(/must not already contain acquired upgrades/);
  });
});

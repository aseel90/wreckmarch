import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { getUpgradeBeforeAfterPreview, UPGRADE_PREVIEW_VERSION } from '../../src/upgrades/upgrade-preview.js';

function createScene(overrides: Record<string, any> = {}) {
  const runStatState = createRunStatState({
    characterBase: {
      maxHp: 100,
      moveSpeed: 220,
      armor: 0,
      critChance: 0,
      critDamageMultiplier: 1.5,
      pickupRadiusMultiplier: 1
    },
    weaponBase: {
      damage: 10,
      fireDelay: 500,
      projectileSpeed: 500,
      range: 600,
      pierceCount: 0,
      ricochetCount: 0,
      shrapnelCount: 0
    }
  });
  return {
    runStatState,
    upgradeLevels: {},
    upgradeMechanicalState: {},
    heroHp: 70,
    heroMaxHp: 100,
    heroShieldCharges: 0,
    rigSummoned: false,
    hero: {},
    cart: {},
    primaryWeapon: {
      damage: 10,
      fireDelay: 500,
      projectileSpeed: 500,
      range: 600,
      fireProfile: { projectileCount: 1, volleyDamageMultiplier: 1 }
    },
    ...overrides
  };
}

function preview(scene: any, id: string, rarity?: string) {
  const definition = getUpgradeDefinition(id)!;
  return getUpgradeBeforeAfterPreview(scene, { id, rarity: rarity || definition.rarity || 'COMMON' });
}

describe('U5 canonical before→after upgrade previews', () => {
  it('uses the canonical stat resolver path without mutating the live run state', () => {
    const scene = createScene();
    const before = scene.runStatState.resolve();
    const result = preview(scene, 'heavy-rivets');

    expect(result.version).toBe(UPGRADE_PREVIEW_VERSION);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ label: 'DAMAGE', before: 10, beforeText: '10', afterText: '11.2', source: 'STAT' });
    expect(result.rows[0].after).toBeCloseTo(11.2, 8);
    expect(scene.runStatState.resolve()).toEqual(before);
    expect(scene.primaryWeapon.damage).toBe(10);
    expect(scene.upgradeLevels).toEqual({});
  });

  it('shows both real Long Barrel stat changes from the sandbox resolver', () => {
    const result = preview(createScene(), 'long-barrel');
    expect(result.rows.map(row => [row.label, row.beforeText, row.afterText])).toEqual([
      ['PROJECTILE SPD', '500', '590'],
      ['RANGE', '600', '660']
    ]);
  });

  it('previews mixed Armor Plate max-HP and heal in the same stat-then-mechanical order as apply', () => {
    const scene = createScene({ heroHp: 70, heroMaxHp: 100 });
    const result = preview(scene, 'armor-plate');
    expect(result.rows.map(row => [row.label, row.beforeText, row.afterText])).toEqual([
      ['MAX HP', '100', '115'],
      ['HP', '70/100', '85/115']
    ]);
    expect(scene.heroHp).toBe(70);
    expect(scene.heroMaxHp).toBe(100);
  });

  it('uses canonical mechanical transactions for multishot evolution previews', () => {
    const twinScene = createScene();
    const twin = preview(twinScene, 'twin-riveter');
    expect(twin.rows.map(row => [row.label, row.beforeText, row.afterText])).toEqual([
      ['RIVETS', '1', '2'],
      ['VOLLEY', '1x', '1.2x']
    ]);

    const tripleScene = createScene({
      upgradeLevels: { 'twin-riveter': 2 },
      upgradeMechanicalState: {
        'twin-riveter': { effectId: 'TWIN_RIVETER', level: 2, projectileCount: 2, volleyDamageMultiplier: 1.4, projectileDamageScale: .7 }
      },
      twinShots: 2,
      primaryWeapon: { damage: 10, fireDelay: 500, projectileSpeed: 500, range: 600, fireProfile: { projectileCount: 2, volleyDamageMultiplier: 1.4 } }
    });
    const triple = preview(tripleScene, 'triple-riveter', 'RARE');
    expect(triple.rows.map(row => [row.label, row.beforeText, row.afterText])).toEqual([
      ['RIVETS', '2', '3'],
      ['VOLLEY', '1.4x', '1.6x']
    ]);
  });

  it('previews explosive cadence/radius and survivability mechanics without touching the real scene', () => {
    const explosive = preview(createScene(), 'explosive-rivet');
    expect(explosive.rows.map(row => [row.label, row.beforeText, row.afterText])).toEqual([
      ['BLAST', 'OFF', '5s'],
      ['RADIUS', '—', '90']
    ]);

    const repairScene = createScene({ heroHp: 60, heroMaxHp: 100 });
    expect(preview(repairScene, 'field-repair').rows[0]).toMatchObject({ label: 'HP', beforeText: '60/100', afterText: '85/100' });
    expect(repairScene.heroHp).toBe(60);

    const shieldScene = createScene({ heroShieldCharges: 1 });
    expect(preview(shieldScene, 'impact-shield').rows[0]).toMatchObject({ label: 'SHIELD', beforeText: '1/2', afterText: '2/2' });
    expect(shieldScene.heroShieldCharges).toBe(1);

    const rigScene = createScene({ rigSummoned: false });
    expect(preview(rigScene, 'call-rig').rows[0]).toMatchObject({ label: 'RIG', beforeText: 'OFF', afterText: 'ON' });
    expect(rigScene.rigSummoned).toBe(false);
  });

  it('produces at least one exact preview row for every active offer definition', () => {
    const ids = [
      'heavy-rivets', 'overclock', 'long-barrel', 'piercing-rivets', 'ricochet', 'shrapnel-impact',
      'critical-rivet', 'twin-riveter', 'fleet-feet', 'scrap-magnet', 'armor-plate', 'explosive-rivet',
      'triple-riveter', 'field-repair', 'impact-shield', 'call-rig'
    ];
    for (const id of ids) {
      const scene = createScene(id === 'triple-riveter' ? {
        upgradeLevels: { 'twin-riveter': 2 },
        upgradeMechanicalState: { 'twin-riveter': { projectileCount: 2, volleyDamageMultiplier: 1.4 } },
        twinShots: 2
      } : id === 'field-repair' ? { heroHp: 60 } : {});
      const result = preview(scene, id);
      expect(result.rows.length, id).toBeGreaterThan(0);
      expect(result.rows.every(row => row.beforeText !== '' && row.afterText !== ''), id).toBe(true);
    }
  });
});

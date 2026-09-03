import { describe, expect, it } from 'vitest';
import { createRunBuildSnapshot, RUN_BUILD_SNAPSHOT_VERSION } from '../../src/upgrades/run-build-snapshot.js';

function makeScene() {
  return {
    characterId: 'runner',
    characterDefinition: { id: 'runner', displayName: 'RUNNER' },
    activeWeaponId: 'rivet-gun',
    weaponDefinition: { id: 'rivet-gun', displayName: 'RIVET GUN', fireProfile: { projectileCount: 1, volleyDamageMultiplier: 1 } },
    heroHp: 87,
    upgradeLevels: { 'heavy-rivets': 2, overclock: 1 },
    upgradeRarityHistory: { 'heavy-rivets': ['COMMON', 'RARE'], overclock: ['EPIC'] },
    runStatState: {
      resolve: () => ({
        character: { maxHp: 115, moveSpeed: 263, armor: 8, critChance: .15, critDamageMultiplier: 1.5, pickupRadiusMultiplier: 1.2 },
        weapon: { damage: 34.6, fireDelay: 240, projectileSpeed: 760, range: 520, pierceCount: 1, ricochetCount: 0, shrapnelCount: 0 },
      }),
    },
    weaponSystem: {
      heroVolleyProfile: () => ({ source: 'upgrade', projectileCount: 3, halfSpreadRadians: .085, volleyDamageMultiplier: 1.4, projectileDamageScale: 1.4 / 3 }),
    },
  } as any;
}

describe('U6 canonical run build snapshot', () => {
  it('reads character and weapon values from canonical resolved run stats', () => {
    const snapshot = createRunBuildSnapshot(makeScene());
    expect(snapshot.version).toBe(RUN_BUILD_SNAPSHOT_VERSION);
    expect(snapshot.character).toMatchObject({ id: 'runner', displayName: 'RUNNER', hp: { current: 87, max: 115 } });
    expect(snapshot.character.stats).toMatchObject({ moveSpeed: 263, armor: 8, critChance: .15, critDamageMultiplier: 1.5 });
    expect(snapshot.weapon).toMatchObject({ id: 'rivet-gun', displayName: 'RIVET GUN' });
    expect(snapshot.weapon.stats).toMatchObject({ damage: 34.6, fireDelay: 240, range: 520, pierceCount: 1 });
    expect(snapshot.weapon.fireRatePerSecond).toBeCloseTo(1000 / 240, 8);
  });

  it('uses WeaponSystem heroVolleyProfile so Twin/Triple/Shotgun display the live firing profile', () => {
    const snapshot = createRunBuildSnapshot(makeScene());
    expect(snapshot.weapon.volley).toEqual({
      source: 'upgrade',
      projectileCount: 3,
      halfSpreadRadians: .085,
      volleyDamageMultiplier: 1.4,
      projectileDamageScale: 1.4 / 3,
    });
  });

  it('exposes the acquired build read-only with canonical levels and rarity history', () => {
    const snapshot = createRunBuildSnapshot(makeScene());
    expect(snapshot.upgrades.map((upgrade: any) => upgrade.id)).toEqual(['heavy-rivets', 'overclock']);
    expect(snapshot.upgrades[0]).toMatchObject({ id: 'heavy-rivets', level: 2, latestRarity: 'RARE' });
    expect(snapshot.upgrades[1]).toMatchObject({ id: 'overclock', level: 1, latestRarity: 'EPIC' });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.weapon.volley)).toBe(true);
    expect(Object.isFrozen(snapshot.upgrades)).toBe(true);
  });
});

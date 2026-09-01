import { WeaponSystem } from '../combat/weapon-system.js';
import { createRunStatState, mirrorResolvedRunStats } from '../stats/run-stat-state.js';
import { applyRegisteredUpgrade } from '../upgrades/upgrade-runtime.js';

const BASE_CHARACTER = Object.freeze({
  maxHp: 100,
  moveSpeed: 255,
  armor: 0,
  critChance: 0,
  critDamageMultiplier: 1.5,
  pickupRadiusMultiplier: 1
});

const BASE_WEAPON = Object.freeze({
  damage: 24,
  fireDelay: 390,
  projectileSpeed: 760,
  range: 570,
  pierceCount: 0,
  ricochetCount: 0,
  shrapnelCount: 0
});

const plan = (...entries) => Object.freeze(entries.map(([id, levels]) => Object.freeze({ id, levels })));

export const BALANCE_SCENARIO_IDS = Object.freeze([
  'BASELINE_RUNNER_NO_UPGRADES',
  'TWIN_ONLY',
  'HEAVY_ONLY',
  'OVERCLOCK_ONLY',
  'HEAVY_OVERCLOCK',
  'TWIN_SHRAPNEL',
  'TWIN_PIERCE_RICOCHET',
  'CURRENT_MAX_POWER_BUILD'
]);

export const BALANCE_SCENARIOS = Object.freeze({
  BASELINE_RUNNER_NO_UPGRADES: Object.freeze({ seed: 0x11a0c001, upgrades: plan() }),
  TWIN_ONLY: Object.freeze({ seed: 0x11a0c002, upgrades: plan(['twin-riveter', 2]) }),
  HEAVY_ONLY: Object.freeze({ seed: 0x11a0c003, upgrades: plan(['heavy-rivets', 5]) }),
  OVERCLOCK_ONLY: Object.freeze({ seed: 0x11a0c004, upgrades: plan(['overclock', 5]) }),
  HEAVY_OVERCLOCK: Object.freeze({ seed: 0x11a0c005, upgrades: plan(['heavy-rivets', 5], ['overclock', 5]) }),
  TWIN_SHRAPNEL: Object.freeze({ seed: 0x11a0c006, upgrades: plan(['twin-riveter', 2], ['shrapnel-impact', 2]) }),
  TWIN_PIERCE_RICOCHET: Object.freeze({ seed: 0x11a0c007, upgrades: plan(['twin-riveter', 2], ['piercing-rivets', 3], ['ricochet', 2]) }),
  CURRENT_MAX_POWER_BUILD: Object.freeze({
    seed: 0x11a0c008,
    upgrades: plan(
      ['heavy-rivets', 5],
      ['overclock', 5],
      ['long-barrel', 4],
      ['twin-riveter', 2],
      ['piercing-rivets', 3],
      ['ricochet', 2],
      ['shrapnel-impact', 2],
      ['critical-rivet', 4]
    )
  })
});

function createSeededRandom(seed) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function createScenarioScene() {
  const runStatState = createRunStatState({
    characterBase: BASE_CHARACTER,
    weaponBase: BASE_WEAPON
  });
  const scene = {
    level: 99,
    heroHp: BASE_CHARACTER.maxHp,
    heroMaxHp: BASE_CHARACTER.maxHp,
    heroSpeed: BASE_CHARACTER.moveSpeed,
    damage: BASE_WEAPON.damage,
    fireDelay: BASE_WEAPON.fireDelay,
    primaryWeapon: { ...BASE_WEAPON },
    upgradeLevels: {},
    upgradeRarityHistory: {},
    upgradeMechanicalState: {},
    twinShots: 1,
    runStatState
  };
  mirrorResolvedRunStats(scene, runStatState.resolve());
  return scene;
}

function applyScenarioPlan(scene, upgrades) {
  for (const entry of upgrades) {
    for (let level = 0; level < entry.levels; level += 1) {
      applyRegisteredUpgrade(scene, entry.id, { rarity: 'COMMON' });
    }
  }
}

function sampleCriticalRolls(seed, critChance, sampleSize = 128) {
  const random = createSeededRandom(seed);
  let hits = 0;
  const firstRolls = [];
  for (let i = 0; i < sampleSize; i += 1) {
    const value = random();
    if (i < 8) firstRolls.push(Number(value.toFixed(6)));
    if (value < critChance) hits += 1;
  }
  return Object.freeze({ sampleSize, hits, firstRolls: Object.freeze(firstRolls) });
}

function round(value, digits = 6) {
  return Number(Number(value || 0).toFixed(digits));
}

export function runDeterministicBalanceScenario(id) {
  const definition = BALANCE_SCENARIOS[id];
  if (!definition) throw new Error(`Unknown deterministic balance scenario: ${id}`);

  const scene = createScenarioScene();
  applyScenarioPlan(scene, definition.upgrades);
  const resolved = scene.runStatState.resolve();
  mirrorResolvedRunStats(scene, resolved);

  const weaponSystem = new WeaponSystem(scene, { projectileSystem: {} });
  const spreads = weaponSystem.heroSpreads();
  const projectileCount = spreads.length;
  const projectileDamageScale = weaponSystem.heroProjectileDamageScale(projectileCount);
  const volleyDamageMultiplier = projectileCount * projectileDamageScale;
  const weapon = resolved.weapon;
  const character = resolved.character;
  const nominalVolleyDamage = weapon.damage * volleyDamageMultiplier;
  const nominalTriggerDps = nominalVolleyDamage * (1000 / weapon.fireDelay);

  return Object.freeze({
    schemaVersion: 1,
    id,
    seed: definition.seed,
    upgrades: Object.freeze(definition.upgrades.map(entry => Object.freeze({ ...entry }))),
    upgradeLevels: Object.freeze({ ...scene.upgradeLevels }),
    rarityHistory: Object.freeze(Object.fromEntries(Object.entries(scene.upgradeRarityHistory).map(([key, value]) => [key, Object.freeze([...value])]))),
    resolvedStats: Object.freeze({
      character: Object.freeze({ ...character }),
      weapon: Object.freeze({ ...weapon })
    }),
    mechanics: Object.freeze({
      projectileCount,
      projectileDamageScale: round(projectileDamageScale),
      volleyDamageMultiplier: round(volleyDamageMultiplier),
      spreads: Object.freeze([...spreads]),
      pierceCount: Number(weapon.pierceCount || 0),
      ricochetCount: Number(weapon.ricochetCount || 0),
      shrapnelCount: Number(weapon.shrapnelCount || 0)
    }),
    derived: Object.freeze({
      nominalVolleyDamage: round(nominalVolleyDamage),
      nominalTriggerDps: round(nominalTriggerDps),
      criticalRollSample: sampleCriticalRolls(definition.seed, Number(character.critChance || 0))
    })
  });
}

export function runAllDeterministicBalanceScenarios() {
  return Object.freeze(BALANCE_SCENARIO_IDS.map(id => runDeterministicBalanceScenario(id)));
}

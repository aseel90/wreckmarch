import { POWER_BUDGET, POWER_BUDGET_REFERENCE } from './power-budget.js';

const freeze = Object.freeze;

export const WS20_ARCHETYPES = freeze({
  SCALAR_PRECISION: 'SCALAR_PRECISION',
  CROWD_CHAIN: 'CROWD_CHAIN',
  SURVIVAL_SUPPORT: 'SURVIVAL_SUPPORT'
});

const SCALAR_IDS = freeze(['heavy-rivets', 'overclock', 'critical-rivet', 'twin-riveter', 'triple-riveter', 'long-barrel']);
const CROWD_IDS = freeze(['piercing-rivets', 'ricochet', 'shrapnel-impact', 'explosive-rivet']);
const SURVIVAL_IDS = freeze(['fleet-feet', 'armor-plate', 'field-repair', 'impact-shield', 'call-rig']);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveLevel(levels, id) {
  return Math.max(0, Math.floor(finite(levels?.[id], 0)));
}

function countOwned(levels, ids) {
  return ids.reduce((count, id) => count + (positiveLevel(levels, id) > 0 ? 1 : 0), 0);
}

function round(value, digits = 6) {
  return Number(finite(value).toFixed(digits));
}

function safeRatio(numerator, denominator) {
  const den = finite(denominator);
  return den > 0 ? Math.max(0, finite(numerator)) / den : 0;
}

function directConcentration(report) {
  const levels = report?.upgrades?.finalLevels || {};
  const character = report?.upgrades?.resolvedStats?.character || {};
  const weapon = report?.upgrades?.resolvedStats?.weapon || {};
  const entries = [];

  if (positiveLevel(levels, 'heavy-rivets') > 0) {
    const damage = Math.max(POWER_BUDGET_REFERENCE.runnerBaseDamage, finite(weapon.damage, POWER_BUDGET_REFERENCE.runnerBaseDamage));
    entries.push(freeze({
      id: 'heavy-rivets',
      share: round(1 - (POWER_BUDGET_REFERENCE.runnerBaseDamage / damage))
    }));
  }

  if (positiveLevel(levels, 'overclock') > 0) {
    const fireDelay = Math.min(POWER_BUDGET_REFERENCE.runnerBaseFireDelayMs, Math.max(1, finite(weapon.fireDelay, POWER_BUDGET_REFERENCE.runnerBaseFireDelayMs)));
    entries.push(freeze({
      id: 'overclock',
      share: round(1 - (fireDelay / POWER_BUDGET_REFERENCE.runnerBaseFireDelayMs))
    }));
  }

  if (positiveLevel(levels, 'critical-rivet') > 0) {
    const chance = Math.max(0, Math.min(1, finite(character.critChance, 0)));
    const critMultiplier = Math.max(1, finite(character.critDamageMultiplier, 1.5));
    const expected = 1 + chance * (critMultiplier - 1);
    entries.push(freeze({ id: 'critical-rivet', share: round(1 - (1 / expected)) }));
  }

  const twinLevel = positiveLevel(levels, 'twin-riveter');
  const tripleLevel = positiveLevel(levels, 'triple-riveter');
  if (twinLevel > 0) {
    const twinMultiplier = twinLevel >= 2
      ? POWER_BUDGET.volley.twinLevel2SingleTargetMultiplier
      : POWER_BUDGET.volley.twinLevel1SingleTargetMultiplier;
    entries.push(freeze({ id: 'twin-riveter', share: round(1 - (1 / twinMultiplier)) }));
  }
  if (tripleLevel > 0) {
    entries.push(freeze({
      id: 'triple-riveter',
      share: round(1 - (POWER_BUDGET.volley.twinLevel2SingleTargetMultiplier / POWER_BUDGET.volley.tripleSingleTargetMultiplier))
    }));
  }

  const maxEntry = entries.reduce((max, entry) => (!max || entry.share > max.share ? entry : max), null);
  const limit = POWER_BUDGET.buildDiversity.maxSingleCardShareOfFinalDirectPowerBudget;
  return freeze({
    entries: freeze(entries),
    maxEntry,
    limit,
    passes: !maxEntry || maxEntry.share <= limit
  });
}

export function classifyWs20ProductionReport(report = {}) {
  const finalWave = Math.max(0, Math.floor(finite(report?.run?.finalWave, 0)));
  const levels = report?.upgrades?.finalLevels || {};
  const character = report?.upgrades?.resolvedStats?.character || {};
  const combat = report?.combat || {};
  const paths = combat?.damageByProjectilePath;
  const pathTelemetryAvailable = Boolean(paths && typeof paths === 'object' && Number.isFinite(Number(paths.primary)));
  const totalDamage = Math.max(0, finite(combat.damageDealt, 0));
  const secondaryDamage = pathTelemetryAvailable
    ? ['pierce', 'ricochet', 'shrapnel', 'explosion'].reduce((sum, key) => sum + Math.max(0, finite(paths[key], 0)), 0)
    : 0;
  const primaryDamage = pathTelemetryAvailable ? Math.max(0, finite(paths.primary, 0)) : 0;
  const supportDamage = pathTelemetryAvailable ? Math.max(0, finite(paths.support, 0)) : 0;

  const pathShares = freeze({
    primary: round(safeRatio(primaryDamage, totalDamage)),
    secondary: round(safeRatio(secondaryDamage, totalDamage)),
    support: round(safeRatio(supportDamage, totalDamage))
  });

  const scalarCardCount = countOwned(levels, SCALAR_IDS);
  const crowdCardCount = countOwned(levels, CROWD_IDS);
  const survivalCardCount = countOwned(levels, SURVIVAL_IDS);
  const survivalTotalLevels = SURVIVAL_IDS.reduce((sum, id) => sum + positiveLevel(levels, id), 0);
  const survivalInvestment = freeze({
    distinctCards: survivalCardCount,
    totalLevels: survivalTotalLevels,
    qualifies: survivalCardCount >= 3 || survivalTotalLevels >= 4
  });

  const survivalSignals = freeze({
    maxHp: finite(character.maxHp, 100) > 100,
    mobility: finite(character.moveSpeed, POWER_BUDGET_REFERENCE.runnerBaseMoveSpeed) > POWER_BUDGET_REFERENCE.runnerBaseMoveSpeed,
    healing: finite(combat.healingReceived, 0) > 0,
    shield: finite(combat.shieldDamagePrevented, 0) > 0,
    support: pathShares.support >= 0.05
  });
  const survivalSignalCount = Object.values(survivalSignals).filter(Boolean).length;

  const concentration = directConcentration(report);
  const matches = [];

  if (
    pathTelemetryAvailable &&
    scalarCardCount >= 3 &&
    crowdCardCount <= 1 &&
    pathShares.primary >= 0.80
  ) matches.push(WS20_ARCHETYPES.SCALAR_PRECISION);

  if (
    pathTelemetryAvailable &&
    crowdCardCount >= 2 &&
    pathShares.secondary >= 0.15
  ) matches.push(WS20_ARCHETYPES.CROWD_CHAIN);

  if (
    survivalInvestment.qualifies &&
    survivalSignalCount >= 2
  ) matches.push(WS20_ARCHETYPES.SURVIVAL_SUPPORT);

  const waveEligible = finalWave >= POWER_BUDGET.axes.singleTarget.stageEnvelopes[2].minWave + 1;
  const uniqueIdentity = matches.length === 1;
  const accepted = waveEligible && concentration.passes && uniqueIdentity;

  return freeze({
    reportId: String(report?.reportId || ''),
    finalWave,
    waveEligible,
    pathTelemetryAvailable,
    cardCounts: freeze({ scalar: scalarCardCount, crowd: crowdCardCount, survival: survivalCardCount }),
    survivalInvestment,
    pathShares,
    survivalSignals,
    survivalSignalCount,
    concentration,
    matches: freeze(matches),
    uniqueIdentity,
    accepted,
    acceptedArchetype: accepted ? matches[0] : null,
    rejectionReasons: freeze([
      ...(waveEligible ? [] : ['WAVE_BELOW_8']),
      ...(concentration.passes ? [] : ['DIRECT_POWER_CONCENTRATION_ABOVE_35_PERCENT']),
      ...(pathTelemetryAvailable ? [] : ['PATH_TELEMETRY_UNAVAILABLE_FOR_OFFENSIVE_IDENTITY']),
      ...(matches.length === 0 ? ['NO_ARCHETYPE_MATCH'] : []),
      ...(matches.length > 1 ? ['AMBIGUOUS_HYBRID_IDENTITY'] : [])
    ])
  });
}

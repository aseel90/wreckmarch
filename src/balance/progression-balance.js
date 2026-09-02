/* WRECKMARCH — canonical 10-minute upgrade progression balance */

export const PROGRESSION_BALANCE = Object.freeze({
  runTargetSeconds: 600,
  targetTotalUpgrades: Object.freeze({ min: 10, max: 14 }),
  expectedEliteBonusUpgrades: 2,
  xpCurve: Object.freeze({
    base: 8,
    linearPerLevel: 4,
    powerScale: 1.6,
    powerExponent: 1.8
  })
});

export function getScrapXpNeeded(level = 1) {
  const normalizedLevel = Math.max(1, Math.floor(Number(level) || 1));
  const x = normalizedLevel - 1;
  const curve = PROGRESSION_BALANCE.xpCurve;
  return curve.base
    + curve.linearPerLevel * x
    + Math.floor(curve.powerScale * Math.pow(x, curve.powerExponent));
}

export function getCumulativeScrapForUpgradeCount(upgradeCount = 0) {
  const count = Math.max(0, Math.floor(Number(upgradeCount) || 0));
  let total = 0;
  for (let level = 1; level <= count; level += 1) total += getScrapXpNeeded(level);
  return total;
}

export function getXpUpgradeCountForScrap(scrapCollected = 0) {
  let remaining = Math.max(0, Math.floor(Number(scrapCollected) || 0));
  let level = 1;
  let upgrades = 0;
  while (upgrades < 100) {
    const needed = getScrapXpNeeded(level);
    if (remaining < needed) break;
    remaining -= needed;
    level += 1;
    upgrades += 1;
  }
  return upgrades;
}

export function evaluateTenMinuteProgression(scrapCollected = 0, eliteBonusUpgrades = PROGRESSION_BALANCE.expectedEliteBonusUpgrades) {
  const xpUpgrades = getXpUpgradeCountForScrap(scrapCollected);
  const eliteUpgrades = Math.max(0, Math.floor(Number(eliteBonusUpgrades) || 0));
  const totalUpgrades = xpUpgrades + eliteUpgrades;
  const target = PROGRESSION_BALANCE.targetTotalUpgrades;
  return Object.freeze({
    xpUpgrades,
    eliteUpgrades,
    totalUpgrades,
    withinTarget: totalUpgrades >= target.min && totalUpgrades <= target.max
  });
}

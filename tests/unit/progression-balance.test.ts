import { describe, expect, it } from 'vitest';
import {
  PROGRESSION_BALANCE,
  evaluateTenMinuteProgression,
  getCumulativeScrapForUpgradeCount,
  getScrapXpNeeded,
  getXpUpgradeCountForScrap
} from '../../src/balance/progression-balance.js';

describe('10-minute Scrap progression gate', () => {
  it('keeps early upgrades readable while steepening the late XP curve', () => {
    expect([1, 2, 3, 4, 5].map(getScrapXpNeeded)).toEqual([8, 13, 21, 31, 43]);
    expect(getScrapXpNeeded(10)).toBe(127);
    expect(getScrapXpNeeded(13)).toBe(196);
  });

  it('places the 10/11 and 12/13 upgrade boundaries around the observed Production windows', () => {
    expect(getCumulativeScrapForUpgradeCount(10)).toBe(567);
    expect(getCumulativeScrapForUpgradeCount(11)).toBe(715);
    expect(getCumulativeScrapForUpgradeCount(12)).toBe(886);
    expect(getCumulativeScrapForUpgradeCount(13)).toBe(1082);
  });

  it('replays the RUN-0047 ten-minute Scrap bounds as exactly 10 XP upgrades', () => {
    // RUN-0047 crossed old cumulative 575 Scrap at 531.564s and did not cross 659 until 632.411s.
    // Therefore its exact 600s Scrap total is bounded to [575, 658] without interpolation.
    for (const scrap of [575, 658]) {
      expect(getXpUpgradeCountForScrap(scrap)).toBe(10);
      expect(evaluateTenMinuteProgression(scrap)).toEqual({
        xpUpgrades: 10,
        eliteUpgrades: 2,
        totalUpgrades: 12,
        withinTarget: true
      });
    }
  });

  it('replays the RUN-0048 ten-minute Scrap bounds as exactly 12 XP upgrades', () => {
    // RUN-0048 crossed old cumulative 947 Scrap at 577.134s and did not cross 1055 until 622.486s.
    // Therefore its exact 600s Scrap total is bounded to [947, 1054] without interpolation.
    for (const scrap of [947, 1054]) {
      expect(getXpUpgradeCountForScrap(scrap)).toBe(12);
      expect(evaluateTenMinuteProgression(scrap)).toEqual({
        xpUpgrades: 12,
        eliteUpgrades: 2,
        totalUpgrades: 14,
        withinTarget: true
      });
    }
  });

  it('locks the first-slice target to 10–14 total upgrades including two Elite bonuses', () => {
    expect(PROGRESSION_BALANCE.runTargetSeconds).toBe(600);
    expect(PROGRESSION_BALANCE.targetTotalUpgrades).toEqual({ min: 10, max: 14 });
    expect(PROGRESSION_BALANCE.expectedEliteBonusUpgrades).toBe(2);
  });
});

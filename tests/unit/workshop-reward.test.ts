import { describe, expect, it } from 'vitest';
import {
  createWorkshopReward,
  WORKSHOP_REWARD_MAX_PER_RUN,
  WORKSHOP_SCRIP_CURRENCY_ID,
} from '../../src/progression/workshop-reward.js';

function result(survivedSeconds: number, runId = `run-${survivedSeconds}`) {
  return { runId, survivedSeconds };
}

describe('Workshop Scrip reward', () => {
  it('uses the approved bounded survival-only formula', () => {
    expect(createWorkshopReward(result(59)).amount).toBe(0);
    expect(createWorkshopReward(result(60))).toMatchObject({ amount: 1, eligible: true, currencyId: WORKSHOP_SCRIP_CURRENCY_ID });
    expect(createWorkshopReward(result(179)).amount).toBe(1);
    expect(createWorkshopReward(result(180)).amount).toBe(2);
    expect(createWorkshopReward(result(300)).amount).toBe(3);
    expect(createWorkshopReward(result(540)).amount).toBe(WORKSHOP_REWARD_MAX_PER_RUN);
    expect(createWorkshopReward(result(3600)).amount).toBe(WORKSHOP_REWARD_MAX_PER_RUN);
  });

  it('never rewards debug or autotest runs', () => {
    expect(createWorkshopReward(result(600), { isDebug: true })).toMatchObject({ amount: 0, eligible: false, reason: 'debug' });
    expect(createWorkshopReward(result(600), { isAutotest: true })).toMatchObject({ amount: 0, eligible: false, reason: 'autotest' });
  });

  it('does not use Scrap, level, kills or DPS as reward inputs', () => {
    const a = createWorkshopReward({ ...result(180, 'run-a'), scrap: 0, level: 1, kills: 0, dps: 0 });
    const b = createWorkshopReward({ ...result(180, 'run-b'), scrap: 99999, level: 99, kills: 999, dps: 99999 });
    expect(a.amount).toBe(2);
    expect(b.amount).toBe(2);
  });
});

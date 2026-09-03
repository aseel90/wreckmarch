export const WORKSHOP_SCRIP_CURRENCY_ID = 'workshop-scrip';
export const WORKSHOP_REWARD_VERSION = 1;
export const WORKSHOP_REWARD_MIN_SURVIVAL_SECONDS = 60;
export const WORKSHOP_REWARD_STEP_SECONDS = 120;
export const WORKSHOP_REWARD_MAX_PER_RUN = 5;

function nonNegativeInt(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
}

function frozenReward(result, amount, eligible, reason) {
  return Object.freeze({
    version: WORKSHOP_REWARD_VERSION,
    currencyId: WORKSHOP_SCRIP_CURRENCY_ID,
    runId: String(result.runId),
    amount: nonNegativeInt(amount),
    eligible: Boolean(eligible),
    reason,
  });
}

export function createWorkshopReward(result, { isDebug = false, isAutotest = false } = {}) {
  if (!result || typeof result !== 'object') throw new TypeError('createWorkshopReward requires a canonical run result');
  if (typeof result.runId !== 'string' || !result.runId) throw new TypeError('Workshop reward requires a canonical runId');

  if (isDebug || isAutotest) return frozenReward(result, 0, false, isAutotest ? 'autotest' : 'debug');

  const survivedSeconds = nonNegativeInt(result.survivedSeconds);
  if (survivedSeconds < WORKSHOP_REWARD_MIN_SURVIVAL_SECONDS) {
    return frozenReward(result, 0, false, 'minimum-survival');
  }

  const extraSteps = Math.floor((survivedSeconds - WORKSHOP_REWARD_MIN_SURVIVAL_SECONDS) / WORKSHOP_REWARD_STEP_SECONDS);
  const amount = Math.min(WORKSHOP_REWARD_MAX_PER_RUN, 1 + extraSteps);
  return frozenReward(result, amount, true, 'survival');
}

const MILESTONE_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'first-deployment', label: 'FIRST DEPLOYMENT', detail: 'Complete your first recorded run.', metric: 'totalRuns', target: 1, suffix: ' runs' }),
  Object.freeze({ id: 'scrap-hand', label: 'SCRAP HAND', detail: 'Reach Level 5 in a run.', metric: 'highestLevel', target: 5, suffix: ' level' }),
  Object.freeze({ id: 'stay-moving', label: 'STAY MOVING', detail: 'Survive for 2 minutes in one run.', metric: 'bestSurvivalSeconds', target: 120, suffix: 's' }),
  Object.freeze({ id: 'field-veteran', label: 'FIELD VETERAN', detail: 'Complete 10 recorded runs.', metric: 'totalRuns', target: 10, suffix: ' runs' }),
  Object.freeze({ id: 'long-haul', label: 'LONG HAUL', detail: 'Survive for 10 minutes in one run.', metric: 'bestSurvivalSeconds', target: 600, suffix: 's' }),
]);

const WORKSHOP_RANKS = Object.freeze([
  'UNTESTED',
  'SCAVENGER',
  'FIELD HAND',
  'ROAD PROVEN',
  'WRECK VETERAN',
  'WASTELAND HARDENED',
]);

function safeMetric(profile, metric) {
  const numeric = Number(profile?.[metric]);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
}

export function evaluateProgressionMilestones(profile = {}) {
  return Object.freeze(MILESTONE_DEFINITIONS.map(definition => {
    const current = safeMetric(profile, definition.metric);
    return Object.freeze({
      id: definition.id,
      label: definition.label,
      detail: definition.detail,
      current,
      target: definition.target,
      complete: current >= definition.target,
      progress: Math.min(1, current / definition.target),
      progressLabel: `${Math.min(current, definition.target)}/${definition.target}${definition.suffix}`,
    });
  }));
}

export function getWorkshopRank(profile = {}) {
  const milestones = evaluateProgressionMilestones(profile);
  const completed = milestones.filter(milestone => milestone.complete).length;
  return Object.freeze({
    label: WORKSHOP_RANKS[Math.min(completed, WORKSHOP_RANKS.length - 1)],
    completed,
    total: milestones.length,
  });
}

export function listProgressionMilestoneDefinitions() {
  return [...MILESTONE_DEFINITIONS];
}

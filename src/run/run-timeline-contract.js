/* WRECKMARCH R1 — canonical future-run timeline data contract. Data only: no spawning, rewards or encounter execution. */
import { RUN_BALANCE } from '../balance/run-balance.js?v=7';

export const R1_TIMELINE_CONTRACT_VERSION = 'r1-v1';
export const FUTURE_STANDARD_RUN_TIMELINE_ID = 'future-standard-25m-v1';
export const CURRENT_TEN_WAVE_REFERENCE_ID = 'current-10-wave-regression-v1';
export const STANDARD_EVENT_POOL_ID = 'standard-event-pool-v1';

/** @typedef {{ id: string, label: string, startSeconds: number, endSeconds: number, identity: string, endpointMilestoneId: string }} RunAct */
/** @typedef {{ id: string, actId: string, atSeconds: number, kind: string, encounterId: string, purpose: string, locksTimeline: boolean, eventPoolId: string | null }} EncounterMilestone */
/** @typedef {{ id: string, label: string, weight: number, roles: readonly string[], projectilePressure: string, notes: string }} EncounterEvent */
/** @typedef {{ activeMilestoneId?: string | null, activeEncounterId?: string | null, completedMilestoneIds?: string[] }} RunTimelineDiagnosticOptions */
/** @template T @param {T[]} items @returns {ReadonlyArray<Readonly<T>>} */
const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));
const text = (value, name) => {
  const result = String(value || '').trim();
  if (!result) throw new TypeError(`${name} is required`);
  return result;
};
const seconds = (value, name) => {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) throw new TypeError(`${name} must be a non-negative finite number`);
  return result;
};
const compactAct = act => act ? Object.freeze({ id: act.id, label: act.label, startSeconds: act.startSeconds, endSeconds: act.endSeconds, endpointMilestoneId: act.endpointMilestoneId }) : null;
const compactMilestone = milestone => milestone ? Object.freeze({ id: milestone.id, actId: milestone.actId, atSeconds: milestone.atSeconds, kind: milestone.kind, encounterId: milestone.encounterId, locksTimeline: milestone.locksTimeline, purpose: milestone.purpose }) : null;

/** @param {RunAct} input @returns {Readonly<RunAct>} */
export function defineRunAct(input) {
  const { id, label, startSeconds, endSeconds, identity, endpointMilestoneId } = input;
  const start = seconds(startSeconds, 'RunAct.startSeconds');
  const end = seconds(endSeconds, 'RunAct.endSeconds');
  if (end <= start) throw new TypeError('RunAct.endSeconds must be greater than startSeconds');
  return Object.freeze({
    id: text(id, 'RunAct.id'),
    label: text(label, 'RunAct.label'),
    startSeconds: start,
    endSeconds: end,
    identity: text(identity, 'RunAct.identity'),
    endpointMilestoneId: text(endpointMilestoneId, 'RunAct.endpointMilestoneId')
  });
}

/** @param {{ id: string, actId: string, atSeconds: number, kind: string, encounterId: string, purpose: string, locksTimeline?: boolean, eventPoolId?: string | null }} input @returns {Readonly<EncounterMilestone>} */
export function defineEncounterMilestone(input) {
  const { id, actId, atSeconds, kind, encounterId, purpose, locksTimeline = false, eventPoolId = null } = input;
  return Object.freeze({
    id: text(id, 'EncounterMilestone.id'),
    actId: text(actId, 'EncounterMilestone.actId'),
    atSeconds: seconds(atSeconds, 'EncounterMilestone.atSeconds'),
    kind: text(kind, 'EncounterMilestone.kind'),
    encounterId: text(encounterId, 'EncounterMilestone.encounterId'),
    purpose: text(purpose, 'EncounterMilestone.purpose'),
    locksTimeline: Boolean(locksTimeline),
    eventPoolId: eventPoolId == null ? null : text(eventPoolId, 'EncounterMilestone.eventPoolId')
  });
}

/** @param {{ id: string, label: string, weight?: number, roles?: string[], projectilePressure?: string, notes?: string }} input @returns {Readonly<EncounterEvent>} */
export function defineEncounterEvent(input) {
  const { id, label, weight = 1, roles = [], projectilePressure = 'normal', notes = '' } = input;
  const normalizedWeight = Number(weight);
  if (!Number.isFinite(normalizedWeight) || normalizedWeight <= 0) throw new TypeError('EncounterEvent.weight must be greater than zero');
  return Object.freeze({
    id: text(id, 'EncounterEvent.id'),
    label: text(label, 'EncounterEvent.label'),
    weight: normalizedWeight,
    roles: Object.freeze([...roles].map(role => text(role, 'EncounterEvent.role'))),
    projectilePressure: text(projectilePressure, 'EncounterEvent.projectilePressure'),
    notes: String(notes || '')
  });
}

/** @type {ReadonlyArray<Readonly<RunAct>>} */
export const FUTURE_RUN_ACTS = freezeList([
  defineRunAct({ id: 'act-1-scavenge', label: 'Act I — Scavenge', startSeconds: 0, endSeconds: 300, identity: 'Learn movement, swarm, hunter and first ranged pressure.', endpointMilestoneId: 'm01-wreck-hound-alpha' }),
  defineRunAct({ id: 'act-2-escalation', label: 'Act II — Escalation', startSeconds: 300, endSeconds: 600, identity: 'Scavenger ranged, kamikaze, events and first control Elite.', endpointMilestoneId: 'm02-boilerback' }),
  defineRunAct({ id: 'act-3-air-artillery', label: 'Act III — Air & Artillery', startSeconds: 600, endSeconds: 900, identity: 'Drone, artillery and support pressure.', endpointMilestoneId: 'b02-roadbreaker' }),
  defineRunAct({ id: 'act-4-heavy-hunt', label: 'Act IV — Heavy Hunt', startSeconds: 900, endSeconds: 1200, identity: 'Displacement, heavy melee and ambush pressure.', endpointMilestoneId: 'm03-chain-hauler' }),
  defineRunAct({ id: 'act-5-marshal-territory', label: 'Act V — Marshal Territory', startSeconds: 1200, endSeconds: 1500, identity: 'Late events, lane control, Final Surge and Final Boss transition.', endpointMilestoneId: 'b01-scrap-marshal' })
]);

/** @type {ReadonlyArray<Readonly<EncounterMilestone>>} */
export const FUTURE_ENCOUNTER_MILESTONES = freezeList([
  defineEncounterMilestone({ id: 'e01-scrap-rat', actId: 'act-1-scavenge', atSeconds: 0, kind: 'enemy-introduction', encounterId: 'enemy:scrap-rat', purpose: 'Readable start and basic movement/weapon loop.' }),
  defineEncounterMilestone({ id: 'e02-rust-hound', actId: 'act-1-scavenge', atSeconds: 75, kind: 'enemy-introduction', encounterId: 'enemy:rust-hound', purpose: 'Punish stationary play.' }),
  defineEncounterMilestone({ id: 'e03-sawbug', actId: 'act-1-scavenge', atSeconds: 150, kind: 'enemy-introduction', encounterId: 'enemy:sawbug', purpose: 'Introduce ranged positioning.' }),
  defineEncounterMilestone({ id: 'champion-rust-hound', actId: 'act-1-scavenge', atSeconds: 210, kind: 'champion', encounterId: 'champion:armored-rust-hound', purpose: 'Early attention spike.' }),
  defineEncounterMilestone({ id: 'm01-wreck-hound-alpha', actId: 'act-1-scavenge', atSeconds: 300, kind: 'mini-boss', encounterId: 'boss:m01-wreck-hound-alpha', purpose: 'Act I build check and milestone reward.', locksTimeline: true }),
  defineEncounterMilestone({ id: 'e04-wreckling', actId: 'act-2-escalation', atSeconds: 330, kind: 'enemy-introduction', encounterId: 'enemy:wreckling', purpose: 'Open the scavenger ranged family.' }),
  defineEncounterMilestone({ id: 'e05-fuse-tick', actId: 'act-2-escalation', atSeconds: 405, kind: 'enemy-introduction', encounterId: 'enemy:fuse-tick', purpose: 'Introduce kamikaze target priority.' }),
  defineEncounterMilestone({ id: 'event-slot-early', actId: 'act-2-escalation', atSeconds: 450, kind: 'event-slot', encounterId: 'event-slot:early', purpose: 'Pattern break with weighted event selection.', eventPoolId: STANDARD_EVENT_POOL_ID }),
  defineEncounterMilestone({ id: 'e10-magnet-warden', actId: 'act-2-escalation', atSeconds: 510, kind: 'elite', encounterId: 'elite:magnet-warden', purpose: 'First major control Elite.' }),
  defineEncounterMilestone({ id: 'm02-boilerback', actId: 'act-2-escalation', atSeconds: 600, kind: 'mini-boss', encounterId: 'boss:m02-boilerback', purpose: 'Act II endpoint and area-denial check.', locksTimeline: true }),
  defineEncounterMilestone({ id: 'e06-scrap-drone', actId: 'act-3-air-artillery', atSeconds: 630, kind: 'enemy-introduction', encounterId: 'enemy:scrap-drone', purpose: 'Introduce the aerial layer.' }),
  defineEncounterMilestone({ id: 'e07-pipe-crawler', actId: 'act-3-air-artillery', atSeconds: 720, kind: 'enemy-introduction', encounterId: 'enemy:pipe-crawler', purpose: 'Introduce artillery and ground reading.' }),
  defineEncounterMilestone({ id: 'e12-signal-herald', actId: 'act-3-air-artillery', atSeconds: 810, kind: 'elite', encounterId: 'elite:signal-herald', purpose: 'Support-priority target.' }),
  defineEncounterMilestone({ id: 'b02-roadbreaker', actId: 'act-3-air-artillery', atSeconds: 900, kind: 'major-boss', encounterId: 'boss:b02-roadbreaker', purpose: 'First full locked Boss Arena.', locksTimeline: true }),
  defineEncounterMilestone({ id: 'e08-hook-raider', actId: 'act-4-heavy-hunt', atSeconds: 930, kind: 'enemy-introduction', encounterId: 'enemy:hook-raider', purpose: 'Introduce displacement and charge pressure.' }),
  defineEncounterMilestone({ id: 'e09-rivet-brute', actId: 'act-4-heavy-hunt', atSeconds: 1020, kind: 'enemy-introduction', encounterId: 'enemy:rivet-brute', purpose: 'Heavy melee and space consumption.' }),
  defineEncounterMilestone({ id: 'e11-ash-stalker', actId: 'act-4-heavy-hunt', atSeconds: 1110, kind: 'elite', encounterId: 'elite:ash-stalker', purpose: 'Ambush rhythm change.' }),
  defineEncounterMilestone({ id: 'm03-chain-hauler', actId: 'act-4-heavy-hunt', atSeconds: 1200, kind: 'mini-boss', encounterId: 'boss:m03-chain-hauler', purpose: 'Late-build positioning check.', locksTimeline: true }),
  defineEncounterMilestone({ id: 'event-slot-late', actId: 'act-5-marshal-territory', atSeconds: 1290, kind: 'event-slot', encounterId: 'event-slot:late', purpose: 'Break late-game repetition.', eventPoolId: STANDARD_EVENT_POOL_ID }),
  defineEncounterMilestone({ id: 'e13-arc-warden', actId: 'act-5-marshal-territory', atSeconds: 1350, kind: 'elite', encounterId: 'elite:arc-warden', purpose: 'Lane-control pressure without projectile spam.' }),
  defineEncounterMilestone({ id: 'final-surge', actId: 'act-5-marshal-territory', atSeconds: 1410, kind: 'director-phase', encounterId: 'director:final-surge', purpose: 'Controlled climax before the final arena.' }),
  defineEncounterMilestone({ id: 'final-boss-transition', actId: 'act-5-marshal-territory', atSeconds: 1470, kind: 'boss-transition', encounterId: 'transition:final-boss', purpose: 'Warning, enemy retreat and recovery before the Final Boss.', locksTimeline: true }),
  defineEncounterMilestone({ id: 'b01-scrap-marshal', actId: 'act-5-marshal-territory', atSeconds: 1500, kind: 'final-boss', encounterId: 'boss:b01-scrap-marshal', purpose: 'Final Boss; defeat completes the standard run.', locksTimeline: true })
]);

/** @type {ReadonlyArray<Readonly<EncounterEvent>>} */
export const FUTURE_ENCOUNTER_EVENTS = freezeList([
  defineEncounterEvent({ id: 'swarm-break', label: 'SWARM BREAK', roles: ['swarm'], projectilePressure: 'low', notes: 'Short Rat-heavy flood with very little ranged pressure.' }),
  defineEncounterEvent({ id: 'hunter-pack', label: 'HUNTER PACK', roles: ['hunter', 'displacement'], projectilePressure: 'low', notes: 'Lower raw count with higher movement demand.' }),
  defineEncounterEvent({ id: 'crossfire', label: 'CROSSFIRE', roles: ['basic-ranged', 'ranged-spitter'], projectilePressure: 'medium', notes: 'Limited crossfire pressure with readable lanes.' }),
  defineEncounterEvent({ id: 'demolition-wave', label: 'DEMOLITION WAVE', roles: ['kamikaze', 'melee-screen'], projectilePressure: 'low', notes: 'Fuse Ticks behind a melee screen.' }),
  defineEncounterEvent({ id: 'drone-sweep', label: 'DRONE SWEEP', roles: ['flying', 'swarm'], projectilePressure: 'medium', notes: 'Aerial harassment plus ground swarm without artillery overload.' }),
  defineEncounterEvent({ id: 'artillery-lockdown', label: 'ARTILLERY LOCKDOWN', roles: ['artillery', 'melee-screen'], projectilePressure: 'high-controlled', notes: 'One/few artillery units with clear ground telegraphs.' })
]);

export const FUTURE_EVENT_RULES = Object.freeze({
  poolId: STANDARD_EVENT_POOL_ID,
  weightedRandom: true,
  noImmediateRepeat: true,
  tailorToIdealBuild: false,
  respectRoleBudgets: true,
  respectProjectilePerformanceBudgets: true
});

export const CURRENT_TEN_WAVE_REFERENCE = Object.freeze({
  id: CURRENT_TEN_WAVE_REFERENCE_ID,
  source: 'RUN_BALANCE',
  mode: 'production-regression-reference',
  durationSeconds: RUN_BALANCE.runDurationSeconds,
  waveDurationSeconds: RUN_BALANCE.waveDurationSeconds,
  waveCount: RUN_BALANCE.waves.length,
  waves: freezeList(RUN_BALANCE.waves.map((wave, index) => ({
    wave: wave.wave,
    startSeconds: index * RUN_BALANCE.waveDurationSeconds,
    endSeconds: (index + 1) * RUN_BALANCE.waveDurationSeconds,
    threatBudget: wave.threatBudget,
    activeCap: wave.activeCap,
    spawnIntervalMs: wave.spawnIntervalMs,
    hpMultiplier: wave.hpMultiplier,
    damageMultiplier: wave.damageMultiplier,
    speedMultiplier: wave.speedMultiplier,
    enemyPool: freezeList(RUN_BALANCE.enemyPools[index].entries.map(entry => ({ ...entry })))
  })))
});

export const FUTURE_STANDARD_RUN_TIMELINE = Object.freeze({
  id: FUTURE_STANDARD_RUN_TIMELINE_ID,
  contractVersion: R1_TIMELINE_CONTRACT_VERSION,
  mode: 'r1-data-preview',
  targetDurationSeconds: 1500,
  acts: FUTURE_RUN_ACTS,
  milestones: FUTURE_ENCOUNTER_MILESTONES,
  eventPool: FUTURE_ENCOUNTER_EVENTS,
  eventRules: FUTURE_EVENT_RULES,
  referenceScenario: CURRENT_TEN_WAVE_REFERENCE
});

function findActById(id) { return FUTURE_RUN_ACTS.find(act => act.id === id) || null; }
function findMilestoneById(id) { return FUTURE_ENCOUNTER_MILESTONES.find(milestone => milestone.id === id) || null; }

function resolveNominalAct(elapsedSeconds) {
  const exactEndpoint = FUTURE_RUN_ACTS.find(act => {
    const endpoint = findMilestoneById(act.endpointMilestoneId);
    return endpoint && endpoint.atSeconds === elapsedSeconds;
  });
  if (exactEndpoint) return exactEndpoint;
  return FUTURE_RUN_ACTS.find((act, index) => elapsedSeconds >= act.startSeconds && (elapsedSeconds < act.endSeconds || (index === FUTURE_RUN_ACTS.length - 1 && elapsedSeconds <= act.endSeconds)))
    || FUTURE_RUN_ACTS[FUTURE_RUN_ACTS.length - 1]
    || null;
}

/** @param {number} [runTimeSeconds=0] @param {RunTimelineDiagnosticOptions} [options] */
export function getRunTimelineDiagnostics(runTimeSeconds = 0, options = {}) {
  const {
    activeMilestoneId = null,
    activeEncounterId = null,
    completedMilestoneIds = []
  } = options;
  const elapsedSeconds = Math.max(0, Number(runTimeSeconds) || 0);
  const completed = new Set(Array.isArray(completedMilestoneIds) ? completedMilestoneIds : []);
  const activeMilestone = activeMilestoneId ? findMilestoneById(activeMilestoneId) : null;
  const blocksTimeline = Boolean(activeMilestone?.locksTimeline && !completed.has(activeMilestone.id));
  const nominalAct = resolveNominalAct(elapsedSeconds);
  const currentAct = blocksTimeline ? findActById(activeMilestone.actId) : nominalAct;
  const previousMilestone = [...FUTURE_ENCOUNTER_MILESTONES].reverse().find(milestone => milestone.atSeconds <= elapsedSeconds) || null;
  const nextMilestone = FUTURE_ENCOUNTER_MILESTONES.find(milestone => milestone.atSeconds > elapsedSeconds && !completed.has(milestone.id)) || null;
  const nextEvent = FUTURE_ENCOUNTER_MILESTONES.find(milestone => milestone.kind === 'event-slot' && milestone.atSeconds > elapsedSeconds && !completed.has(milestone.id)) || null;
  const referenceWave = Math.min(CURRENT_TEN_WAVE_REFERENCE.waveCount, Math.floor(elapsedSeconds / CURRENT_TEN_WAVE_REFERENCE.waveDurationSeconds) + 1);
  const encounterState = blocksTimeline ? 'locked' : (activeEncounterId || activeMilestoneId ? 'active' : 'idle');

  return Object.freeze({
    contractVersion: R1_TIMELINE_CONTRACT_VERSION,
    timelineId: FUTURE_STANDARD_RUN_TIMELINE_ID,
    mode: FUTURE_STANDARD_RUN_TIMELINE.mode,
    elapsedSeconds: Number(elapsedSeconds.toFixed(3)),
    currentAct: compactAct(currentAct),
    previousMilestone: compactMilestone(previousMilestone),
    nextMilestone: compactMilestone(nextMilestone),
    nextEvent: compactMilestone(nextEvent),
    activeMilestoneId: activeMilestone?.id || null,
    activeEncounterId: activeEncounterId || activeMilestone?.encounterId || null,
    encounterState,
    timelineBlocked: blocksTimeline,
    blockedByMilestoneId: blocksTimeline ? activeMilestone.id : null,
    eventPoolId: STANDARD_EVENT_POOL_ID,
    referenceScenario: Object.freeze({
      id: CURRENT_TEN_WAVE_REFERENCE_ID,
      wave: referenceWave,
      waveCount: CURRENT_TEN_WAVE_REFERENCE.waveCount,
      durationSeconds: CURRENT_TEN_WAVE_REFERENCE.durationSeconds
    })
  });
}

export function validateRunTimelineContract() {
  const errors = [];
  const unique = (items, label) => {
    const ids = items.map(item => item.id);
    if (new Set(ids).size !== ids.length) errors.push(`${label} ids must be unique`);
  };
  unique(FUTURE_RUN_ACTS, 'RunAct');
  unique(FUTURE_ENCOUNTER_MILESTONES, 'EncounterMilestone');
  unique(FUTURE_ENCOUNTER_EVENTS, 'EncounterEvent');

  for (let index = 0; index < FUTURE_RUN_ACTS.length; index += 1) {
    const act = FUTURE_RUN_ACTS[index];
    const previous = FUTURE_RUN_ACTS[index - 1];
    if (previous && previous.endSeconds !== act.startSeconds) errors.push(`RunAct windows must be contiguous at ${act.id}`);
    const endpoint = findMilestoneById(act.endpointMilestoneId);
    if (!endpoint) errors.push(`RunAct endpoint missing for ${act.id}`);
    else {
      if (endpoint.actId !== act.id) errors.push(`RunAct endpoint owner mismatch for ${act.id}`);
      if (endpoint.atSeconds !== act.endSeconds) errors.push(`RunAct endpoint time mismatch for ${act.id}`);
      if (!endpoint.locksTimeline) errors.push(`RunAct endpoint must lock timeline for ${act.id}`);
    }
  }

  let previousTime = -Infinity;
  for (const milestone of FUTURE_ENCOUNTER_MILESTONES) {
    if (!findActById(milestone.actId)) errors.push(`Unknown RunAct owner for ${milestone.id}`);
    if (milestone.atSeconds < previousTime) errors.push(`EncounterMilestone order is not monotonic at ${milestone.id}`);
    previousTime = milestone.atSeconds;
    if (milestone.kind === 'event-slot' && milestone.eventPoolId !== STANDARD_EVENT_POOL_ID) errors.push(`Event slot pool mismatch for ${milestone.id}`);
  }

  if (CURRENT_TEN_WAVE_REFERENCE.waveCount !== 10) errors.push('Current regression reference must retain 10 waves');
  if (CURRENT_TEN_WAVE_REFERENCE.durationSeconds !== 600) errors.push('Current regression reference must retain the 600s duration');
  if (FUTURE_STANDARD_RUN_TIMELINE.targetDurationSeconds !== 1500) errors.push('Future standard target must remain 1500s until tuning changes it explicitly');
  if (!FUTURE_EVENT_RULES.noImmediateRepeat || !FUTURE_EVENT_RULES.weightedRandom) errors.push('Event pool anti-repetition/weighted-random rules are required');

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export const R1_TIMELINE_CONTRACT_VALIDATION = validateRunTimelineContract();
if (!R1_TIMELINE_CONTRACT_VALIDATION.ok) throw new Error(`Invalid R1 run timeline contract: ${R1_TIMELINE_CONTRACT_VALIDATION.errors.join('; ')}`);
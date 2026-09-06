/* WRECKMARCH R1 — measurement-only future-run timeline diagnostics. Never owns spawning, rewards, combat or wave pacing. */
import {
  CURRENT_TEN_WAVE_REFERENCE_ID,
  FUTURE_STANDARD_RUN_TIMELINE_ID,
  R1_TIMELINE_CONTRACT_VERSION,
  getRunTimelineDiagnostics
} from './run-timeline-contract.js?v=1';

const MAX_TIMELINE_TRANSITIONS = 64;

function readOptionalEncounterContext(scene) {
  const source = scene?.__runTimelineEncounterContext;
  if (!source || typeof source !== 'object') return {};
  return {
    activeMilestoneId: source.activeMilestoneId || null,
    activeEncounterId: source.activeEncounterId || null,
    completedMilestoneIds: Array.isArray(source.completedMilestoneIds) ? source.completedMilestoneIds : []
  };
}

function transitionKey(snapshot) {
  return [
    snapshot.currentAct?.id || '',
    snapshot.previousMilestone?.id || '',
    snapshot.nextMilestone?.id || '',
    snapshot.nextEvent?.id || '',
    snapshot.activeMilestoneId || '',
    snapshot.activeEncounterId || '',
    snapshot.encounterState || '',
    snapshot.blockedByMilestoneId || ''
  ].join('|');
}

function compactTransition(snapshot) {
  return Object.freeze({
    atSeconds: snapshot.elapsedSeconds,
    actId: snapshot.currentAct?.id || null,
    previousMilestoneId: snapshot.previousMilestone?.id || null,
    nextMilestoneId: snapshot.nextMilestone?.id || null,
    nextEventId: snapshot.nextEvent?.id || null,
    activeMilestoneId: snapshot.activeMilestoneId || null,
    activeEncounterId: snapshot.activeEncounterId || null,
    encounterState: snapshot.encounterState,
    timelineBlocked: snapshot.timelineBlocked,
    blockedByMilestoneId: snapshot.blockedByMilestoneId || null
  });
}

function ensureTelemetryTimeline(scene, runtime) {
  const telemetry = scene?.runTelemetry;
  const report = telemetry?.report;
  if (!report || typeof report !== 'object' || telemetry?.finalized) return null;
  const reportId = String(report.reportId || telemetry.reportId || '');
  if (runtime.reportId !== reportId) {
    runtime.reportId = reportId;
    runtime.lastTransitionKey = '';
    report.timeline = {
      contractVersion: R1_TIMELINE_CONTRACT_VERSION,
      targetTimelineId: FUTURE_STANDARD_RUN_TIMELINE_ID,
      referenceScenarioId: CURRENT_TEN_WAVE_REFERENCE_ID,
      referenceWaveCount: 10,
      transitions: [],
      current: null
    };
  } else if (!report.timeline || report.timeline.contractVersion !== R1_TIMELINE_CONTRACT_VERSION) {
    report.timeline = {
      contractVersion: R1_TIMELINE_CONTRACT_VERSION,
      targetTimelineId: FUTURE_STANDARD_RUN_TIMELINE_ID,
      referenceScenarioId: CURRENT_TEN_WAVE_REFERENCE_ID,
      referenceWaveCount: 10,
      transitions: [],
      current: null
    };
    runtime.lastTransitionKey = '';
  }
  return report.timeline;
}

function syncTimelineRuntime(scene, runtime) {
  const snapshot = getRunTimelineDiagnostics(scene?.runTime || 0, readOptionalEncounterContext(scene));
  scene.__runTimelineState = snapshot;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.dataset.wreckmarchRunTimeline = R1_TIMELINE_CONTRACT_VERSION;
    root.dataset.wreckmarchRunAct = snapshot.currentAct?.id || '';
    root.dataset.wreckmarchNextMilestone = snapshot.nextMilestone?.id || '';
    root.dataset.wreckmarchEncounterState = snapshot.encounterState;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.__WM_RUN_TIMELINE__ = { active: true, ...snapshot };
  }

  const telemetryTimeline = ensureTelemetryTimeline(scene, runtime);
  if (telemetryTimeline) {
    telemetryTimeline.current = snapshot;
    const key = transitionKey(snapshot);
    if (key !== runtime.lastTransitionKey) {
      runtime.lastTransitionKey = key;
      if (telemetryTimeline.transitions.length < MAX_TIMELINE_TRANSITIONS) telemetryTimeline.transitions.push(compactTransition(snapshot));
    }
  }
  return snapshot;
}

export function installRunTimelineRuntime(scene) {
  if (!scene) return false;
  if (scene.__runTimelineRuntime?.version === R1_TIMELINE_CONTRACT_VERSION) {
    syncTimelineRuntime(scene, scene.__runTimelineRuntime);
    return true;
  }

  scene.__runTimelineRuntime?.tick?.remove?.(false);
  const runtime = {
    version: R1_TIMELINE_CONTRACT_VERSION,
    reportId: '',
    lastTransitionKey: '',
    tick: null,
    sync: () => syncTimelineRuntime(scene, runtime)
  };
  scene.__runTimelineRuntime = runtime;
  runtime.sync();
  runtime.tick = scene.time?.addEvent?.({ delay: 1000, loop: true, callback: runtime.sync }) || null;
  globalThis.__WM_LOG__?.('R1 Run Timeline diagnostics active: data-only 25m target + canonical 10-wave regression reference');
  return true;
}

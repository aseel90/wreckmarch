import { describe, expect, it } from 'vitest';
import { RUN_BALANCE } from '../../src/balance/run-balance.js';
import {
  CURRENT_TEN_WAVE_REFERENCE,
  FUTURE_ENCOUNTER_EVENTS,
  FUTURE_ENCOUNTER_MILESTONES,
  FUTURE_EVENT_RULES,
  FUTURE_RUN_ACTS,
  FUTURE_STANDARD_RUN_TIMELINE,
  R1_TIMELINE_CONTRACT_VALIDATION,
  defineEncounterEvent,
  defineEncounterMilestone,
  defineRunAct,
  getRunTimelineDiagnostics
} from '../../src/run/run-timeline-contract.js';

describe('R1 future-run timeline data contract', () => {
  it('freezes validated RunAct / EncounterMilestone / EncounterEvent structures', () => {
    const act = defineRunAct({ id: 'a', label: 'A', startSeconds: 0, endSeconds: 10, identity: 'test', endpointMilestoneId: 'm' });
    const milestone = defineEncounterMilestone({ id: 'm', actId: 'a', atSeconds: 10, kind: 'boss', encounterId: 'boss:test', purpose: 'test', locksTimeline: true });
    const event = defineEncounterEvent({ id: 'event', label: 'EVENT', weight: 2, roles: ['swarm'] });
    expect(Object.isFrozen(act)).toBe(true);
    expect(Object.isFrozen(milestone)).toBe(true);
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.roles)).toBe(true);
    expect(() => defineRunAct({ id: 'bad', label: 'Bad', startSeconds: 10, endSeconds: 10, identity: 'bad', endpointMilestoneId: 'm' })).toThrow();
  });

  it('describes five contiguous 25-minute acts with unique ordered milestones and locked endpoints', () => {
    expect(R1_TIMELINE_CONTRACT_VALIDATION).toEqual({ ok: true, errors: [] });
    expect(FUTURE_STANDARD_RUN_TIMELINE.targetDurationSeconds).toBe(1500);
    expect(FUTURE_RUN_ACTS).toHaveLength(5);
    expect(FUTURE_RUN_ACTS[0]).toMatchObject({ startSeconds: 0, endSeconds: 300, endpointMilestoneId: 'm01-wreck-hound-alpha' });
    expect(FUTURE_RUN_ACTS[4]).toMatchObject({ startSeconds: 1200, endSeconds: 1500, endpointMilestoneId: 'b01-scrap-marshal' });
    for (let index = 1; index < FUTURE_RUN_ACTS.length; index += 1) expect(FUTURE_RUN_ACTS[index].startSeconds).toBe(FUTURE_RUN_ACTS[index - 1].endSeconds);
    const ids = FUTURE_ENCOUNTER_MILESTONES.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const times = FUTURE_ENCOUNTER_MILESTONES.map(item => item.atSeconds);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const act of FUTURE_RUN_ACTS) {
      const endpoint = FUTURE_ENCOUNTER_MILESTONES.find(item => item.id === act.endpointMilestoneId);
      expect(endpoint).toMatchObject({ actId: act.id, atSeconds: act.endSeconds, locksTimeline: true });
    }
  });

  it('keeps the current production 10-wave curve as a live reference instead of copying another balance owner', () => {
    expect(CURRENT_TEN_WAVE_REFERENCE).toMatchObject({ durationSeconds: 600, waveDurationSeconds: 60, waveCount: 10, source: 'RUN_BALANCE' });
    expect(CURRENT_TEN_WAVE_REFERENCE.durationSeconds).toBe(RUN_BALANCE.runDurationSeconds);
    expect(CURRENT_TEN_WAVE_REFERENCE.waves[0]).toMatchObject({ wave: 1, threatBudget: RUN_BALANCE.waves[0].threatBudget, enemyPool: RUN_BALANCE.enemyPools[0].entries });
    expect(CURRENT_TEN_WAVE_REFERENCE.waves[9]).toMatchObject({ wave: 10, threatBudget: RUN_BALANCE.waves[9].threatBudget, enemyPool: RUN_BALANCE.enemyPools[9].entries });
  });

  it('resolves nominal act/milestone/event diagnostics without hard-coded minute branches', () => {
    expect(getRunTimelineDiagnostics(0)).toMatchObject({ currentAct: { id: 'act-1-scavenge' }, previousMilestone: { id: 'e01-scrap-rat' }, nextMilestone: { id: 'e02-rust-hound' }, nextEvent: { id: 'event-slot-early' }, referenceScenario: { wave: 1, waveCount: 10 } });
    expect(getRunTimelineDiagnostics(300)).toMatchObject({ currentAct: { id: 'act-1-scavenge' }, previousMilestone: { id: 'm01-wreck-hound-alpha' }, nextMilestone: { id: 'e04-wreckling' } });
    expect(getRunTimelineDiagnostics(300.1)).toMatchObject({ currentAct: { id: 'act-2-escalation' } });
    expect(getRunTimelineDiagnostics(1490)).toMatchObject({ currentAct: { id: 'act-5-marshal-territory' }, previousMilestone: { id: 'final-boss-transition' }, nextMilestone: { id: 'b01-scrap-marshal' }, referenceScenario: { wave: 10 } });
  });

  it('can hold an act behind an unresolved locking encounter and release it after completion', () => {
    const locked = getRunTimelineDiagnostics(305, { activeMilestoneId: 'm01-wreck-hound-alpha', activeEncounterId: 'boss:m01-wreck-hound-alpha' });
    expect(locked).toMatchObject({ currentAct: { id: 'act-1-scavenge' }, encounterState: 'locked', timelineBlocked: true, blockedByMilestoneId: 'm01-wreck-hound-alpha' });
    const released = getRunTimelineDiagnostics(305, { activeMilestoneId: 'm01-wreck-hound-alpha', completedMilestoneIds: ['m01-wreck-hound-alpha'] });
    expect(released).toMatchObject({ currentAct: { id: 'act-2-escalation' }, encounterState: 'active', timelineBlocked: false });
  });

  it('freezes the approved weighted event pool rules without build-tailored offers', () => {
    expect(FUTURE_ENCOUNTER_EVENTS.map(event => event.label)).toEqual(['SWARM BREAK', 'HUNTER PACK', 'CROSSFIRE', 'DEMOLITION WAVE', 'DRONE SWEEP', 'ARTILLERY LOCKDOWN']);
    expect(FUTURE_EVENT_RULES).toMatchObject({ weightedRandom: true, noImmediateRepeat: true, tailorToIdealBuild: false, respectRoleBudgets: true, respectProjectilePerformanceBudgets: true });
  });
});

import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';
import { installRunTimelineRuntime } from '../../src/run/run-timeline-runtime.js';

function fakeScene() {
  const tick: any = { removed: false, remove() { this.removed = true; } };
  const scene: any = {
    runTime: 0,
    spawnEnemy: () => 'canonical-spawn',
    runDirector: { version: 'balance-v6' },
    runTelemetry: { report: { reportId: 'run-a' } },
    time: { addEvent: ({ callback }: any) => { scene.__tickCallback = callback; return tick; } }
  };
  return { scene, tick };
}

afterEach(() => {
  delete (globalThis as any).__WM_RUN_TIMELINE__;
});

describe('R1 run timeline diagnostics runtime', () => {
  it('attaches diagnostics and additive telemetry without replacing RunDirector or spawn ownership', () => {
    const { scene } = fakeScene();
    const spawn = scene.spawnEnemy;
    const director = scene.runDirector;
    expect(installRunTimelineRuntime(scene)).toBe(true);
    expect(scene.spawnEnemy).toBe(spawn);
    expect(scene.runDirector).toBe(director);
    expect(scene.__runTimelineState).toMatchObject({ contractVersion: 'r1-v1', currentAct: { id: 'act-1-scavenge' }, nextMilestone: { id: 'e02-rust-hound' } });
    expect((globalThis as any).__WM_RUN_TIMELINE__).toMatchObject({ active: true, contractVersion: 'r1-v1' });
    expect(scene.runTelemetry.report.timeline).toMatchObject({ contractVersion: 'r1-v1', targetTimelineId: 'future-standard-25m-v1', referenceScenarioId: 'current-10-wave-regression-v1', referenceWaveCount: 10, current: { currentAct: { id: 'act-1-scavenge' } } });
    expect(scene.runTelemetry.report.timeline.transitions).toHaveLength(1);
  });

  it('records timeline transitions only when the diagnostic state changes', () => {
    const { scene } = fakeScene();
    installRunTimelineRuntime(scene);
    scene.runTime = 10;
    scene.__runTimelineRuntime.sync();
    expect(scene.runTelemetry.report.timeline.transitions).toHaveLength(1);
    scene.runTime = 76;
    scene.__runTimelineRuntime.sync();
    expect(scene.runTelemetry.report.timeline.transitions).toHaveLength(2);
    expect(scene.runTelemetry.report.timeline.transitions[1]).toMatchObject({ previousMilestoneId: 'e02-rust-hound', nextMilestoneId: 'e03-sawbug' });
  });

  it('resets the telemetry transition sequence when a new report session appears', () => {
    const { scene } = fakeScene();
    installRunTimelineRuntime(scene);
    scene.runTime = 76;
    scene.__runTimelineRuntime.sync();
    expect(scene.runTelemetry.report.timeline.transitions).toHaveLength(2);
    scene.runTelemetry.report = { reportId: 'run-b' };
    scene.runTime = 0;
    scene.__runTimelineRuntime.sync();
    expect(scene.runTelemetry.report.timeline.transitions).toHaveLength(1);
    expect(scene.runTelemetry.report.timeline.current.elapsedSeconds).toBe(0);
  });

  it('keeps timeline runtime measurement-only and leaves RunDirector as the gameplay owner', async () => {
    const runtimeSource = await readFile(new URL('../../src/run/run-timeline-runtime.js', import.meta.url), 'utf8');
    const phaseE1Source = await readFile(new URL('../../src/phase-e1-runtime.js', import.meta.url), 'utf8');
    expect(runtimeSource).not.toContain('scene.spawnEnemy =');
    expect(runtimeSource).not.toContain('scene.waveEvent =');
    expect(runtimeSource).not.toContain('threatBudget =');
    expect(runtimeSource).not.toContain('spawnIntervalMs =');
    expect(phaseE1Source).toContain('applyRunDirector(s);installRunTimelineRuntime(s);');
  });

  it('accepts future encounter context as read-only input for lock diagnostics', () => {
    const { scene } = fakeScene();
    scene.runTime = 305;
    scene.__runTimelineEncounterContext = { activeMilestoneId: 'm01-wreck-hound-alpha', activeEncounterId: 'boss:m01-wreck-hound-alpha', completedMilestoneIds: [] };
    installRunTimelineRuntime(scene);
    expect(scene.__runTimelineState).toMatchObject({ currentAct: { id: 'act-1-scavenge' }, timelineBlocked: true, encounterState: 'locked' });
  });
});

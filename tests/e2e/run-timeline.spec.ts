import { expect, test } from '@playwright/test';

test('R1 exposes the future-run timeline as diagnostics without replacing the production RunDirector', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const timeline = (window as any).__WM_RUN_TIMELINE__;
    return {
      timeline,
      sceneTimeline: scene?.__runTimelineState,
      telemetryTimeline: scene?.runTelemetry?.getReport?.()?.timeline,
      director: (window as any).__WM_RUN_DIRECTOR__,
      dataset: document.documentElement.dataset.wreckmarchRunTimeline,
      actDataset: document.documentElement.dataset.wreckmarchRunAct
    };
  });

  expect(state.timeline).toMatchObject({
    active: true,
    contractVersion: 'r1-v1',
    timelineId: 'future-standard-25m-v1',
    currentAct: { id: 'act-1-scavenge' },
    referenceScenario: { id: 'current-10-wave-regression-v1', waveCount: 10, durationSeconds: 600 }
  });
  expect(state.sceneTimeline).toMatchObject({ contractVersion: 'r1-v1', currentAct: { id: 'act-1-scavenge' } });
  expect(state.telemetryTimeline).toMatchObject({
    contractVersion: 'r1-v1',
    targetTimelineId: 'future-standard-25m-v1',
    referenceScenarioId: 'current-10-wave-regression-v1',
    referenceWaveCount: 10,
    current: { currentAct: { id: 'act-1-scavenge' } }
  });
  expect(state.telemetryTimeline.transitions.length).toBeGreaterThan(0);
  expect(state.director).toMatchObject({ active: true, version: 'balance-v6' });
  expect(state.dataset).toBe('r1-v1');
  expect(state.actDataset).toBe('act-1-scavenge');
});

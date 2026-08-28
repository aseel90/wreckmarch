import { expect, test } from '@playwright/test';

test('Sawbug holds range and fires the baked acid projectile', async ({ page }) => {
  await page.goto('/?debug=1&sawbugtest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const sawbug = scene?.enemies?.getChildren?.().find((enemy: any) => enemy?.active && enemy.enemyId === 'sawbug');
      if (!scene || !sawbug) return false;
      scene.hero?.setPosition?.(360, 480);
      scene.hero?.setVelocity?.(0, 0);
      sawbug.setPosition?.(130, 480);
      sawbug.setVelocity?.(0, 0);
      sawbug.speed = 0;
      sawbug.behaviorConfig = {
        ...(sawbug.behaviorConfig || {}),
        initialCooldownMinMs: 0,
        initialCooldownMaxMs: 0,
        strafeSpeedMultiplier: 0,
        approachSpeedMultiplier: 0,
        retreatSpeedMultiplier: 0
      };
      if (sawbug.__sawbugState) {
        sawbug.__sawbugState.phase = 'move';
        sawbug.__sawbugState.cooldownUntil = Number(scene.time?.now) || 0;
        sawbug.__sawbugPhase = 'move';
      }
      return true;
    }),
    { timeout: 5_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest || ''),
    { timeout: 12_000 }
  ).toMatch(/^(passed|failed)$/);

  const state = await page.evaluate(() => (window as typeof window & { __WM_SAWBUG_TEST__?: any }).__WM_SAWBUG_TEST__);
  console.log('SAWBUG_SELF_TEST_STATE', JSON.stringify(state));
  expect(state, JSON.stringify(state)).toMatchObject({
    ok: true,
    active: true,
    visual: true,
    bakedFrames: true,
    transparentMaster: true,
    behavior: true,
    threat: true,
    shots: true,
    projectileRuntime: true,
    projectileSpeed: true
  });
  expect(Number(state.acidSpawned)).toBeGreaterThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest)).toBe('passed');
});

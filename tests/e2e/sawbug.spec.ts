import { expect, test } from '@playwright/test';

test('Sawbug holds range and fires the baked acid projectile', async ({ page }) => {
  await page.goto('/?debug=1&sawbugtest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest),
    { timeout: 8_000 }
  ).toBe('passed');

  const state = await page.evaluate(() => (window as typeof window & { __WM_SAWBUG_TEST__?: any }).__WM_SAWBUG_TEST__);
  expect(state).toMatchObject({
    ok: true,
    visual: true,
    bakedFrames: true,
    transparentMaster: true,
    behavior: true,
    threat: true,
    shots: true,
    projectileRuntime: true,
    acidSpawned: true,
    projectileSpeed: true
  });
});

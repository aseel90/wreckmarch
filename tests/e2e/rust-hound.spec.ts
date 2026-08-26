import { expect, test } from '@playwright/test';

test('Rust Hound has a readable telegraph and smooth bounded pounce in the live game', async ({ page }) => {
  await page.goto('/?debug=1&houndtest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchRustHoundTest),
    { timeout: 12_000 }
  ).toBe('passed');

  const result = await page.evaluate(() => (window as typeof window & { __WM_RUST_HOUND_TEST__?: any }).__WM_RUST_HOUND_TEST__);
  expect(result).toMatchObject({ ok: true, active: true, visual: true, behavior: true, threat: true, telegraph: true, pounced: true, pounceSpeed: true, finiteMotion: true, maxSpeed: true });
  expect(result.pounces).toBeGreaterThanOrEqual(1);
  expect(result.maxObservedSpeed).toBeGreaterThanOrEqual(330);
  expect(result.maxObservedSpeed).toBeLessThanOrEqual(380);
});

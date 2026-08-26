import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1536, height: 709 } });

test('landscape shell and Phaser canvas cover the full browser viewport', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const layout = await page.evaluate(() => {
    const shell = document.getElementById('game-shell')?.getBoundingClientRect();
    const game = document.getElementById('game')?.getBoundingClientRect();
    const canvas = document.querySelector('canvas')?.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      shell: shell && { left: shell.left, top: shell.top, right: shell.right, bottom: shell.bottom, width: shell.width, height: shell.height },
      game: game && { left: game.left, top: game.top, right: game.right, bottom: game.bottom, width: game.width, height: game.height },
      canvas: canvas && { left: canvas.left, top: canvas.top, right: canvas.right, bottom: canvas.bottom, width: canvas.width, height: canvas.height },
      bodyScroll: { width: document.body.scrollWidth, height: document.body.scrollHeight },
      bodyPosition: getComputedStyle(document.body).position,
      shellPosition: getComputedStyle(document.getElementById('game-shell')!).position
    };
  });

  expect(layout.viewport).toEqual({ width: 1536, height: 709 });
  expect(layout.bodyPosition).toBe('fixed');
  expect(layout.shellPosition).toBe('fixed');

  for (const rect of [layout.shell, layout.game, layout.canvas]) {
    expect(rect).toBeTruthy();
    expect(rect!.left).toBeCloseTo(0, 0);
    expect(rect!.top).toBeCloseTo(0, 0);
    expect(rect!.right).toBeCloseTo(1536, 0);
    expect(rect!.bottom).toBeCloseTo(709, 0);
    expect(rect!.width).toBeCloseTo(1536, 0);
    expect(rect!.height).toBeCloseTo(709, 0);
  }

  expect(layout.bodyScroll.width).toBeLessThanOrEqual(1536);
  expect(layout.bodyScroll.height).toBeLessThanOrEqual(709);
});

import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1536, height: 709 } });

test('landscape shell and Phaser canvas cover the full browser viewport', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('#game canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const layout = await page.evaluate(() => {
    const gameElement = document.getElementById('game');
    const canvasElement = document.querySelector('#game canvas');
    if (!(gameElement instanceof HTMLElement) || !(canvasElement instanceof HTMLCanvasElement)) return null;

    const gameRect = gameElement.getBoundingClientRect();
    const canvasRect = canvasElement.getBoundingClientRect();
    const rect = (value: DOMRect) => ({
      left: value.left,
      top: value.top,
      right: value.right,
      bottom: value.bottom,
      width: value.width,
      height: value.height
    });

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      game: rect(gameRect),
      canvas: rect(canvasRect),
      bodyScroll: { width: document.body.scrollWidth, height: document.body.scrollHeight },
      bodyPosition: getComputedStyle(document.body).position,
      gamePosition: getComputedStyle(gameElement).position
    };
  });

  expect(layout).not.toBeNull();
  expect(layout!.viewport).toEqual({ width: 1536, height: 709 });
  expect(layout!.bodyPosition).toBe('fixed');
  expect(layout!.gamePosition).toBe('fixed');

  for (const rect of [layout!.game, layout!.canvas]) {
    expect(rect.left).toBeCloseTo(0, 0);
    expect(rect.top).toBeCloseTo(0, 0);
    expect(rect.right).toBeCloseTo(1536, 0);
    expect(rect.bottom).toBeCloseTo(709, 0);
    expect(rect.width).toBeCloseTo(1536, 0);
    expect(rect.height).toBeCloseTo(709, 0);
  }

  expect(layout!.bodyScroll.width).toBeLessThanOrEqual(1536);
  expect(layout!.bodyScroll.height).toBeLessThanOrEqual(709);
});

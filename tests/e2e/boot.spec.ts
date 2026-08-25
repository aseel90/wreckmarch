import { expect, test } from '@playwright/test';

test('boots the current game, routes movement through InputManager, and keeps asphalt persistent', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');

  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchPhaseE0),
    { timeout: 20_000 }
  ).toBe('active');

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchE1SelfTest),
    { timeout: 20_000 }
  ).toBe('passed');

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      return Boolean(scene?.inputManager && scene?.hero && scene.inputManager.joystick === scene.joy);
    }),
    { timeout: 20_000 }
  ).toBe(true);

  const beforeX = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    return scene.hero.x as number;
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');

  const afterX = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    return game.scene.getScene('Wreckmarch').hero.x as number;
  });
  expect(afterX).toBeGreaterThan(beforeX + 5);

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchE1Persistence),
    { timeout: 25_000 }
  ).toBe('passed');
});

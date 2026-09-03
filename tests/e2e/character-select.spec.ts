import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Character Select blocks locked preview and launches only a canonical selectable character', async ({ page }) => {
  await page.goto('/?debug=1');

  const screen = page.locator('.wm-character-select');
  await expect(screen).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-character-id="runner"]')).toHaveAttribute('data-availability', 'selectable');
  await expect(page.locator('[data-character-id="shotgun"]')).toHaveAttribute('data-availability', 'locked');

  const before = await page.evaluate(() => ({
    gameReady: Boolean((window as any).__WM_GAME__),
    shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
    selected: (window as any).__WM_SELECTED_CHARACTER__ || null,
  }));
  expect(before).toEqual({ gameReady: false, shellScreen: 'character-select', selected: null });

  await page.locator('[data-character-id="shotgun"]').click();
  await expect(page.locator('.wm-character-select-status')).toContainText('IS LOCKED');

  const afterLocked = await page.evaluate(() => ({
    gameReady: Boolean((window as any).__WM_GAME__),
    shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
    selected: (window as any).__WM_SELECTED_CHARACTER__ || null,
  }));
  expect(afterLocked).toEqual({ gameReady: false, shellScreen: 'character-select', selected: null });

  await page.locator('[data-availability="selectable"]').click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const launched = await page.evaluate(() => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    return {
      selected: (window as any).__WM_SELECTED_CHARACTER__ || null,
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      sceneCharacter: scene?.characterId || null,
      characterReady: scene?.__characterSystemReady === true,
    };
  });
  expect(launched).toEqual({
    selected: 'runner',
    shellScreen: 'gameplay',
    sceneCharacter: 'runner',
    characterReady: true,
  });
});

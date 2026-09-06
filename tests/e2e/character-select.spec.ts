import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Main routes through Character Select and launches officially activated Wrecker', async ({ page }) => {
  await page.goto('/?debug=1');

  const main = page.locator('.wm-main-screen');
  await expect(main).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-screen-id="character-select"]')).toContainText('PLAY');

  const onMain = await page.evaluate(() => ({
    gameReady: Boolean((window as any).__WM_GAME__),
    shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
    selected: (window as any).__WM_SELECTED_CHARACTER__ || null,
  }));
  expect(onMain).toEqual({ gameReady: false, shellScreen: 'main', selected: null });

  await page.locator('[data-screen-id="character-select"]').click();

  const screen = page.locator('.wm-character-select');
  await expect(screen).toBeVisible();
  await expect(page.locator('[data-character-id="runner"]')).toHaveAttribute('data-availability', 'selectable');
  await expect(page.locator('[data-character-id="shotgun"]')).toHaveAttribute('data-availability', 'selectable');

  await page.locator('[data-character-id="shotgun"]').click();
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
      heroHp: scene?.heroHp ?? null,
      heroMaxHp: scene?.heroMaxHp ?? null,
      activeWeaponId: scene?.activeWeaponId || null,
      telemetryCharacter: scene?.runTelemetry?.getReport?.()?.character || null,
      c5Ok: scene?.__characterPresentationC5?.ok === true,
      d1Ok: scene?.__characterPresentationD1?.ok === true,
    };
  });
  expect(launched).toEqual({
    selected: 'shotgun',
    shellScreen: 'gameplay',
    sceneCharacter: 'shotgun',
    characterReady: true,
    heroHp: 110,
    heroMaxHp: 110,
    activeWeaponId: 'shotgun',
    telemetryCharacter: { id: 'shotgun', displayName: 'Wrecker' },
    c5Ok: true,
    d1Ok: true,
  });
});

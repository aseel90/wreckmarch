import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Call the Rig uses the canonical RigSystem and reserved Rig upgrades stay blocked', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('visual-ready')), { timeout: 30_000 }).toBe(true);

  const result = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.level = 2;
    scene.rigSummoned = false;
    const loadModule = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
    const runtime = await loadModule('/src/upgrades/upgrade-runtime.js?v=7');
    const choice = runtime.createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' });
    const before = { available: choice.available(), visible: scene.cart.visible, level: scene.upgradeLevels['call-rig'] || 0 };
    choice.apply();
    const phaseC1 = await loadModule('/src/phase-c1-runtime.js?v=8');
    return {
      before,
      after: { available: choice.available(), rigSummoned: scene.rigSummoned, visible: scene.cart.visible, level: scene.upgradeLevels['call-rig'], fireDelay: scene.rigFireDelay, shots: scene.rigShots },
      phaseC1Loaded: Boolean(phaseC1)
    };
  });
  expect(result.before).toEqual({ available: true, visible: false, level: 0 });
  expect(result.after).toMatchObject({ available: false, rigSummoned: true, visible: true, level: 1, fireDelay: 920, shots: 1 });
  expect(result.phaseC1Loaded).toBe(true);
});

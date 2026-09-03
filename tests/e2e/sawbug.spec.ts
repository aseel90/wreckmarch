import { expect, test } from '@playwright/test';

test('Sawbug holds range and fires the baked acid projectile', async ({ page }) => {
  await page.goto('/?autotest=1&debug=1&sawbugtest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(async () => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const sawbug = scene?.__wmSawbugSelfTestEnemy;
      if (!scene || !sawbug?.active || !scene.hero?.active) return false;

      scene.hero.setPosition?.(360, 480);
      scene.hero.setVelocity?.(0, 0);
      sawbug.setPosition?.(130, 480);
      sawbug.setVelocity?.(0, 0);
      sawbug.__sawbugState = null;

      const loadModule = new Function('path', 'return import(path)');
      const module = await loadModule('/src/enemies/behaviors/acid-spitter.js?v=1');
      const args = { scene, enemy: sawbug, target: scene.hero, random: () => 0 };
      module.updateAcidSpitterBehavior(args);

      const state = sawbug.__sawbugState;
      if (state?.phase !== 'windup') return false;
      state.phaseUntil = (Number(scene.time?.now) || 0) - 1;
      module.updateAcidSpitterBehavior(args);
      scene.__wmSawbugSelfTestRefresh?.();

      return Number(sawbug.__sawbugShotsFired) >= 1
        && Number(scene.__sawbugAcidShotsSpawned) >= 1
        && Boolean(scene.__sawbugAcidProjectiles);
    }),
    { timeout: 8_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    scene?.__wmSawbugSelfTestRefresh?.();
    return (window as typeof window & { __WM_SAWBUG_TEST__?: any }).__WM_SAWBUG_TEST__;
  });
  console.log('SAWBUG_SELF_TEST_STATE', JSON.stringify(state));
  expect(state, JSON.stringify(state)).toMatchObject({
    ok: true,
    status: 'passed',
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

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const projectile = scene?.__sawbugAcidProjectiles?.getChildren?.().find((entry: any) => entry?.active);
      if (!scene || !projectile || !scene.hero?.active) return null;
      const hpBefore = Number(scene.heroHp);
      const splashesBefore = Number(scene.__sawbugAcidSplashesSpawned) || 0;
      projectile.setPosition?.(scene.hero.x, scene.hero.y);
      projectile.body?.reset?.(scene.hero.x, scene.hero.y);
      scene.physics?.world?.step?.(1 / 60);
      const hpAfter = Number(scene.heroHp);
      const splashesAfter = Number(scene.__sawbugAcidSplashesSpawned) || 0;
      return {
        hpBefore,
        hpAfter,
        splashesBefore,
        splashesAfter,
        damaged: hpAfter < hpBefore,
        splashed: splashesAfter > splashesBefore
      };
    }),
    { timeout: 4_000 }
  ).toMatchObject({
    damaged: true,
    splashed: true
  });

  expect(await page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest)).toBe('passed');
});
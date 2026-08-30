import { expect, test } from '@playwright/test';

test('Sawbug holds range and fires the baked acid projectile', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    const text = error.stack || error.message || String(error);
    pageErrors.push(text);
    console.log('SAWBUG_PAGE_ERROR', text);
  });
  await page.goto('/?debug=1&sawbugtest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  // Execute the real acid-spitter state machine deterministically instead of depending
  // on CI frame scheduling: first enter windup, then make that windup due and execute
  // the same production updater again so it performs the real fire path.
  await expect.poll(
    () => page.evaluate(async () => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const sawbug = scene?.enemies?.getChildren?.()
        .find((candidate: any) => candidate?.active && candidate.enemyId === 'sawbug');
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

  // Exercise the real Arcade overlap deterministically. Natural projectile travel is already
  // covered by the self-test above; pinning that same live projectile onto the hero keeps this
  // regression check focused on impact -> damage -> splash -> continued scene updates.
  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const impacts = Number(scene?.__sawbugAcidImpactsResolved) || 0;
      if (!scene || impacts >= 1) return impacts;

      const projectile = scene.__sawbugAcidProjectiles?.getChildren?.()
        .find((candidate: any) => candidate?.active && candidate.__sawbugAcid);
      if (!projectile || !scene.hero?.active) return impacts;

      scene.heroHp = Math.max(9999, Number(scene.heroHp) || 0);
      scene.lastHeroHit = -1_000_000_000;
      projectile.setVelocity?.(0, 0);
      projectile.setPosition?.(scene.hero.x, scene.hero.y);
      projectile.body?.reset?.(scene.hero.x, scene.hero.y);
      return Number(scene.__sawbugAcidImpactsResolved) || 0;
    }),
    { timeout: 4_000 }
  ).toBeGreaterThanOrEqual(1);

  const impactState = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      hp: scene.heroHp,
      gameOver: scene.gameOver,
      errors: Number(scene.__sawbugAcidImpactErrors) || 0,
      impacts: Number(scene.__sawbugAcidImpactsResolved) || 0,
      splashes: Number(scene.__sawbugAcidSplashesSpawned) || 0,
      runTime: scene.runTime,
      heroActive: scene.hero?.active === true,
      heroBodyPresent: Boolean(scene.hero?.body)
    };
  });
  expect(impactState.hp).toBeLessThan(9999);
  expect(impactState.gameOver).toBe(false);
  expect(impactState.errors).toBe(0);
  expect(impactState.impacts).toBeGreaterThanOrEqual(1);
  expect(impactState.splashes).toBeGreaterThanOrEqual(1);
  expect(impactState.heroActive).toBe(true);
  expect(impactState.heroBodyPresent).toBe(true);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      return game.scene.getScene('Wreckmarch').runTime;
    }),
    { timeout: 2_000 }
  ).toBeGreaterThan(impactState.runTime + .05);

  const laterState = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      runTime: scene.runTime,
      gameOver: scene.gameOver,
      sceneActive: scene.sys?.isActive?.(),
      scenePaused: scene.sys?.isPaused?.(),
      physicsPaused: scene.physics?.world?.isPaused,
      loopRunning: game.loop?.running,
      heroActive: scene.hero?.active === true,
      heroBodyPresent: Boolean(scene.hero?.body),
      impacts: Number(scene.__sawbugAcidImpactsResolved) || 0,
      impactErrors: Number(scene.__sawbugAcidImpactErrors) || 0
    };
  });
  console.log('SAWBUG_POST_IMPACT_STATE', JSON.stringify(laterState));
  console.log('SAWBUG_PAGE_ERRORS', JSON.stringify(pageErrors));
  expect(pageErrors).toEqual([]);
  expect(laterState).toMatchObject({
    gameOver: false,
    sceneActive: true,
    scenePaused: false,
    physicsPaused: false,
    loopRunning: true,
    heroActive: true,
    heroBodyPresent: true,
    impactErrors: 0
  });

  expect(await page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest)).toBe('passed');
});

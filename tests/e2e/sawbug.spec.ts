import { expect, test } from '@playwright/test';

test('Sawbug holds range and fires the baked acid projectile', async ({ page }) => {
  await page.goto('/?debug=1&sawbugtest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest || ''),
    { timeout: 12_000 }
  ).toMatch(/^(passed|failed)$/);

  const state = await page.evaluate(() => (window as typeof window & { __WM_SAWBUG_TEST__?: any }).__WM_SAWBUG_TEST__);
  console.log('SAWBUG_SELF_TEST_STATE', JSON.stringify(state));
  expect(state, JSON.stringify(state)).toMatchObject({
    ok: true,
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
      runTime: scene.runTime
    };
  });
  expect(impactState.hp).toBeLessThan(9999);
  expect(impactState.gameOver).toBe(false);
  expect(impactState.errors).toBe(0);
  expect(impactState.impacts).toBeGreaterThanOrEqual(1);
  expect(impactState.splashes).toBeGreaterThanOrEqual(1);

  await page.waitForTimeout(350);
  const laterRunTime = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    return game.scene.getScene('Wreckmarch').runTime;
  });
  expect(laterRunTime).toBeGreaterThan(impactState.runTime + .15);

  expect(await page.evaluate(() => document.documentElement.dataset.wreckmarchSawbugTest)).toBe('passed');
});

import { expect, test } from '@playwright/test';

test('boots the current game, routes movement through InputManager, and keeps asphalt persistent', async ({ page }) => {
  await page.addInitScript(() => {
    const originalAdd = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function (...tokens: string[]) {
      if (tokens.includes('visual-ready')) {
        const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
        const scene = game?.scene?.getScene?.('Wreckmarch');
        (window as typeof window & { __WM_VISUAL_READY_SNAPSHOT__?: any }).__WM_VISUAL_READY_SNAPSHOT__ = {
          d1: Boolean((window as any).__WM_PHASE_D1__),
          e1: Boolean((window as any).__WM_PHASE_E1__),
          visualReady: document.documentElement.dataset.wreckmarchVisualReady,
          heroTexture: scene?.hero?.texture?.key,
          terrainOwner: scene?.__terrainSystemState?.owner,
          characterId: scene?.characterId,
          characterReady: scene?.__characterSystemReady,
          characterAnimation: scene?.hero?.anims?.currentAnim?.key,
          scrapRatReady: scene?.__scrapRatVisualReady,
          scrapRatDataset: document.documentElement.dataset.wreckmarchScrapRatVisual
        };
      }
      return originalAdd.apply(this, tokens);
    };
  });

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
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const visualReadySnapshot = await page.evaluate(() =>
    (window as typeof window & { __WM_VISUAL_READY_SNAPSHOT__?: any }).__WM_VISUAL_READY_SNAPSHOT__
  );
  expect(visualReadySnapshot).toMatchObject({
    d1: true,
    e1: true,
    visualReady: 'current',
    heroTexture: 'art-hero-idle-0',
    terrainOwner: 'e1',
    characterId: 'runner',
    characterReady: true,
    characterAnimation: 'character-runner-idle',
    scrapRatReady: true,
    scrapRatDataset: 'production-master'
  });

  const terrainOwnership = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      owner: scene.__terrainSystemState?.owner,
      activeBootstrapRoads: scene.children.list.filter((object: any) => object?.__e0Road && object?.active !== false).length,
      finalRoads: (scene.__e1RoadSegments || []).filter((object: any) => object?.active !== false).length
    };
  });
  expect(terrainOwnership.owner).toBe('e1');
  expect(terrainOwnership.activeBootstrapRoads).toBe(0);
  expect(terrainOwnership.finalRoads).toBeGreaterThan(180);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      return Boolean(scene?.inputManager && scene?.hero && scene.inputManager.joystick === scene.joy);
    }),
    { timeout: 20_000 }
  ).toBe(true);

  const scrapRatVisual = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.fireDelay = 999999;
    scene.bullets?.clear?.(true, true);
    scene.enemies.clear(true, true);
    scene.spawnEnemy(false);
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    return enemy ? {
      texture: enemy.texture?.key,
      production: enemy.__scrapRatVisual,
      version: enemy.__scrapRatVisualVersion,
      staticMaster: enemy.__scrapRatStaticMaster,
      sceneStaticMaster: scene.__scrapRatStaticMaster,
      legacyCombatVisuals: Boolean(scene.__scrapRatCombatVisualsInstalled),
      dataset: document.documentElement.dataset.wreckmarchScrapRatVisual,
      animation: enemy.anims?.currentAnim?.key,
      runFrames: scene.anims.get('scrap-rat-run')?.frames?.length || 0,
      hitRadius: enemy.hitRadius,
      scaleX: Math.abs(enemy.scaleX || 0),
      scaleY: Math.abs(enemy.scaleY || 0),
      alpha: enemy.alpha,
      isTinted: Boolean(enemy.isTinted)
    } : null;
  });
  expect(scrapRatVisual).not.toBeNull();
  expect(scrapRatVisual).toMatchObject({
    production: true,
    version: 'production-v4',
    staticMaster: true,
    sceneStaticMaster: true,
    legacyCombatVisuals: false,
    dataset: 'production-master',
    animation: 'scrap-rat-run',
    runFrames: 4,
    hitRadius: 24,
    alpha: 1,
    isTinted: false
  });
  expect(scrapRatVisual!.texture).toMatch(/^scrap-rat-run-master-[0-3]$/);
  expect(scrapRatVisual!.scaleX).toBeGreaterThan(.65);
  expect(Math.abs(scrapRatVisual!.scaleX - scrapRatVisual!.scaleY)).toBeLessThan(.001);

  const groundedRunCycle = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active) as any;
    const observed: Array<{ key: string; alpha: number; tinted: boolean }> = [];
    for (let i = 0; i < 8; i += 1) {
      observed.push({
        key: String(enemy?.texture?.key || ''),
        alpha: Number(enemy?.alpha ?? 0),
        tinted: Boolean(enemy?.isTinted)
      });
      await new Promise(resolve => setTimeout(resolve, 70));
    }
    return {
      observed,
      animation: enemy?.anims?.currentAnim?.key,
      scaleX: Math.abs(enemy?.scaleX || 0),
      scaleY: Math.abs(enemy?.scaleY || 0)
    };
  });
  expect(new Set(groundedRunCycle.observed.map(sample => sample.key)).size).toBeGreaterThanOrEqual(3);
  expect(groundedRunCycle.observed.every(sample => /^scrap-rat-run-master-[0-3]$/.test(sample.key))).toBe(true);
  expect(groundedRunCycle.observed.every(sample => sample.alpha === 1 && sample.tinted === false)).toBe(true);
  expect(groundedRunCycle.animation).toBe('scrap-rat-run');
  expect(Math.abs(groundedRunCycle.scaleX - groundedRunCycle.scaleY)).toBeLessThan(.001);

  const beforeX = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    return scene.hero.x as number;
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(180);
  const liveCharacterState = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      id: scene.characterId,
      maxHp: scene.heroMaxHp,
      speed: scene.heroSpeed,
      animation: scene.hero.anims.currentAnim?.key
    };
  });
  expect(liveCharacterState).toEqual({
    id: 'runner',
    maxHp: 100,
    speed: 255,
    animation: 'character-runner-run'
  });
  await page.waitForTimeout(120);
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

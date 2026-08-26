import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('mobile landscape HUD stays compact and Runner has a readable run cycle', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const baseline = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    const railHeight = Number(scene.__mobileHudPolish?.railHeight || 0);
    const runKey = scene.characterDefinition.animations.run.key;
    return {
      viewport: document.documentElement.dataset.wreckmarchViewport,
      hudVersion: document.documentElement.dataset.wreckmarchMobileHud,
      railHeight,
      title: { x: scene.titleText.x, y: scene.titleText.y, right: scene.titleText.x + scene.titleText.displayWidth },
      wave: { x: scene.waveText.x, y: scene.waveText.y },
      level: { x: scene.levelText.x, y: scene.levelText.y },
      scrap: { x: scene.scrapText.x, y: scene.scrapText.y },
      timer: { x: scene.timerText.x, y: scene.timerText.y, left: scene.timerText.x - scene.timerText.displayWidth },
      xp: { x: scene.xpBg.x, y: scene.xpBg.y, width: scene.xpBg.displayWidth },
      runKey,
      runFrames: scene.anims.get(runKey)?.frames?.length || 0
    };
  });

  expect(baseline.viewport).toBe('960x540');
  expect(baseline.hudVersion).toBe('compact-v1');
  expect(baseline.railHeight).toBe(62);
  expect(baseline.title).toMatchObject({ x: 16, y: 8 });
  expect(baseline.wave).toMatchObject({ x: 16, y: 34 });
  expect(baseline.timer).toMatchObject({ x: 944, y: 8 });
  expect(baseline.xp.y).toBe(42);
  expect(baseline.xp.width).toBeGreaterThanOrEqual(300);
  expect(baseline.title.right).toBeLessThan(baseline.level.x);
  expect(baseline.scrap.x).toBeLessThan(baseline.timer.left);
  expect(baseline.runKey).toBe('character-runner-run');
  expect(baseline.runFrames).toBeGreaterThanOrEqual(4);

  await page.keyboard.down('ArrowRight');
  const observed = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const textures: string[] = [];
    const frameIndexes: number[] = [];
    for (let index = 0; index < 10; index += 1) {
      textures.push(String(scene.hero.texture?.key || ''));
      frameIndexes.push(Number(scene.hero.anims.currentFrame?.index || 0));
      await new Promise(resolve => setTimeout(resolve, 55));
    }
    return {
      animation: scene.hero.anims.currentAnim?.key,
      isPlaying: scene.hero.anims.isPlaying,
      textures,
      frameIndexes,
      x: scene.hero.x
    };
  });
  await page.keyboard.up('ArrowRight');

  expect(observed.animation).toBe('character-runner-run');
  expect(observed.isPlaying).toBe(true);
  expect(new Set(observed.textures.filter(key => key.startsWith('runner-run-'))).size).toBeGreaterThanOrEqual(3);
  expect(new Set(observed.frameIndexes).size).toBeGreaterThanOrEqual(3);
});

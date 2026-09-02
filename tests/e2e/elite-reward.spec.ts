import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Elite milestone drops a bonus WRECK CRATE with at least one Rare+ choice', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  const before = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    return {
      level: scene.level,
      scrapXp: scene.scrapXp,
      pendingLevelUps: scene.pendingLevelUps || 0,
      eliteReady: Boolean(scene.__u3EliteRewardsReady && scene.eliteMilestoneController && scene.eliteRewardSystem)
    };
  });
  expect(before.eliteReady).toBe(true);

  const reward = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.runTime = 270;
    const elite = scene.eliteMilestoneController.trySpawn(270);
    if (!elite) return { error: 'elite-not-spawned' };
    const milestone = elite.__eliteRewardMilestoneSeconds;
    scene.enemyCombatSystem.killEnemy(elite);
    const crate = scene.eliteRewardSystem.crates.getChildren().find((item: any) => item?.active && item.__wreckCrate);
    if (!crate) return { error: 'crate-not-dropped', milestone };

    const originalRandom = Math.random;
    Math.random = () => 0;
    let opened = false;
    try {
      opened = scene.eliteRewardSystem.openCrate(crate);
    } finally {
      Math.random = originalRandom;
    }

    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    return {
      opened,
      milestone,
      choices: (upgradeScene.choices || []).map((item: any) => ({ id: item.id, rarity: item.rarity })),
      level: scene.level,
      scrapXp: scene.scrapXp,
      pendingLevelUps: scene.pendingLevelUps || 0,
      rewardSource: scene.activeUpgradeRewardContext?.source || null
    };
  });

  expect(reward).not.toHaveProperty('error');
  expect(reward.opened).toBe(true);
  expect(reward.milestone).toBe(270);
  expect(reward.rewardSource).toBe('elite-crate');
  expect(reward.choices).toHaveLength(3);
  expect(reward.choices.some((item: any) => ['RARE', 'EPIC', 'LEGENDARY'].includes(item.rarity))).toBe(true);
  expect(reward.level).toBe(before.level);
  expect(reward.scrapXp).toBe(before.scrapXp);
  expect(reward.pendingLevelUps).toBe(before.pendingLevelUps);
});

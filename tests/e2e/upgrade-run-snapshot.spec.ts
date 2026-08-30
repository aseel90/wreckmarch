import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('upgrade run snapshot round-trips canonical state in Chromium without replaying transient healing', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  const result = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);

    const browserModule = (path: string) => new URL(path, location.origin).href;
    const snapshotApi = await import(browserModule('/src/upgrades/upgrade-run-snapshot.js'));
    const runtime = await import(browserModule('/src/upgrades/upgrade-runtime.js'));
    const statsApi = await import(browserModule('/src/stats/run-stat-state.js'));

    runtime.applyRegisteredUpgrade(scene, 'heavy-rivets', { rarity: 'LEGENDARY' });
    runtime.applyRegisteredUpgrade(scene, 'armor-plate', { rarity: 'LEGENDARY' });
    runtime.applyRegisteredUpgrade(scene, 'twin-riveter', { rarity: 'COMMON' });

    const snapshot = JSON.parse(JSON.stringify(snapshotApi.createUpgradeRunSnapshot(scene)));
    const characterBase = { ...scene.runStatState.state.base.character };
    const weaponBase = { ...scene.runStatState.state.base.weapon };
    const target: any = {
      runStatState: statsApi.createRunStatState({ characterBase, weaponBase }),
      upgradeLevels: {},
      upgradeRarityHistory: {},
      upgradeMechanicalState: {},
      heroHp: 7,
      heroMaxHp: characterBase.maxHp,
      heroSpeed: characterBase.moveSpeed,
      primaryWeapon: { ...weaponBase },
      damage: weaponBase.damage,
      twinShots: 1,
      rigSummoned: false
    };

    snapshotApi.restoreUpgradeRunSnapshot(target, snapshot);
    return {
      schema: snapshot.schema,
      version: snapshot.version,
      levels: target.upgradeLevels,
      rarities: target.upgradeRarityHistory,
      damage: target.primaryWeapon.damage,
      maxHp: target.heroMaxHp,
      heroHp: target.heroHp,
      twinShots: target.twinShots,
      twinState: target.upgradeMechanicalState['twin-riveter'],
      hasArmorMechanicalSnapshot: Boolean(snapshot.mechanical.effects['armor-plate'])
    };
  });

  expect(result.schema).toBe('wreckmarch.upgrade-run-state');
  expect(result.version).toBe(1);
  expect(result.levels).toMatchObject({ 'heavy-rivets': 1, 'armor-plate': 1, 'twin-riveter': 1 });
  expect(result.rarities['heavy-rivets']).toEqual(['LEGENDARY']);
  expect(result.rarities['armor-plate']).toEqual(['LEGENDARY']);
  expect(result.damage).toBeCloseTo(31.2);
  expect(result.maxHp).toBeCloseTo(122.5);
  expect(result.heroHp).toBe(7);
  expect(result.twinShots).toBe(2);
  expect(result.twinState).toMatchObject({ effectId: 'TWIN_RIVETER', projectileCount: 2 });
  expect(result.hasArmorMechanicalSnapshot).toBe(false);
});
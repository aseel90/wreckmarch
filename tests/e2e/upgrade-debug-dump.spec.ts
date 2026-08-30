import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('optional debug panel copies/logs a compact canonical upgrade dump', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    const runtimeUrl = new URL('/src/upgrades/upgrade-runtime.js', location.origin).href;
    const runtime = await import(runtimeUrl);
    runtime.applyRegisteredUpgrade(scene, 'heavy-rivets', { rarity: 'LEGENDARY' });
    runtime.applyRegisteredUpgrade(scene, 'armor-plate', { rarity: 'RARE' });
  });

  await page.locator('#debug > summary').click();
  await expect(page.locator('#copy-upgrade-debug')).toBeVisible();
  await page.locator('#copy-upgrade-debug').click();

  await expect.poll(() => page.evaluate(() => {
    const text = document.getElementById('log')?.textContent || '';
    return text.includes('UPGRADE_STATE {');
  }), { timeout: 10_000 }).toBe(true);

  const result = await page.evaluate(() => {
    const lines = (document.getElementById('log')?.textContent || '').split('\n');
    const line = [...lines].reverse().find(value => value.includes('UPGRADE_STATE {'))!;
    const marker = 'UPGRADE_STATE ';
    const dump = JSON.parse(line.slice(line.indexOf(marker) + marker.length));
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return { dump, resolved: scene.runStatState.resolve() };
  });

  expect(result.dump.version).toBe(1);
  expect(result.dump.upgrades).toEqual(expect.arrayContaining([
    { id: 'armor-plate', level: 1, rarities: ['RARE'] },
    { id: 'heavy-rivets', level: 1, rarities: ['LEGENDARY'] }
  ]));
  expect(result.dump.stats.character).toEqual(result.resolved.character);
  expect(result.dump.stats.weapon).toEqual(result.resolved.weapon);
});

test('upgrade debug copy control stays unavailable outside debug mode', async ({ page }) => {
  await page.goto('/?autotest=1');
  await expect(page.locator('#copy-upgrade-debug')).toBeHidden();
});

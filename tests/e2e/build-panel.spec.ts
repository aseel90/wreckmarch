import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 844, height: 390 } });
test.describe.configure({ timeout: 90_000 });

async function waitForGame(page: any) {
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);
}

test('U6 Pause Build panel is read-only, canonical and contained on target mobile landscape', async ({ page }) => {
  await waitForGame(page);
  await page.locator('#wm-pause-trigger').click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  await page.locator('[data-pause-action="build"]').click();

  const overlay = page.locator('.wm-build-overlay');
  const panel = page.locator('.wm-build-panel');
  await expect(overlay).toBeVisible();
  await expect(panel).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RUN BUILD' })).toBeVisible();

  const state = await page.evaluate(async () => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    const snapshotModuleUrl = '/src/upgrades/run-build-snapshot.js?v=1';
    const mod = await import(snapshotModuleUrl);
    const snapshot = mod.createRunBuildSnapshot(scene);
    const panel = document.querySelector('.wm-build-panel') as HTMLElement | null;
    const overlay = document.querySelector('.wm-build-overlay') as HTMLElement | null;
    const rect = panel?.getBoundingClientRect();
    const displayed = (key: string) => document.querySelector(`[data-build-stat="${key}"] .wm-build-stat-value`)?.textContent || null;
    return {
      scenePaused: scene?.scene?.isPaused?.() === true,
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      version: panel?.dataset.buildSnapshotVersion || null,
      rect: rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } : null,
      overlayOverflow: overlay ? overlay.scrollWidth - overlay.clientWidth : null,
      panelOverflow: panel ? panel.scrollWidth - panel.clientWidth : null,
      snapshot: {
        currentHp: snapshot.character.hp.current,
        maxHp: snapshot.character.hp.max,
        damage: snapshot.weapon.stats.damage,
        projectileCount: snapshot.weapon.volley.projectileCount,
      },
      displayed: {
        hp: displayed('character.hp'),
        damage: displayed('weapon.damage'),
        projectileCount: displayed('weapon.projectileCount'),
      },
    };
  });

  expect(state.scenePaused).toBe(true);
  expect(state.shellScreen).toBe('pause');
  expect(state.version).toBe('u6-run-build-snapshot-v1');
  expect(state.rect!.left).toBeGreaterThanOrEqual(0);
  expect(state.rect!.top).toBeGreaterThanOrEqual(0);
  expect(state.rect!.right).toBeLessThanOrEqual(844);
  expect(state.rect!.bottom).toBeLessThanOrEqual(390);
  expect(state.overlayOverflow).toBeLessThanOrEqual(1);
  expect(state.panelOverflow).toBeLessThanOrEqual(1);
  expect(state.displayed.hp).toBe(`${state.snapshot.currentHp} / ${state.snapshot.maxHp}`);
  expect(Number(state.displayed.damage)).toBeCloseTo(state.snapshot.damage, 1);
  expect(Number(state.displayed.projectileCount)).toBe(state.snapshot.projectileCount);

  await page.keyboard.press('Escape');
  await expect(overlay).toHaveCount(0);
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch')?.scene?.isPaused?.() === true)).toBe(true);
});

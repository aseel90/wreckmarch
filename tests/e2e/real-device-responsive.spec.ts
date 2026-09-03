import { expect, test } from '@playwright/test';

const VIEWPORT = { width: 812, height: 375 };
const SAFE = { top: 0, right: 44, bottom: 21, left: 44 };

async function applySafeArea(page: any) {
  await page.evaluate((safe: typeof SAFE) => {
    const root = document.documentElement.style;
    root.setProperty('--wm-safe-top', `${safe.top}px`);
    root.setProperty('--wm-safe-right', `${safe.right}px`);
    root.setProperty('--wm-safe-bottom', `${safe.bottom}px`);
    root.setProperty('--wm-safe-left', `${safe.left}px`);
    window.dispatchEvent(new Event('resize'));
  }, SAFE);
}

test.use({ viewport: VIEWPORT });

test('812x375 safe-area Main keeps the complete WRECKMARCH wordmark before the deployment panel', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await applySafeArea(page);

  const fit = await page.evaluate(() => {
    const brand = document.querySelector<HTMLElement>('.wm-main-brand')!;
    const title = document.querySelector<HTMLElement>('#wm-main-title')!;
    const panel = document.querySelector<HTMLElement>('.wm-main-panel')!;
    const titleRect = title.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    return {
      title: title.textContent,
      brandClientWidth: brand.clientWidth,
      brandScrollWidth: brand.scrollWidth,
      titleLeft: titleRect.left,
      titleRight: titleRect.right,
      panelLeft: panelRect.left,
      viewportWidth: innerWidth,
      pageScrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(fit.title).toBe('WRECKMARCH');
  expect(fit.brandScrollWidth).toBeLessThanOrEqual(fit.brandClientWidth + 1);
  expect(fit.titleLeft).toBeGreaterThanOrEqual(SAFE.left);
  expect(fit.titleRight).toBeLessThanOrEqual(fit.panelLeft - 4);
  expect(fit.pageScrollWidth).toBeLessThanOrEqual(fit.viewportWidth + 1);
  await expect(page.locator('#fs-btn')).toBeHidden();
});

test('812x375 safe-area gameplay keeps the timer clear of the Pause trigger', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 45_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 70_000 }
  ).toBe(true);
  await applySafeArea(page);
  await expect(page.locator('.wm-pause-trigger')).toBeVisible();

  const fit = await page.evaluate(() => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const timer = scene?.timerText?.getBounds?.();
    const pause = document.querySelector<HTMLElement>('.wm-pause-trigger')?.getBoundingClientRect();
    return {
      timerRight: timer?.right ?? 0,
      pauseLeft: pause?.left ?? 0,
      pauseWidth: pause?.width ?? 0,
      pauseVisible: Boolean(pause && pause.width > 0 && pause.height > 0),
      reserve: scene?.__mobileHudPolish?.pauseReserve ?? 0,
    };
  });

  expect(fit.pauseVisible).toBe(true);
  expect(fit.reserve).toBeGreaterThanOrEqual(88);
  expect(fit.timerRight).toBeLessThanOrEqual(fit.pauseLeft - 6);
});

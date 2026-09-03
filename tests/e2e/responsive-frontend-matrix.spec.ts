import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'compact-568x320', width: 568, height: 320, safe: { top: 0, right: 44, bottom: 21, left: 44 } },
  { name: 'small-667x375', width: 667, height: 375, safe: { top: 0, right: 44, bottom: 21, left: 44 } },
  { name: 'classic-736x414', width: 736, height: 414, safe: { top: 0, right: 34, bottom: 21, left: 34 } },
  { name: 'short-768x360', width: 768, height: 360, safe: { top: 0, right: 44, bottom: 21, left: 44 } },
  { name: 'notch-812x375', width: 812, height: 375, safe: { top: 0, right: 44, bottom: 21, left: 44 } },
  { name: 'canonical-844x390', width: 844, height: 390, safe: { top: 0, right: 34, bottom: 21, left: 34 } },
  { name: 'wide-896x414', width: 896, height: 414, safe: { top: 0, right: 32, bottom: 21, left: 32 } },
  { name: 'modern-932x430', width: 932, height: 430, safe: { top: 0, right: 32, bottom: 21, left: 32 } },
  { name: 'gameplay-baseline-960x540', width: 960, height: 540, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
  { name: 'baseline-1024x600', width: 1024, height: 600, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
  { name: 'desktop-1280x720', width: 1280, height: 720, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
];

const EPSILON = 2;

type SafeArea = { top: number; right: number; bottom: number; left: number };

async function applySafeArea(page: any, safe: SafeArea) {
  await page.evaluate((value: SafeArea) => {
    const root = document.documentElement.style;
    root.setProperty('--wm-safe-top', `${value.top}px`);
    root.setProperty('--wm-safe-right', `${value.right}px`);
    root.setProperty('--wm-safe-bottom', `${value.bottom}px`);
    root.setProperty('--wm-safe-left', `${value.left}px`);
  }, safe);
}

async function expectNoHorizontalOverflow(page: any, selector: string) {
  const metrics = await page.locator(selector).evaluate((element: HTMLElement) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    rect: element.getBoundingClientRect().toJSON(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    rootScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + EPSILON);
  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.viewport.width + EPSILON);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewport.width + EPSILON);
  expect(metrics.rect.x).toBeGreaterThanOrEqual(-EPSILON);
  expect(metrics.rect.right).toBeLessThanOrEqual(metrics.viewport.width + EPSILON);
}

async function expectNoVerticalOverflow(page: any, selector: string) {
  const metrics = await page.locator(selector).evaluate((element: HTMLElement) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + EPSILON);
}

async function expectHorizontalFit(page: any, selector: string) {
  const locator = page.locator(selector);
  await expect(locator).toHaveCount(1);
  const metrics = await locator.evaluate((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, viewportWidth: window.innerWidth };
  });
  expect(metrics.left).toBeGreaterThanOrEqual(-EPSILON);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + EPSILON);
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewportWidth + EPSILON);
}

async function expectNoInternalHorizontalTextClipping(page: any, selector: string) {
  const metrics = await page.locator(selector).evaluate((element: HTMLElement) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + EPSILON);
}

async function openMain(page: any, viewport: typeof VIEWPORTS[number]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('/?debug=1');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await applySafeArea(page, viewport.safe);
  await expectNoHorizontalOverflow(page, '.wm-main-screen');
  await expectNoVerticalOverflow(page, '.wm-main-screen');
  await expectHorizontalFit(page, '.wm-main-brand');
  await expectHorizontalFit(page, '.wm-main-brand h1');
  await expectNoInternalHorizontalTextClipping(page, '.wm-main-brand h1');
  await expectHorizontalFit(page, '.wm-main-panel');
  await expectHorizontalFit(page, '[data-screen-id="character-select"]');
  await expectHorizontalFit(page, '[data-screen-id="settings"]');
  await expectHorizontalFit(page, '[data-screen-id="shop"]');
}

test.describe.configure({ timeout: 120_000 });

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: primary frontend screens never require horizontal scrolling`, async ({ page }) => {
    await openMain(page, viewport);

    await page.locator('[data-screen-id="settings"]').click();
    await expect(page.locator('.wm-settings-screen')).toBeVisible();
    await expectNoHorizontalOverflow(page, '.wm-settings-screen');
    await expectNoVerticalOverflow(page, '.wm-settings-screen');
    await expectHorizontalFit(page, '.wm-settings-header');
    await expectHorizontalFit(page, '.wm-settings-panel');
    await page.locator('.wm-settings-screen .wm-shell-back').click();
    await expect(page.locator('.wm-main-screen')).toBeVisible();

    await page.locator('[data-screen-id="shop"]').click();
    await expect(page.locator('.wm-progression-screen')).toBeVisible();
    await expectNoHorizontalOverflow(page, '.wm-progression-screen');
    await expectHorizontalFit(page, '.wm-progression-header');
    await expectHorizontalFit(page, '.wm-progression-rank');
    await expectHorizontalFit(page, '.wm-progression-stats');
    await page.locator('.wm-progression-screen').evaluate((element: HTMLElement) => {
      const catalog = element.querySelector('.wm-workshop-catalog');
      catalog?.scrollIntoView({ block: 'center' });
    });
    await expectHorizontalFit(page, '.wm-workshop-catalog');
    await expectHorizontalFit(page, '[data-item-id="terminal-plate-rustline"]');
    const workshopScroll = await page.locator('.wm-progression-screen').evaluate((element: HTMLElement) => {
      element.scrollTop = element.scrollHeight;
      element.scrollLeft = 99999;
      window.scrollTo(99999, window.scrollY);
      return {
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        pageX: window.scrollX,
      };
    });
    expect(workshopScroll.scrollLeft).toBe(0);
    expect(workshopScroll.scrollWidth).toBeLessThanOrEqual(workshopScroll.clientWidth + EPSILON);
    expect(workshopScroll.pageX).toBe(0);
    await expectHorizontalFit(page, '.wm-workshop-catalog');
    await expectHorizontalFit(page, '[data-item-id="terminal-plate-rustline"]');
    await page.locator('.wm-progression-screen .wm-shell-back').click();
    await expect(page.locator('.wm-main-screen')).toBeVisible();

    await page.locator('[data-screen-id="character-select"]').click();
    await expect(page.locator('.wm-character-select')).toBeVisible();
    await expectNoHorizontalOverflow(page, '.wm-character-select');
    await expectNoVerticalOverflow(page, '.wm-character-select');
    await expectHorizontalFit(page, '.wm-character-select-header');
    await expectHorizontalFit(page, '.wm-character-grid');
    await expectHorizontalFit(page, '[data-character-id="runner"]');
    await expectHorizontalFit(page, '[data-character-id="shotgun"]');

    await page.evaluate(async () => {
      document.querySelectorAll('.wm-shell-screen,.wm-pause-screen').forEach(element => element.remove());
      document.body.classList.remove('wm-character-select-active', 'wm-main-active', 'wm-settings-active', 'wm-progression-active');
      const pause = await new Function('url', 'return import(url)')('/src/ui/pause-screen.js?v=4');
      void pause.showPauseScreen();
    });
    await expect(page.locator('.wm-pause-screen')).toBeVisible();
    await expectNoHorizontalOverflow(page, '.wm-pause-screen');
    await expectNoVerticalOverflow(page, '.wm-pause-screen');
    await expectHorizontalFit(page, '.wm-pause-panel');

    await page.evaluate(async () => {
      document.querySelectorAll('.wm-shell-screen,.wm-pause-screen').forEach(element => element.remove());
      document.body.classList.remove('wm-pause-active');
      const results = await new Function('url', 'return import(url)')('/src/ui/results-screen.js?v=3');
      void results.showResultsScreen({
        runId: 'responsive-matrix',
        reason: 'SYSTEM FAILURE',
        characterId: 'runner',
        survivedSeconds: 95,
        scrap: 63,
        level: 5,
        createdAt: '2026-09-03T12:00:00.000Z',
      }, { workshopReward: { runId: 'responsive-matrix', amount: 2 } });
    });
    await expect(page.locator('.wm-results-screen')).toBeVisible();
    await expectNoHorizontalOverflow(page, '.wm-results-screen');
    await expectNoVerticalOverflow(page, '.wm-results-screen');
    await expectHorizontalFit(page, '.wm-results-header');
    await expectHorizontalFit(page, '.wm-results-stats');
    await expectHorizontalFit(page, '.wm-results-actions');
    await expectHorizontalFit(page, '.wm-results-report');
  });
}

test('812x375 notch: real end-run stays canonical and horizontally sealed through Results and Workshop', async ({ page }) => {
  const viewport = VIEWPORTS.find(item => item.name === 'notch-812x375')!;
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('/');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await applySafeArea(page, viewport.safe);

  await page.locator('[data-screen-id="character-select"]').click();
  await expect(page.locator('.wm-character-select')).toBeVisible();
  await page.locator('[data-character-id="runner"]').click();
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);
  await applySafeArea(page, viewport.safe);

  const hudSafeArea = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    const layout = scene?.__mobileHudPolish;
    return {
      left: layout?.safeInsets?.left ?? 0,
      right: layout?.safeInsets?.right ?? 0,
      bottom: layout?.safeInsets?.bottom ?? 0,
      hintY: scene?.hint?.y ?? 0,
      gameHeight: scene?.scale?.gameSize?.height ?? 0,
    };
  });
  expect(hudSafeArea.left).toBeGreaterThan(0);
  expect(hudSafeArea.right).toBeGreaterThan(0);
  expect(hudSafeArea.bottom).toBeGreaterThan(0);
  expect(hudSafeArea.hintY).toBeLessThan(hudSafeArea.gameHeight);

  await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 95;
    scene.scrap = 63;
    scene.level = 5;
    scene.endRun('SYSTEM FAILURE');
  });

  await expect(page.locator('.wm-results-screen')).toBeVisible();
  await expect(page.getByText('TEST UI v5')).toHaveCount(0);
  await expect(page.getByText('RUNNER DOWN')).toHaveCount(0);
  await expectNoHorizontalOverflow(page, '.wm-results-screen');
  await expectNoVerticalOverflow(page, '.wm-results-screen');
  await expectHorizontalFit(page, '.wm-results-header');
  await expectHorizontalFit(page, '.wm-results-stats');
  await expectHorizontalFit(page, '.wm-results-actions');
  await expectHorizontalFit(page, '.wm-results-report');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-results-action="main"]').click(),
  ]);
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 45_000 });
  await applySafeArea(page, viewport.safe);
  await page.locator('[data-screen-id="shop"]').click();
  await expect(page.locator('.wm-progression-screen')).toBeVisible();

  const afterDeepScroll = await page.locator('.wm-progression-screen').evaluate((element: HTMLElement) => {
    element.scrollTop = element.scrollHeight;
    element.scrollLeft = 99999;
    window.scrollTo(99999, window.scrollY);
    return {
      scrollLeft: element.scrollLeft,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      pageX: window.scrollX,
    };
  });
  expect(afterDeepScroll.scrollLeft).toBe(0);
  expect(afterDeepScroll.scrollWidth).toBeLessThanOrEqual(afterDeepScroll.clientWidth + EPSILON);
  expect(afterDeepScroll.pageX).toBe(0);
  await expectNoHorizontalOverflow(page, '.wm-progression-screen');
  await expectHorizontalFit(page, '.wm-workshop-catalog');
  await expectHorizontalFit(page, '[data-item-id="terminal-plate-rustline"]');
});

test('portrait fallback no longer blocks the frontend with a rotate gate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?debug=1');
  await expect(page.locator('#rotate')).toHaveCount(0);
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await applySafeArea(page, { top: 47, right: 0, bottom: 34, left: 0 });
  await expect(page.locator('.wm-main-screen')).toHaveCount(1);
});

test('812x375 notch landscape survives portrait round-trip without a rotate blocker or duplicate shell state', async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto('/?debug=1');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await applySafeArea(page, { top: 0, right: 44, bottom: 21, left: 44 });
  await expect(page.locator('.wm-main-screen')).toHaveCount(1);
  await expect(page.locator('#rotate')).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 812 });
  await applySafeArea(page, { top: 47, right: 0, bottom: 34, left: 0 });
  await expect(page.locator('#rotate')).toHaveCount(0);
  await expect(page.locator('.wm-main-screen')).toHaveCount(1);

  await page.setViewportSize({ width: 812, height: 375 });
  await applySafeArea(page, { top: 0, right: 44, bottom: 21, left: 44 });
  await expect(page.locator('.wm-main-screen')).toBeVisible();
  await expect(page.locator('.wm-main-screen')).toHaveCount(1);
  await expectNoHorizontalOverflow(page, '.wm-main-screen');
  await expectNoVerticalOverflow(page, '.wm-main-screen');
});

test('fullscreen path requests a landscape orientation lock when the browser supports it', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(screen.orientation, 'lock', {
      configurable: true,
      value: async (type: string) => { (window as any).__WM_TEST_ORIENTATION_LOCK__ = type; },
    });
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: async () => undefined,
    });
  });
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto('/?debug=1');
  await expect(page.locator('#fs-btn')).toBeVisible();
  await page.locator('#fs-btn').click();
  await expect.poll(() => page.evaluate(() => (window as any).__WM_TEST_ORIENTATION_LOCK__)).toBe('landscape');
  await expect.poll(() => page.evaluate(() => (window as any).__WM_ORIENTATION__?.requested)).toBe('landscape');
});

import { chromium } from '@playwright/test';

const URL = process.env.WM_SMOKE_URL || 'http://127.0.0.1:4173/?autotest=1&debug=1';
const TELEMETRY_SMOKE = /(?:[?&])wmTelemetry=1(?:&|$)/.test(URL);
const SMOKE_CHARACTER = process.env.WM_SMOKE_CHARACTER || null;
const CHROME = process.env.WM_CHROME_PATH || null;
const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] };
if (CHROME) launchOptions.executablePath = CHROME;
const browser = await chromium.launch(launchOptions);
let page;
let readinessStartedAt = null;
let readinessMs = null;
const browserEvents = [];
try {
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', msg => { if (msg.type() === 'error') browserEvents.push(`console:error: ${msg.text()}`); });
  page.on('pageerror', error => browserEvents.push(`pageerror: ${error?.stack || error}`));
  page.on('requestfailed', request => browserEvents.push(`requestfailed: ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));
  if (TELEMETRY_SMOKE) {
    await page.addInitScript(() => {
      const nativeFetch = globalThis.fetch.bind(globalThis);
      globalThis.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input?.url || String(input);
        if (url.startsWith('https://wreckmarch-run-reports.salahaseel82.workers.dev/') || url.startsWith('https://wreckmarch-telemetry-probe.salahaseel82.workers.dev/')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true, accepted: true, submitted: true }), { status: 202, headers: { 'content-type': 'application/json' } }));
        }
        return nativeFetch(input, init);
      };
    });
  }
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  if (SMOKE_CHARACTER) {
    const characterButton = page.locator(`[data-character-id="${SMOKE_CHARACTER}"]`);
    const mainCharacterSelect = page.locator('[data-screen-id="character-select"]');
    await mainCharacterSelect.waitFor({ state: 'visible', timeout: 15_000 });
    await mainCharacterSelect.click();
    await characterButton.waitFor({ state: 'visible', timeout: 15_000 });
    const availability = await characterButton.getAttribute('data-availability');
    if (availability !== 'selectable') throw new Error(`Smoke character is not selectable: ${SMOKE_CHARACTER} (${availability})`);
    await characterButton.click();
  }
  readinessStartedAt = Date.now();
  const readState = () => page.evaluate(() => {
    const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch'), canvas = document.querySelector('#game canvas'), rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 && Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return { canvas: !!canvas, visualReady: document.body.classList.contains('visual-ready'), fullBleed, gameReady: !!game, sceneActive: !!scene?.sys?.isActive?.(), selectedCharacter: window.__WM_SELECTED_CHARACTER__ || null, sceneCharacter: scene?.characterId || null, activeWeaponId: scene?.activeWeaponId || null, heroHp: scene?.heroHp ?? null, heroMaxHp: scene?.heroMaxHp ?? null, telemetryCharacter: scene?.runTelemetry?.getReport?.()?.character || null, finalPolishReady: scene?.__finalPolishReady === true, finalPolish: document.documentElement.dataset.wreckmarchFinalPolish || null, mobileHud: document.documentElement.dataset.wreckmarchMobileHud || null, gameplayHud: document.documentElement.dataset.wreckmarchGameplayHud || null, phaseE1: document.documentElement.dataset.wreckmarchPhaseE1 || null, e1SelfTest: document.documentElement.dataset.wreckmarchE1SelfTest || null, e1Persistence: document.documentElement.dataset.wreckmarchE1Persistence || null, sawbugVisual: document.documentElement.dataset.wreckmarchSawbugVisual || null, bootStatus: document.querySelector('#boot-status')?.textContent || null, bootError: document.body.classList.contains('boot-error'), debugTail: document.querySelector('#log')?.textContent?.slice(-4000) || '', viewport: { width: window.innerWidth, height: window.innerHeight }, canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null };
  });
  await page.waitForFunction(() => {
    const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch'), canvas = document.querySelector('#game canvas'), rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 && Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return !!canvas && document.body.classList.contains('visual-ready') && fullBleed && !!game && !!scene?.sys?.isActive?.() && scene?.__finalPolishReady === true && document.documentElement.dataset.wreckmarchFinalPolish === 'presentation-v1' && document.documentElement.dataset.wreckmarchMobileHud === 'compact-v5-test' && document.documentElement.dataset.wreckmarchPhaseE1 === 'active';
  }, undefined, { polling: 250, timeout: 70_000 });
  readinessMs = Date.now() - readinessStartedAt;

  const readE1RoadState = () => page.evaluate(() => {
    const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch');
    const roads = (scene?.__e1RoadSegments || []).filter(item => item?.active !== false);
    const visible = roads.filter(item => item.visible && item.alpha > .9);
    const hero = scene?.hero;
    const nearest = hero && roads.length
      ? roads.reduce((best, item) => {
          const bestDistance = Phaser.Math.Distance.Between(hero.x, hero.y, best.x, best.y);
          const itemDistance = Phaser.Math.Distance.Between(hero.x, hero.y, item.x, item.y);
          return itemDistance < bestDistance ? item : best;
        }, roads[0])
      : null;
    const legacyVisible = scene?.children?.list?.filter(item => item?.visible && item.__e1SuppressedLegacy).length || 0;
    const groundDepth = scene?.__e1Terrain?.find(item => item?.name === 'e1-ground-base')?.depth ?? null;
    const roadDepth = nearest?.depth ?? null;
    return {
      roads: roads.length,
      visible: visible.length,
      legacyVisible,
      nearest: nearest && hero ? Math.round(Phaser.Math.Distance.Between(hero.x, hero.y, nearest.x, nearest.y)) : null,
      roadDepth,
      groundDepth
    };
  });
  const validateE1RoadState = state => state.roads > 180
    && state.visible === state.roads
    && state.legacyVisible === 0
    && state.nearest !== null
    && state.nearest < 260
    && state.roadDepth > state.groundDepth;
  const e1PersistenceBefore = await readE1RoadState();
  await page.waitForTimeout(2_000);
  const e1PersistenceAfter = await readE1RoadState();
  if (!validateE1RoadState(e1PersistenceBefore) || !validateE1RoadState(e1PersistenceAfter) || e1PersistenceAfter.roads !== e1PersistenceBefore.roads) {
    throw new Error(`E1 road persistence failed: ${JSON.stringify({ before: e1PersistenceBefore, after: e1PersistenceAfter })}`);
  }
  const e1Persistence = { passed: true, before: e1PersistenceBefore, after: e1PersistenceAfter };
  const state = await readState();
  if (SMOKE_CHARACTER) {
    if (state.selectedCharacter !== SMOKE_CHARACTER || state.sceneCharacter !== SMOKE_CHARACTER) throw new Error(`Smoke character binding mismatch: ${JSON.stringify(state)}`);
    if (SMOKE_CHARACTER === 'shotgun' && (state.activeWeaponId !== 'shotgun' || state.heroHp !== 110 || state.heroMaxHp !== 110 || state.telemetryCharacter?.id !== 'shotgun' || state.telemetryCharacter?.displayName !== 'Wrecker')) throw new Error(`Wrecker live activation contract failed: ${JSON.stringify(state)}`);
  }
  let telemetryState = null;
  if (TELEMETRY_SMOKE) {
    telemetryState = await page.evaluate(async () => {
      const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch');
      const shell = window.__WM_GAME_SHELL__;
      if (!scene?.sys?.isActive?.()) throw new Error('telemetry live smoke scene unavailable');
      scene.spawnEvent && (scene.spawnEvent.paused = true);
      scene.waveEvent && (scene.waveEvent.paused = true);
      scene.enemies?.clear?.(true, true);
      scene.endRun('LIVE TELEMETRY SMOKE');
      await new Promise(resolve => setTimeout(resolve, 80));
      const resultsScreen = document.querySelector('.wm-results-screen');
      const reportButton = document.querySelector('.wm-results-report-button');
      const reportStatus = document.querySelector('.wm-results-report span');
      const before = {
        shellScreen: shell?.currentScreenId || null,
        owner: document.documentElement.dataset.wreckmarchEndRunOwner || null,
        resultsState: document.documentElement.dataset.wreckmarchResults || null,
        resultsVisible: Boolean(resultsScreen && resultsScreen.getClientRects().length),
        buttonVisible: Boolean(reportButton && reportButton.getClientRects().length),
        buttonEnabled: reportButton instanceof HTMLButtonElement && !reportButton.disabled,
        label: reportButton?.textContent?.trim() || null,
        status: reportStatus?.textContent?.trim() || null,
        legacyLayoutExists: Boolean(window.__WM_END_RUN_LAYOUT__)
      };
      if (!before.resultsVisible || !before.buttonVisible || !before.buttonEnabled || before.legacyLayoutExists) throw new Error(`telemetry Results bridge unavailable: ${JSON.stringify(before)}`);
      reportButton.click();
      await new Promise(resolve => setTimeout(resolve, 120));
      const after = {
        buttonEnabled: reportButton instanceof HTMLButtonElement && !reportButton.disabled,
        label: reportButton?.textContent?.trim() || null,
        status: reportStatus?.textContent?.trim() || null
      };
      if (!after.status?.includes('SENT')) throw new Error(`telemetry report send failed: ${JSON.stringify({ before, after })}`);
      return { before, after };
    });
  }
  state.e1Persistence = e1Persistence;
  state.telemetryState = telemetryState;
  state.readinessElapsedMs = readinessStartedAt ? Date.now() - readinessStartedAt : null;
  if (!state.visualReady || !state.fullBleed || !state.gameReady || !state.sceneActive || !state.finalPolishReady || state.finalPolish !== 'presentation-v1' || state.mobileHud !== 'compact-v5-test' || state.phaseE1 !== 'active') throw new Error(`Smoke readiness failed: ${JSON.stringify(state)}`);
  if (browserEvents.length) throw new Error(`Browser events detected: ${JSON.stringify(browserEvents)}`);
  console.log('SMOKE_STATE', JSON.stringify(state, null, 2));
  console.log('BROWSER_EVENTS', JSON.stringify(browserEvents, null, 2));
} catch (error) {
  const state = page ? await page.evaluate(() => {
    const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch'), canvas = document.querySelector('#game canvas'), rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 && Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return { visualReady: document.body.classList.contains('visual-ready'), fullBleed, bootError: document.body.classList.contains('boot-error'), bootStatus: document.querySelector('#boot-status')?.textContent || null, gameReady: !!game, sceneActive: !!scene?.sys?.isActive?.(), finalPolishReady: scene?.__finalPolishReady === true, sawbugVisual: document.documentElement.dataset.wreckmarchSawbugVisual || null, phaseE1: document.documentElement.dataset.wreckmarchPhaseE1 || null, e1SelfTest: document.documentElement.dataset.wreckmarchE1SelfTest || null, e1Persistence: document.documentElement.dataset.wreckmarchE1Persistence || null, finalPolish: document.documentElement.dataset.wreckmarchFinalPolish || null, mobileHud: document.documentElement.dataset.wreckmarchMobileHud || null, gameplayHud: document.documentElement.dataset.wreckmarchGameplayHud || null, viewport: { width: window.innerWidth, height: window.innerHeight }, canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null, debugTail: document.querySelector('#log')?.textContent?.slice(-4000) || '' };
  }).catch(() => null) : null;
  if (state) state.readinessElapsedMs = readinessStartedAt ? Date.now() - readinessStartedAt : null;
  console.error(error?.stack || error);
  console.error('SMOKE_STATE', JSON.stringify(state, null, 2));
  console.error('BROWSER_EVENTS', JSON.stringify(browserEvents, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}

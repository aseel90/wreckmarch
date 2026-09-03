import { chromium } from '@playwright/test';

const URL = process.env.WM_SMOKE_URL || 'http://127.0.0.1:4173/?autotest=1&debug=1';
const TELEMETRY_SMOKE = /(?:[?&])wmTelemetry=1(?:&|$)/.test(URL);
const CHROME = process.env.WM_CHROME_PATH || null;

const launchOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
};
if (CHROME) launchOptions.executablePath = CHROME;

const browser = await chromium.launch(launchOptions);
let page;
let readinessStartedAt = null;
let readinessMs = null;
const browserEvents = [];

try {
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', msg => {
    if (msg.type() === 'error') browserEvents.push(`console:error: ${msg.text()}`);
  });
  page.on('pageerror', error => browserEvents.push(`pageerror: ${error?.stack || error}`));
  page.on('requestfailed', request => browserEvents.push(`requestfailed: ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));

  if (TELEMETRY_SMOKE) {
    await page.addInitScript(() => {
      const nativeFetch = globalThis.fetch.bind(globalThis);
      globalThis.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input?.url;
        if (typeof url === 'string' && url.startsWith('https://wreckmarch-run-reports.salahaseel82.workers.dev/')) {
          return new Response(JSON.stringify({ queued: true }), {
            status: 202,
            headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
          });
        }
        return nativeFetch(input, init);
      };
    });
  }

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  readinessStartedAt = Date.now();

  const readState = () => page.evaluate(() => {
    const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch'), canvas = document.querySelector('#game canvas'), rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 && Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return {
      canvas: !!canvas,
      visualReady: document.body.classList.contains('visual-ready'),
      fullBleed,
      gameReady: !!game,
      sceneActive: !!scene?.sys?.isActive?.(),
      finalPolishReady: scene?.__finalPolishReady === true,
      finalPolish: document.documentElement.dataset.wreckmarchFinalPolish,
      mobileHud: document.documentElement.dataset.wreckmarchMobileHud,
      gameplayHud: document.documentElement.dataset.wreckmarchGameplayHud,
      phaseE1: document.documentElement.dataset.wreckmarchPhaseE1,
      e1SelfTest: document.documentElement.dataset.wreckmarchE1SelfTest,
      e1Persistence: document.documentElement.dataset.wreckmarchE1Persistence,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
    };
  });

  await page.waitForFunction(() => {
    const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch'), canvas = document.querySelector('#game canvas'), rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 && Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return !!canvas && document.body.classList.contains('visual-ready') && fullBleed && !!game && !!scene?.sys?.isActive?.() && scene?.__finalPolishReady === true && document.documentElement.dataset.wreckmarchFinalPolish === 'presentation-v1' && document.documentElement.dataset.wreckmarchMobileHud === 'compact-v5-test' && document.documentElement.dataset.wreckmarchPhaseE1 === 'active' && document.documentElement.dataset.wreckmarchE1SelfTest === 'passed';
  }, undefined, { polling: 250, timeout: 45_000 });
  readinessMs = Date.now() - readinessStartedAt;

  const readE1RoadState = () => page.evaluate(() => {
    const scene = window.__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    const roads = scene?.__phaseE1RoadSegments || [];
    const visible = roads.filter(road => road?.visible !== false && road?.active !== false).length;
    const legacyVisible = (scene?.__phaseE1LegacyWorldObjects || []).filter(item => item?.visible !== false && item?.active !== false).length;
    const hero = scene?.hero;
    let nearest = Infinity;
    if (hero) {
      for (const road of roads) {
        const x = Number(road?.x), y = Number(road?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        nearest = Math.min(nearest, Math.hypot(x - hero.x, y - hero.y));
      }
    }
    const firstRoad = roads[0];
    const roadDepth = Number(firstRoad?.depth ?? firstRoad?.getData?.('depth') ?? 0);
    const groundDepth = Number(scene?.__phaseE1GroundDepth ?? scene?.ground?.depth ?? 0);
    return { roads: roads.length, visible, legacyVisible, nearest, roadDepth, groundDepth };
  });

  const validateE1RoadState = state => {
    if (!state || state.roads <= 180) throw new Error(`E1 road persistence missing: ${JSON.stringify(state)}`);
    if (state.visible !== state.roads) throw new Error(`E1 road visibility changed: ${JSON.stringify(state)}`);
    if (state.legacyVisible !== 0) throw new Error(`E1 legacy terrain resurfaced: ${JSON.stringify(state)}`);
    if (!Number.isFinite(state.nearest) || state.nearest >= 260) throw new Error(`E1 nearby road coverage missing: ${JSON.stringify(state)}`);
    if (!(state.roadDepth > state.groundDepth)) throw new Error(`E1 road depth ordering regressed: ${JSON.stringify(state)}`);
  };

  const e1PersistenceBefore = await readE1RoadState();
  validateE1RoadState(e1PersistenceBefore);
  await page.waitForTimeout(2_000);
  const e1PersistenceAfter = await readE1RoadState();
  validateE1RoadState(e1PersistenceAfter);
  if (e1PersistenceAfter.roads !== e1PersistenceBefore.roads) {
    throw new Error(`E1 road count changed over real time: ${JSON.stringify({ before: e1PersistenceBefore, after: e1PersistenceAfter })}`);
  }

  let telemetryState = null;
  if (TELEMETRY_SMOKE) {
    telemetryState = await page.evaluate(async () => {
      const game = window.__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const shell = window.__WM_GAME_SHELL__;
      if (!scene?.sys?.isActive?.()) throw new Error('live telemetry scene unavailable');

      if (scene.spawnEvent) scene.spawnEvent.paused = true;
      if (scene.waveEvent) scene.waveEvent.paused = true;
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
        legacyLayoutExists: Boolean(window.__WM_END_RUN_LAYOUT__),
      };

      if (before.shellScreen !== 'results' || before.owner !== 'game-shell-results-v1' || before.resultsState !== 'active' || !before.resultsVisible) {
        throw new Error(`live canonical Results owner missing: ${JSON.stringify(before)}`);
      }
      if (!before.buttonVisible || !before.buttonEnabled || before.label !== 'SEND REPORT') {
        throw new Error(`live Results SEND REPORT control missing: ${JSON.stringify(before)}`);
      }
      if (before.legacyLayoutExists) {
        throw new Error(`legacy end-run layout resurfaced under canonical Results: ${JSON.stringify(before)}`);
      }

      reportButton.click();
      await new Promise(resolve => setTimeout(resolve, 120));
      return {
        before,
        label: reportButton.textContent?.trim() || null,
        status: reportStatus?.textContent?.trim() || null,
        manualState: document.documentElement.dataset.wreckmarchManualReport || null,
      };
    });

    if (telemetryState.label !== 'REPORT SENT' || telemetryState.manualState !== 'sent') {
      throw new Error(`live Results report submission failed: ${JSON.stringify(telemetryState)}`);
    }
  }

  const state = await readState();
  state.e1Persistence = { before: e1PersistenceBefore, after: e1PersistenceAfter };
  state.readinessMs = readinessMs;
  if (browserEvents.length) {
    throw new Error(`Browser emitted ${browserEvents.length} error event(s):\n${browserEvents.slice(-40).join('\n')}`);
  }
  console.log(JSON.stringify({ ok: true, url: URL, state, telemetryState, browserEvents }, null, 2));
} catch (error) {
  console.error(error?.stack || String(error));
  try {
    const state = await page?.evaluate?.(() => {
      const game = window.__WM_GAME__, scene = game?.scene?.getScene?.('Wreckmarch'), canvas = document.querySelector('#game canvas'), rect = canvas?.getBoundingClientRect?.();
      return {
        visualReady: document.body.classList.contains('visual-ready'),
        fullBleed: !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 && Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5,
        bootError: document.body.classList.contains('boot-error'),
        bootStatus: document.getElementById('boot-status')?.textContent || null,
        gameReady: !!game,
        sceneActive: !!scene?.sys?.isActive?.(),
        finalPolishReady: scene?.__finalPolishReady === true,
        sawbugVisual: document.documentElement.dataset.wreckmarchSawbugVisual || null,
        phaseE1: document.documentElement.dataset.wreckmarchPhaseE1 || null,
        e1SelfTest: document.documentElement.dataset.wreckmarchE1SelfTest || null,
        e1Persistence: document.documentElement.dataset.wreckmarchE1Persistence || null,
        finalPolish: document.documentElement.dataset.wreckmarchFinalPolish || null,
        mobileHud: document.documentElement.dataset.wreckmarchMobileHud || null,
        gameplayHud: document.documentElement.dataset.wreckmarchGameplayHud || null,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
        debugTail: document.getElementById('log')?.textContent?.slice(-12000) || null,
      };
    });
    if (state) state.readinessElapsedMs = readinessStartedAt ? Date.now() - readinessStartedAt : null;
    console.error('SMOKE_STATE', state);
    console.error('BROWSER_EVENTS', browserEvents.slice(-40));
  } catch (stateError) {
    console.error('SMOKE_STATE_READ_FAILED', stateError?.stack || String(stateError));
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}

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
      globalThis.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input?.url || String(input);
        if (url.startsWith('https://wreckmarch-run-reports.salahaseel82.workers.dev/') ||
            url.startsWith('https://wreckmarch-telemetry-probe.salahaseel82.workers.dev/')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true, accepted: true, submitted: true }), {
            status: 202,
            headers: { 'content-type': 'application/json' }
          }));
        }
        return nativeFetch(input, init);
      };
    });
  }

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });

  const readState = () => page.evaluate(() => {
    const game = window.__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const canvas = document.querySelector('#game canvas');
    const rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 &&
      Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return {
      canvas: !!canvas,
      visualReady: document.body.classList.contains('visual-ready'),
      fullBleed,
      gameReady: !!game,
      sceneActive: !!scene?.sys?.isActive?.(),
      finalPolishReady: scene?.__finalPolishReady === true,
      finalPolish: document.documentElement.dataset.wreckmarchFinalPolish || null,
      mobileHud: document.documentElement.dataset.wreckmarchMobileHud || null,
      gameplayHud: document.documentElement.dataset.wreckmarchGameplayHud || null,
      phaseE1: document.documentElement.dataset.wreckmarchPhaseE1 || null,
      e1SelfTest: document.documentElement.dataset.wreckmarchE1SelfTest || null,
      e1Persistence: document.documentElement.dataset.wreckmarchE1Persistence || null,
      sawbugVisual: document.documentElement.dataset.wreckmarchSawbugVisual || null,
      bootStatus: document.querySelector('#boot-status')?.textContent || null,
      bootError: document.body.classList.contains('boot-error'),
      debugTail: document.querySelector('#log')?.textContent?.slice(-4000) || '',
      viewport: { width: window.innerWidth, height: window.innerHeight },
      canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null
    };
  });

  await page.waitForFunction(() => {
    const game = window.__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const canvas = document.querySelector('#game canvas');
    const rect = canvas?.getBoundingClientRect?.();
    const fullBleed = !!rect && Math.abs(rect.left) < 1.5 && Math.abs(rect.top) < 1.5 &&
      Math.abs(rect.width - window.innerWidth) < 1.5 && Math.abs(rect.height - window.innerHeight) < 1.5;
    return !!canvas && document.body.classList.contains('visual-ready') && fullBleed && !!game &&
      !!scene?.sys?.isActive?.() && scene?.__finalPolishReady === true &&
      document.documentElement.dataset.wreckmarchFinalPolish === 'presentation-v1' &&
      document.documentElement.dataset.wreckmarchMobileHud === 'compact-v2' &&
      document.documentElement.dataset.wreckmarchPhaseE1 === 'active' &&
      document.documentElement.dataset.wreckmarchE1SelfTest === 'passed' &&
      document.documentElement.dataset.wreckmarchE1Persistence === 'passed';
  }, { timeout: 30_000 });

  const state = await readState();

  let telemetryState = null;
  if (TELEMETRY_SMOKE) {
    telemetryState = await page.evaluate(async () => {
      const game = window.__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      if (!scene?.sys?.isActive?.()) throw new Error('telemetry live smoke scene unavailable');
      scene.spawnEvent && (scene.spawnEvent.paused = true);
      scene.waveEvent && (scene.waveEvent.paused = true);
      scene.enemies?.clear?.(true, true);

      scene.endRun('LIVE TELEMETRY SMOKE');
      await new Promise(resolve => setTimeout(resolve, 80));

      const layout = window.__WM_END_RUN_LAYOUT__;
      const before = {
        endRunVersion: document.documentElement.dataset.wreckmarchEndRunLayout || null,
        ownerVersion: scene.__mobileHudEndRunOwnerVersion || null,
        buttonActive: layout?.reportBtn?.active === true,
        buttonVisible: layout?.reportBtn?.visible === true,
        label: layout?.reportLabel?.text || null,
        status: layout?.reportStatus?.text || null
      };

      if (!before.buttonActive || !before.buttonVisible || before.label !== 'SEND REPORT') {
        throw new Error(`live SEND REPORT control missing: ${JSON.stringify(before)}`);
      }
      if (before.endRunVersion !== 'runtime-v4' || before.ownerVersion !== 'runtime-v4') {
        throw new Error(`stale end-run owner: ${JSON.stringify(before)}`);
      }

      layout.reportBtn.emit('pointerdown');
      await new Promise(resolve => setTimeout(resolve, 120));

      return {
        before,
        label: layout?.reportLabel?.text || null,
        status: layout?.reportStatus?.text || null,
        manualState: document.documentElement.dataset.wreckmarchManualReport || null
      };
    });

    if (telemetryState.label !== 'REPORT SENT' || telemetryState.manualState !== 'sent') {
      throw new Error(`live manual telemetry send failed: ${JSON.stringify(telemetryState)}`);
    }
  }

  if (browserEvents.length) {
    throw new Error(`Browser emitted ${browserEvents.length} error event(s):\n${browserEvents.slice(-40).join('\n')}`);
  }
  console.log(JSON.stringify({ ok: true, url: URL, state, telemetryState, browserEvents }, null, 2));
} catch (error) {
  console.error(error?.stack || String(error));
  try {
    const state = await page?.evaluate?.(() => {
      const game = window.__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const canvas = document.querySelector('#game canvas');
      const rect = canvas?.getBoundingClientRect?.();
      return {
        visualReady: document.body.classList.contains('visual-ready'),
        bootError: document.body.classList.contains('boot-error'),
        bootStatus: document.querySelector('#boot-status')?.textContent || null,
        gameReady: !!game,
        sceneActive: !!scene?.sys?.isActive?.(),
        sawbugVisual: document.documentElement.dataset.wreckmarchSawbugVisual || null,
        phaseE1: document.documentElement.dataset.wreckmarchPhaseE1 || null,
        e1SelfTest: document.documentElement.dataset.wreckmarchE1SelfTest || null,
        e1Persistence: document.documentElement.dataset.wreckmarchE1Persistence || null,
        finalPolish: document.documentElement.dataset.wreckmarchFinalPolish || null,
        mobileHud: document.documentElement.dataset.wreckmarchMobileHud || null,
        canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
        debugTail: document.querySelector('#log')?.textContent?.slice(-8000) || ''
      };
    });
    console.error('SMOKE_STATE ' + JSON.stringify(state, null, 2));
    console.error('BROWSER_EVENTS ' + JSON.stringify(browserEvents.slice(-40), null, 2));
  } catch (stateError) {
    console.error('SMOKE_STATE_READ_FAILED ' + (stateError?.stack || stateError));
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}

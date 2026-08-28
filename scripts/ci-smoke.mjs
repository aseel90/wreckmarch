import { chromium } from '@playwright/test';

const URL = process.env.WM_SMOKE_URL || 'http://127.0.0.1:4173/?autotest=1&debug=1';
const CHROME = process.env.WM_CHROME_PATH || '/usr/bin/google-chrome';

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
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
  console.log(JSON.stringify({ ok: true, state }, null, 2));
} catch (error) {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
}

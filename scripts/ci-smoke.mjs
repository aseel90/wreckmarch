const CDP_HTTP = process.env.WM_CDP_HTTP || 'http://127.0.0.1:9222';
const PAGE_MATCH = process.env.WM_PAGE_MATCH || '127.0.0.1:4173';
const deadline = Date.now() + 30_000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function findPageTarget() {
  while (Date.now() < deadline) {
    try {
      const targets = await fetch(`${CDP_HTTP}/json/list`).then(response => response.json());
      const target = targets.find(item => item.type === 'page' && String(item.url || '').includes(PAGE_MATCH));
      if (target?.webSocketDebuggerUrl) return target;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome DevTools page target did not become available');
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => reject(new Error('Timed out connecting to Chrome DevTools')), 5_000);
    socket.addEventListener('open', () => {
      clearTimeout(timer);
      resolve(socket);
    }, { once: true });
    socket.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('Chrome DevTools WebSocket connection failed'));
    }, { once: true });
  });
}

const target = await findPageTarget();
const socket = await connect(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();

socket.addEventListener('message', event => {
  const message = JSON.parse(String(event.data));
  if (!message.id) return;
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error.message || 'CDP command failed'));
  else waiter.resolve(message.result);
});

function call(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await call('Runtime.enable');

const expression = `(() => {
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
})()`;

let state = null;
while (Date.now() < deadline) {
  const response = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  state = response?.result?.value || null;
  const ready = state?.canvas && state?.visualReady && state?.fullBleed && state?.gameReady &&
    state?.sceneActive && state?.finalPolishReady && state?.finalPolish === 'presentation-v1' &&
    state?.mobileHud === 'compact-v2' && state?.gameplayHud === 'visible' && state?.phaseE1 === 'active' &&
    state?.e1SelfTest === 'passed' && state?.e1Persistence === 'passed';
  if (ready) {
    console.log(JSON.stringify({ ok: true, state }, null, 2));
    socket.close();
    process.exit(0);
  }
  if (state?.e1SelfTest === 'failed' || state?.e1Persistence === 'failed') break;
  await sleep(500);
}

console.error(JSON.stringify({ ok: false, state }, null, 2));
socket.close();
process.exit(1);

const STYLESHEET_ID = 'wm-frontend-shell-styles';

const PAUSE_ACTIONS = Object.freeze([
  Object.freeze({ id: 'resume', label: 'RESUME', eyebrow: 'RETURN TO RUN', enabled: true, primary: true }),
  Object.freeze({ id: 'settings', label: 'SETTINGS', eyebrow: 'SYSTEM', enabled: true }),
  Object.freeze({ id: 'restart', label: 'RESTART RUN', eyebrow: 'RUN CONTROL', enabled: true }),
  Object.freeze({ id: 'exit', label: 'EXIT TO MAIN', eyebrow: 'RUN CONTROL', enabled: true, danger: true }),
]);

function ensureStylesheet() {
  const existing = document.getElementById(STYLESHEET_ID);
  if (existing) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('./frontend-shell.css?v=4', import.meta.url).href;
  document.head.append(link);
}

function makePauseAction(action, statusEl, resolve) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `wm-pause-action${action.primary ? ' is-primary' : ''}${action.danger ? ' is-danger' : ''}`;
  button.dataset.pauseAction = action.id;
  button.dataset.enabled = String(action.enabled);

  const copy = document.createElement('span');
  copy.className = 'wm-pause-action-copy';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'wm-pause-action-eyebrow';
  eyebrow.textContent = action.eyebrow;
  const label = document.createElement('strong');
  label.textContent = action.label;
  copy.append(eyebrow, label);

  const state = document.createElement('span');
  state.className = 'wm-pause-action-state';
  state.textContent = action.enabled ? 'OPEN' : action.pendingLabel;

  button.append(copy, state);
  button.addEventListener('click', () => {
    if (!action.enabled) {
      statusEl.textContent = `${action.label} // ${action.pendingLabel}.`;
      button.classList.remove('wm-denied');
      requestAnimationFrame(() => button.classList.add('wm-denied'));
      return;
    }
    resolve(Object.freeze({ action: action.id }));
  });
  return button;
}

export function showPauseScreen() {
  ensureStylesheet();
  document.body.classList.add('wm-pause-active');

  return new Promise(resolvePromise => {
    const screen = document.createElement('section');
    screen.className = 'wm-pause-screen';
    screen.setAttribute('role', 'dialog');
    screen.setAttribute('aria-modal', 'true');
    screen.setAttribute('aria-labelledby', 'wm-pause-title');

    const panel = document.createElement('div');
    panel.className = 'wm-pause-panel';

    const header = document.createElement('header');
    header.className = 'wm-pause-header';
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WRECKMARCH // RUN CONTROL';
    const title = document.createElement('h1');
    title.id = 'wm-pause-title';
    title.textContent = 'RUN PAUSED';
    const subtitle = document.createElement('p');
    subtitle.textContent = 'The wasteland is frozen. Resume when ready.';
    header.append(kicker, title, subtitle);

    const actions = document.createElement('div');
    actions.className = 'wm-pause-actions';

    const status = document.createElement('p');
    status.className = 'wm-pause-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'SIMULATION HOLD // ACTIVE';

    const finish = result => {
      screen.querySelectorAll('button').forEach(button => { button.disabled = true; });
      screen.remove();
      document.body.classList.remove('wm-pause-active');
      resolvePromise(result);
    };

    for (const action of PAUSE_ACTIONS) actions.append(makePauseAction(action, status, finish));

    const footer = document.createElement('footer');
    footer.className = 'wm-pause-footer';
    footer.textContent = 'PAUSE STATE IS OWNED BY THE GAMEPLAY RUNTIME';

    panel.append(header, actions, status, footer);
    screen.append(panel);
    document.body.append(screen);

    const resume = actions.querySelector('[data-pause-action="resume"]');
    resume?.focus({ preventScroll: true });
  });
}

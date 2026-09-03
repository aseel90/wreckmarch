import { SCREEN_IDS } from './screen-registry.js?v=2';
import { progressionStore } from '../progression/progression-store.js?v=3';
import { getActiveTerminalPlate } from '../workshop/workshop-catalog.js?v=1';

const STYLESHEET_ID = 'wm-frontend-shell-styles';
const WORKSHOP_STYLESHEET_ID = 'wm-workshop-styles';

const MAIN_ACTIONS = Object.freeze([
  Object.freeze({
    screenId: SCREEN_IDS.CHARACTER_SELECT,
    label: 'PLAY',
    eyebrow: 'DEPLOY',
    detail: 'Choose a survivor and enter the wasteland.',
    enabled: true,
    primary: true,
  }),
  Object.freeze({
    screenId: SCREEN_IDS.SETTINGS,
    label: 'SETTINGS',
    eyebrow: 'SYSTEM',
    detail: 'Audio, controls and accessibility.',
    enabled: true,
  }),
  Object.freeze({
    screenId: SCREEN_IDS.SHOP,
    label: 'WORKSHOP',
    eyebrow: 'FABRICATION',
    detail: 'Permanent records, Scrip and terminal cosmetics.',
    enabled: true,
  }),
  Object.freeze({
    screenId: SCREEN_IDS.LEADERBOARD,
    label: 'LEADERBOARD',
    eyebrow: 'SIGNAL',
    detail: 'Run rankings and comparison.',
    enabled: false,
    pendingLabel: 'OFFLINE',
  }),
]);

function ensureStylesheet() {
  const existing = document.getElementById(STYLESHEET_ID);
  if (existing) {
    const expected = new URL('./frontend-shell.css?v=3', import.meta.url).href;
    if (existing.href !== expected) existing.href = expected;
    return;
  }
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('./frontend-shell.css?v=3', import.meta.url).href;
  document.head.append(link);
}

function ensureWorkshopStylesheet() {
  if (document.getElementById(WORKSHOP_STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = WORKSHOP_STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('../workshop/workshop.css?v=1', import.meta.url).href;
  document.head.append(link);
}

function makeWreck(asset, className, alt = '') {
  const image = document.createElement('img');
  image.className = className;
  image.src = new URL(`../../assets/wasteland/${asset}`, import.meta.url).href;
  image.alt = alt;
  image.draggable = false;
  image.setAttribute('aria-hidden', alt ? 'false' : 'true');
  return image;
}

function makeMenuAction(action, statusEl, resolve) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `wm-main-action${action.primary ? ' is-primary' : ''}`;
  button.dataset.screenId = action.screenId;
  button.dataset.enabled = String(action.enabled);

  const copy = document.createElement('span');
  copy.className = 'wm-main-action-copy';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'wm-main-action-eyebrow';
  eyebrow.textContent = action.eyebrow;
  const label = document.createElement('strong');
  label.textContent = action.label;
  const detail = document.createElement('span');
  detail.className = 'wm-main-action-detail';
  detail.textContent = action.detail;
  copy.append(eyebrow, label, detail);

  const state = document.createElement('span');
  state.className = 'wm-main-action-state';
  state.textContent = action.enabled ? 'OPEN' : action.pendingLabel;
  button.append(copy, state);
  button.addEventListener('click', () => {
    if (!action.enabled) {
      statusEl.textContent = `${action.label} // ${action.pendingLabel}.`;
      button.classList.remove('wm-denied');
      requestAnimationFrame(() => button.classList.add('wm-denied'));
      return;
    }
    statusEl.textContent = `${action.label} // OPENING…`;
    resolve(Object.freeze({ screenId: action.screenId }));
  });
  return button;
}

export function showMainMenu() {
  ensureStylesheet();
  ensureWorkshopStylesheet();
  document.body.classList.add('wm-main-active');

  return new Promise(resolvePromise => {
    const screen = document.createElement('section');
    screen.className = 'wm-shell-screen wm-main-screen';
    screen.setAttribute('aria-labelledby', 'wm-main-title');

    const atmosphere = document.createElement('div');
    atmosphere.className = 'wm-main-atmosphere';
    atmosphere.append(
      makeWreck('wreck-a.svg', 'wm-main-wreck wm-main-wreck-a'),
      makeWreck('wreck-b.svg', 'wm-main-wreck wm-main-wreck-b'),
    );

    const brand = document.createElement('header');
    brand.className = 'wm-main-brand';
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WASTELAND DEPLOYMENT // ONLINE';
    const title = document.createElement('h1');
    title.id = 'wm-main-title';
    title.textContent = 'WRECKMARCH';
    const motto = document.createElement('p');
    motto.className = 'wm-main-motto';
    motto.textContent = 'BUILD • ROLL • SURVIVE';
    const description = document.createElement('p');
    description.className = 'wm-main-description';
    description.textContent = 'Scavenge scrap. Build a run. Keep moving when the wasteland closes in.';
    brand.append(kicker, title, motto, description);
    const terminalPlate = getActiveTerminalPlate(progressionStore.snapshot());
    if (terminalPlate) {
      const plate = document.createElement('div');
      plate.className = 'wm-workshop-terminal-plate wm-main-terminal-plate';
      plate.dataset.workshopItemId = terminalPlate.id;
      plate.textContent = terminalPlate.presentation.label;
      brand.append(plate);
    }

    const panel = document.createElement('div');
    panel.className = 'wm-main-panel';
    const panelHeader = document.createElement('div');
    panelHeader.className = 'wm-main-panel-header';
    const panelLabel = document.createElement('span');
    panelLabel.textContent = 'DEPLOYMENT TERMINAL';
    const panelCode = document.createElement('span');
    panelCode.textContent = 'WM-01';
    panelHeader.append(panelLabel, panelCode);

    const status = document.createElement('p');
    status.className = 'wm-main-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'SELECT AN ACTION.';
    const actions = document.createElement('div');
    actions.className = 'wm-main-actions';

    const finish = result => {
      actions.querySelectorAll('button').forEach(button => { button.disabled = true; });
      window.setTimeout(() => {
        screen.remove();
        document.body.classList.remove('wm-main-active');
        resolvePromise(result);
      }, 120);
    };
    for (const action of MAIN_ACTIONS) actions.append(makeMenuAction(action, status, finish));

    const footer = document.createElement('footer');
    footer.className = 'wm-main-footer';
    footer.innerHTML = '<span>SCRAP RUNNER PROGRAM</span><span>LANDSCAPE MOBILE BUILD</span>';
    panel.append(panelHeader, actions, status);
    screen.append(atmosphere, brand, panel, footer);
    document.body.append(screen);
  });
}

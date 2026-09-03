import { listCharacterSelectOptions, resolveCharacterSelection } from './character-select-model.js?v=1';

const STYLESHEET_ID = 'wm-frontend-shell-styles';

function ensureStylesheet() {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('./frontend-shell.css?v=1', import.meta.url).href;
  document.head.append(link);
}

function makeImage(src, className, alt) {
  if (!src) return null;
  const image = document.createElement('img');
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  image.addEventListener('error', () => image.classList.add('is-missing'), { once: true });
  return image;
}

function makeCharacterCard(option, statusEl, resolve) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wm-character-card';
  button.dataset.characterId = option.id;
  button.dataset.availability = option.availability;
  button.setAttribute('aria-label', `${option.displayName} — ${option.availability}`);

  const art = document.createElement('span');
  art.className = 'wm-character-art';
  const body = makeImage(option.preview?.bodyAsset, 'wm-character-body', `${option.displayName} preview`);
  if (body) art.append(body);
  const weapon = makeImage(option.preview?.weaponAsset, 'wm-character-weapon', '');
  if (weapon) {
    weapon.setAttribute('aria-hidden', 'true');
    art.append(weapon);
  }

  const meta = document.createElement('span');
  meta.className = 'wm-character-meta';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'wm-character-eyebrow';
  eyebrow.textContent = option.selectable ? 'READY FOR RUN' : 'CHARACTER PREVIEW';
  const name = document.createElement('strong');
  name.textContent = option.displayName;
  const state = document.createElement('span');
  state.className = 'wm-character-state';
  state.textContent = option.selectable ? 'SELECT' : 'LOCKED';
  meta.append(eyebrow, name, state);

  button.append(art, meta);
  button.addEventListener('click', () => {
    const result = resolveCharacterSelection(option.id);
    if (!result.selectable) {
      statusEl.textContent = `${option.displayName.toUpperCase()} IS LOCKED — COMPLETE ITS PRODUCTION GATE FIRST.`;
      button.classList.remove('wm-denied');
      requestAnimationFrame(() => button.classList.add('wm-denied'));
      return;
    }
    statusEl.textContent = `${option.displayName.toUpperCase()} SELECTED — PREPARING RUN…`;
    resolve(result);
  });
  return button;
}

export function chooseCharacter() {
  ensureStylesheet();
  document.body.classList.add('wm-character-select-active');

  return new Promise(resolvePromise => {
    const screen = document.createElement('section');
    screen.className = 'wm-shell-screen wm-character-select';
    screen.setAttribute('aria-labelledby', 'wm-character-select-title');

    const header = document.createElement('header');
    header.className = 'wm-character-select-header';
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WRECKMARCH // PRE-RUN';
    const title = document.createElement('h1');
    title.id = 'wm-character-select-title';
    title.textContent = 'CHOOSE YOUR SURVIVOR';
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Pick a character to enter the wasteland. Locked characters can be previewed but cannot start a run.';
    header.append(kicker, title, subtitle);

    const status = document.createElement('p');
    status.className = 'wm-character-select-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'SELECT A DEPLOYABLE CHARACTER TO BEGIN.';

    const grid = document.createElement('div');
    grid.className = 'wm-character-grid';

    const finish = result => {
      grid.querySelectorAll('button').forEach(button => { button.disabled = true; });
      window.setTimeout(() => {
        screen.remove();
        document.body.classList.remove('wm-character-select-active');
        resolvePromise(result);
      }, 120);
    };

    for (const option of listCharacterSelectOptions()) {
      grid.append(makeCharacterCard(option, status, finish));
    }

    const footer = document.createElement('footer');
    footer.className = 'wm-character-select-footer';
    footer.textContent = 'CHARACTER AVAILABILITY IS CONTROLLED BY THE CANONICAL REGISTRY';

    screen.append(header, grid, status, footer);
    document.body.append(screen);
  });
}

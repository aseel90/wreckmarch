import { settingsStore } from './settings-store.js?v=1';

const STYLESHEET_ID = 'wm-frontend-shell-styles';

const SETTING_ROWS = Object.freeze([
  Object.freeze({
    key: 'audioEnabled',
    eyebrow: 'AUDIO',
    label: 'COMBAT AUDIO',
    detail: 'Weapon tones, impacts and run feedback.',
  }),
  Object.freeze({
    key: 'screenShakeEnabled',
    eyebrow: 'FEEDBACK',
    label: 'SCREEN SHAKE',
    detail: 'Camera impact feedback during combat.',
  }),
]);

function ensureStylesheet() {
  const existing = document.getElementById(STYLESHEET_ID);
  if (existing) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('./frontend-shell.css?v=3', import.meta.url).href;
  document.head.append(link);
}

function makeToggle(row) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wm-setting-row';
  button.dataset.settingKey = row.key;

  const copy = document.createElement('span');
  copy.className = 'wm-setting-copy';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'wm-setting-eyebrow';
  eyebrow.textContent = row.eyebrow;
  const label = document.createElement('strong');
  label.textContent = row.label;
  const detail = document.createElement('span');
  detail.className = 'wm-setting-detail';
  detail.textContent = row.detail;
  copy.append(eyebrow, label, detail);

  const toggle = document.createElement('span');
  toggle.className = 'wm-setting-toggle';

  const sync = () => {
    const enabled = settingsStore.get(row.key);
    button.dataset.value = enabled ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'ON' : 'OFF';
  };

  button.append(copy, toggle);
  button.addEventListener('click', () => {
    settingsStore.set(row.key, !settingsStore.get(row.key));
    sync();
  });
  sync();
  return button;
}

export function showSettingsScreen({ returnLabel = 'BACK' } = {}) {
  ensureStylesheet();
  document.body.classList.add('wm-settings-active');

  return new Promise(resolve => {
    const screen = document.createElement('section');
    screen.className = 'wm-shell-screen wm-settings-screen';
    screen.setAttribute('aria-labelledby', 'wm-settings-title');

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'wm-shell-back';
    back.textContent = `← ${returnLabel}`;

    const header = document.createElement('header');
    header.className = 'wm-settings-header';
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WRECKMARCH // SYSTEM CONFIG';
    const title = document.createElement('h1');
    title.id = 'wm-settings-title';
    title.textContent = 'SETTINGS';
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Changes apply immediately and persist on this device.';
    header.append(kicker, title, subtitle);

    const panel = document.createElement('div');
    panel.className = 'wm-settings-panel';
    for (const row of SETTING_ROWS) panel.append(makeToggle(row));

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'wm-settings-reset';
    reset.textContent = 'RESET DEFAULTS';
    reset.addEventListener('click', () => {
      settingsStore.reset();
      panel.querySelectorAll('.wm-setting-row').forEach(button => {
        const key = button.dataset.settingKey;
        const enabled = settingsStore.get(key);
        button.dataset.value = enabled ? 'on' : 'off';
        button.setAttribute('aria-pressed', String(enabled));
        button.querySelector('.wm-setting-toggle').textContent = enabled ? 'ON' : 'OFF';
      });
    });

    const footer = document.createElement('footer');
    footer.className = 'wm-settings-footer';
    footer.textContent = 'SETTINGS ARE OWNED BY ONE PERSISTENT STORE';

    const finish = () => {
      screen.querySelectorAll('button').forEach(button => { button.disabled = true; });
      screen.remove();
      document.body.classList.remove('wm-settings-active');
      resolve(Object.freeze({ action: 'back' }));
    };
    back.addEventListener('click', finish);

    screen.append(back, header, panel, reset, footer);
    document.body.append(screen);
  });
}

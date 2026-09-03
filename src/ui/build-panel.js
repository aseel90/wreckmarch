import { createRunBuildSnapshot } from '../upgrades/run-build-snapshot.js?v=1';

const STYLESHEET_ID = 'wm-build-panel-styles';

function ensureStylesheet() {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('./build-panel.css?v=1', import.meta.url).href;
  document.head.append(link);
}

function formatNumber(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return Number.isInteger(number) ? String(number) : number.toFixed(digits).replace(/\.0$/, '');
}

function formatPercent(value) { const number=Number(value); return Number.isFinite(number) ? `${formatNumber(number * 100, 1)}%` : '—'; }
function formatMultiplier(value) { const number=Number(value); return Number.isFinite(number) ? `${formatNumber(number, 2)}×` : '—'; }

function statRow(label, value, key) {
  const row = document.createElement('div');
  row.className = 'wm-build-stat';
  if (key) row.dataset.buildStat = key;
  const name = document.createElement('span');
  name.textContent = label;
  const output = document.createElement('strong');
  output.className = 'wm-build-stat-value';
  output.textContent = value;
  row.append(name, output);
  return row;
}

function buildStatCard(title, kicker, rows) {
  const card = document.createElement('section');
  card.className = 'wm-build-card';
  const header = document.createElement('header');
  const eyebrow = document.createElement('span');
  eyebrow.textContent = kicker;
  const heading = document.createElement('h2');
  heading.textContent = title;
  header.append(eyebrow, heading);
  const body = document.createElement('div');
  body.className = 'wm-build-card-body';
  rows.forEach(row => body.append(row));
  card.append(header, body);
  return card;
}

function characterCard(snapshot) {
  const s = snapshot.character.stats;
  return buildStatCard(snapshot.character.displayName, 'SURVIVOR', [
    statRow('HP', `${formatNumber(snapshot.character.hp.current)} / ${formatNumber(snapshot.character.hp.max)}`, 'character.hp'),
    statRow('MOVE SPEED', formatNumber(s.moveSpeed), 'character.moveSpeed'),
    statRow('ARMOR', formatNumber(s.armor), 'character.armor'),
    statRow('CRIT CHANCE', formatPercent(s.critChance), 'character.critChance'),
    statRow('CRIT DAMAGE', formatMultiplier(s.critDamageMultiplier), 'character.critDamageMultiplier'),
    statRow('PICKUP RANGE', formatMultiplier(s.pickupRadiusMultiplier), 'character.pickupRadiusMultiplier'),
  ]);
}

function weaponCard(snapshot) {
  const s = snapshot.weapon.stats;
  const v = snapshot.weapon.volley;
  return buildStatCard(snapshot.weapon.displayName, 'SIGNATURE WEAPON', [
    statRow('DAMAGE', formatNumber(s.damage), 'weapon.damage'),
    statRow('FIRE RATE', `${formatNumber(snapshot.weapon.fireRatePerSecond, 2)}/s`, 'weapon.fireRatePerSecond'),
    statRow('RANGE', formatNumber(s.range), 'weapon.range'),
    statRow('PROJECTILES', formatNumber(v.projectileCount), 'weapon.projectileCount'),
    statRow('VOLLEY', formatMultiplier(v.volleyDamageMultiplier), 'weapon.volleyDamageMultiplier'),
    statRow('PIERCE', formatNumber(s.pierceCount), 'weapon.pierceCount'),
    statRow('RICOCHET', formatNumber(s.ricochetCount), 'weapon.ricochetCount'),
    statRow('SHRAPNEL', formatNumber(s.shrapnelCount), 'weapon.shrapnelCount'),
  ]);
}

function upgradesCard(snapshot) {
  const rows = snapshot.upgrades.length
    ? snapshot.upgrades.map(upgrade => {
        const rarity = upgrade.latestRarity ? ` • ${upgrade.latestRarity}` : '';
        return statRow(upgrade.title, `LV ${upgrade.level}/${upgrade.maxLevel}${rarity}`, `upgrade.${upgrade.id}`);
      })
    : [statRow('NO UPGRADES YET', 'BASELINE', 'upgrade.empty')];
  return buildStatCard('CURRENT BUILD', 'RUN LOADOUT', rows);
}

export function showBuildPanel(scene) {
  ensureStylesheet();
  const snapshot = createRunBuildSnapshot(scene);
  document.body.classList.add('wm-build-active');

  return new Promise(resolve => {
    const overlay = document.createElement('section');
    overlay.className = 'wm-build-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'wm-build-title');

    const panel = document.createElement('div');
    panel.className = 'wm-build-panel';
    panel.dataset.buildSnapshotVersion = snapshot.version;

    const header = document.createElement('header');
    header.className = 'wm-build-header';
    const copy = document.createElement('div');
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WRECKMARCH // LIVE BUILD';
    const title = document.createElement('h1');
    title.id = 'wm-build-title';
    title.textContent = 'RUN BUILD';
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Resolved combat values from the active run. Read-only.';
    copy.append(kicker, title, subtitle);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'wm-build-close';
    close.dataset.buildAction = 'close';
    close.textContent = 'BACK TO PAUSE';
    header.append(copy, close);

    const grid = document.createElement('div');
    grid.className = 'wm-build-grid';
    grid.append(characterCard(snapshot), weaponCard(snapshot), upgradesCard(snapshot));

    const footer = document.createElement('footer');
    footer.className = 'wm-build-footer';
    footer.textContent = 'SOURCE // RUN STAT STATE + WEAPON SYSTEM VOLLEY PROFILE';

    const finish = () => {
      overlay.remove();
      document.body.classList.remove('wm-build-active');
      resolve(Object.freeze({ action: 'close', snapshot }));
    };
    close.addEventListener('click', finish);
    overlay.addEventListener('click', event => { if (event.target === overlay) finish(); });

    panel.append(header, grid, footer);
    overlay.append(panel);
    document.body.append(overlay);
    close.focus({ preventScroll: true });
  });
}

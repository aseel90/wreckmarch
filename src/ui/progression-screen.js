import { progressionStore } from '../progression/progression-store.js?v=1';
import { listCharacterEntries } from '../characters/character-registry.js?v=5';

const SHELL_STYLESHEET_ID = 'wm-frontend-shell-styles';
const PROGRESSION_STYLESHEET_ID = 'wm-progression-styles';

function ensureStylesheets() {
  if (!document.getElementById(SHELL_STYLESHEET_ID)) {
    const shell = document.createElement('link');
    shell.id = SHELL_STYLESHEET_ID;
    shell.rel = 'stylesheet';
    shell.href = new URL('./frontend-shell.css?v=3', import.meta.url).href;
    document.head.append(shell);
  }
  if (!document.getElementById(PROGRESSION_STYLESHEET_ID)) {
    const progression = document.createElement('link');
    progression.id = PROGRESSION_STYLESHEET_ID;
    progression.rel = 'stylesheet';
    progression.href = new URL('./progression.css?v=1', import.meta.url).href;
    document.head.append(progression);
  }
}

function stat(label, value) {
  const item = document.createElement('div');
  item.className = 'wm-progression-stat';
  const name = document.createElement('span');
  name.textContent = label;
  const strong = document.createElement('strong');
  strong.textContent = value;
  item.append(name, strong);
  return item;
}

export function showProgressionScreen() {
  ensureStylesheets();
  document.body.classList.add('wm-progression-active');
  const profile = progressionStore.snapshot();

  return new Promise(resolve => {
    const screen = document.createElement('section');
    screen.className = 'wm-shell-screen wm-progression-screen';
    screen.setAttribute('aria-labelledby', 'wm-progression-title');

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'wm-shell-back';
    back.textContent = '← MAIN';

    const header = document.createElement('header');
    header.className = 'wm-progression-header';
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WRECKMARCH // WORKSHOP RECORD';
    const title = document.createElement('h1');
    title.id = 'wm-progression-title';
    title.textContent = 'PROGRESSION';
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Persistent run records only. Economy and purchases stay disabled until their product contract exists.';
    header.append(kicker, title, subtitle);

    const stats = document.createElement('div');
    stats.className = 'wm-progression-stats';
    stats.append(
      stat('RUNS', String(profile.totalRuns)),
      stat('BEST SURVIVAL', `${profile.bestSurvivalSeconds}s`),
      stat('HIGHEST LEVEL', String(profile.highestLevel)),
      stat('LIFETIME SCRAP', String(profile.lifetimeScrapCollected)),
    );

    const roster = document.createElement('section');
    roster.className = 'wm-progression-roster';
    const rosterTitle = document.createElement('h2');
    rosterTitle.textContent = 'SURVIVOR PROGRAM';
    const rosterGrid = document.createElement('div');
    rosterGrid.className = 'wm-progression-roster-grid';
    for (const entry of listCharacterEntries()) {
      const row = document.createElement('div');
      row.className = 'wm-progression-survivor';
      row.dataset.availability = entry.availability;
      const name = document.createElement('strong');
      name.textContent = entry.displayName;
      const state = document.createElement('span');
      state.textContent = entry.availability === 'selectable' ? 'DEPLOYABLE' : 'PRODUCTION LOCKED';
      row.append(name, state);
      rosterGrid.append(row);
    }
    roster.append(rosterTitle, rosterGrid);

    const note = document.createElement('p');
    note.className = 'wm-progression-note';
    note.textContent = 'LIFETIME SCRAP IS A RUN STATISTIC — IT IS NOT A SHOP CURRENCY.';
    const footer = document.createElement('footer');
    footer.className = 'wm-progression-footer';
    footer.textContent = 'NO CHARACTER PURCHASE OR SHOTGUN UNLOCK IS AUTHORIZED BY THIS SCREEN';

    const finish = () => {
      screen.remove();
      document.body.classList.remove('wm-progression-active');
      resolve(Object.freeze({ action: 'back' }));
    };
    back.addEventListener('click', finish);
    screen.append(back, header, stats, roster, note, footer);
    document.body.append(screen);
  });
}

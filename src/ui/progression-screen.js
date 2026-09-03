import { progressionStore } from '../progression/progression-store.js?v=2';
import { evaluateProgressionMilestones, getWorkshopRank } from '../progression/progression-milestones.js?v=1';
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
    progression.href = new URL('./progression.css?v=4', import.meta.url).href;
    document.head.append(progression);
  }
}

function stat(label, value, statId = '') {
  const item = document.createElement('div');
  item.className = 'wm-progression-stat';
  if (statId) item.dataset.stat = statId;
  const name = document.createElement('span');
  name.textContent = label;
  const strong = document.createElement('strong');
  strong.textContent = value;
  item.append(name, strong);
  return item;
}

function makeMilestone(milestone) {
  const item = document.createElement('article');
  item.className = 'wm-progression-milestone';
  item.dataset.complete = String(milestone.complete);
  item.dataset.milestoneId = milestone.id;

  const copy = document.createElement('div');
  copy.className = 'wm-progression-milestone-copy';
  const label = document.createElement('strong');
  label.textContent = milestone.label;
  const detail = document.createElement('span');
  detail.textContent = milestone.detail;
  copy.append(label, detail);

  const status = document.createElement('div');
  status.className = 'wm-progression-milestone-status';
  const state = document.createElement('strong');
  state.textContent = milestone.complete ? 'STAMPED' : milestone.progressLabel;
  const rail = document.createElement('span');
  rail.className = 'wm-progression-milestone-rail';
  const fill = document.createElement('i');
  fill.style.width = `${Math.round(milestone.progress * 100)}%`;
  rail.append(fill);
  status.append(state, rail);

  item.append(copy, status);
  return item;
}

export function showProgressionScreen() {
  ensureStylesheets();
  document.body.classList.add('wm-progression-active');
  const profile = progressionStore.snapshot();
  const milestones = evaluateProgressionMilestones(profile);
  const workshopRank = getWorkshopRank(profile);

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
    subtitle.textContent = 'Permanent field records, Workshop Scrip and milestones. Purchasing remains production-gated until the catalog contract is complete.';
    header.append(kicker, title, subtitle);

    const rank = document.createElement('section');
    rank.className = 'wm-progression-rank';
    rank.dataset.completedMilestones = String(workshopRank.completed);
    const rankCopy = document.createElement('div');
    const rankEyebrow = document.createElement('span');
    rankEyebrow.textContent = 'WORKSHOP RANK';
    const rankName = document.createElement('strong');
    rankName.textContent = workshopRank.label;
    rankCopy.append(rankEyebrow, rankName);
    const rankCount = document.createElement('strong');
    rankCount.textContent = `${workshopRank.completed}/${workshopRank.total} STAMPS`;
    rank.append(rankCopy, rankCount);

    const stats = document.createElement('div');
    stats.className = 'wm-progression-stats';
    stats.append(
      stat('RUNS', String(profile.totalRuns)),
      stat('BEST SURVIVAL', `${profile.bestSurvivalSeconds}s`),
      stat('HIGHEST LEVEL', String(profile.highestLevel)),
      stat('LIFETIME SCRAP', String(profile.lifetimeScrapCollected)),
      stat('WORKSHOP SCRIP', String(profile.workshopScrip), 'workshop-scrip'),
    );

    const milestoneSection = document.createElement('section');
    milestoneSection.className = 'wm-progression-milestones';
    const milestoneTitle = document.createElement('h2');
    milestoneTitle.textContent = 'FIELD STAMPS';
    const milestoneGrid = document.createElement('div');
    milestoneGrid.className = 'wm-progression-milestone-grid';
    milestones.forEach(milestone => milestoneGrid.append(makeMilestone(milestone)));
    milestoneSection.append(milestoneTitle, milestoneGrid);

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
    note.textContent = 'SCRAP REMAINS AN IN-RUN STATISTIC. WORKSHOP SCRIP IS A SEPARATE PERMANENT CURRENCY — PURCHASING IS STILL LOCKED.';
    const footer = document.createElement('footer');
    footer.className = 'wm-progression-footer';
    footer.textContent = 'SCRIP, RANK AND FIELD STAMPS CANNOT OVERRIDE PRODUCTION LOCKS OR GRANT COMBAT POWER';

    const finish = () => {
      screen.remove();
      document.body.classList.remove('wm-progression-active');
      resolve(Object.freeze({ action: 'back' }));
    };
    back.addEventListener('click', finish);
    screen.append(back, header, rank, stats, milestoneSection, roster, note, footer);
    document.body.append(screen);
  });
}

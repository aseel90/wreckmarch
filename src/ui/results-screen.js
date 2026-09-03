import { getCharacterEntry } from '../characters/character-registry.js?v=5';

const STYLESHEET_ID = 'wm-frontend-shell-styles';
const RESULTS_STYLESHEET_ID = 'wm-results-styles';

function ensureStylesheets() {
  if (!document.getElementById(STYLESHEET_ID)) {
    const shell = document.createElement('link');
    shell.id = STYLESHEET_ID;
    shell.rel = 'stylesheet';
    shell.href = new URL('./frontend-shell.css?v=3', import.meta.url).href;
    document.head.append(shell);
  }
  if (!document.getElementById(RESULTS_STYLESHEET_ID)) {
    const results = document.createElement('link');
    results.id = RESULTS_STYLESHEET_ID;
    results.rel = 'stylesheet';
    results.href = new URL('./results.css?v=1', import.meta.url).href;
    document.head.append(results);
  }
}

function characterDisplayName(characterId) {
  try { return getCharacterEntry(characterId).displayName; }
  catch { return String(characterId || 'UNKNOWN').toUpperCase(); }
}

function stat(label, value) {
  const item = document.createElement('div');
  item.className = 'wm-result-stat';
  const name = document.createElement('span');
  name.textContent = label;
  const strong = document.createElement('strong');
  strong.textContent = value;
  item.append(name, strong);
  return item;
}

export function showResultsScreen(result, { sendReport } = {}) {
  if (!result) throw new TypeError('Results screen requires a canonical result');
  ensureStylesheets();
  document.body.classList.add('wm-results-active');
  document.documentElement.dataset.wreckmarchResults = 'active';

  return new Promise(resolve => {
    const screen = document.createElement('section');
    screen.className = 'wm-shell-screen wm-results-screen';
    screen.setAttribute('aria-labelledby', 'wm-results-title');

    const header = document.createElement('header');
    header.className = 'wm-results-header';
    const kicker = document.createElement('span');
    kicker.className = 'wm-shell-kicker';
    kicker.textContent = 'WRECKMARCH // RUN REPORT';
    const title = document.createElement('h1');
    title.id = 'wm-results-title';
    title.textContent = result.reason;
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Run data captured. Choose the next deployment.';
    header.append(kicker, title, subtitle);

    const stats = document.createElement('div');
    stats.className = 'wm-results-stats';
    stats.append(
      stat('SURVIVED', `${result.survivedSeconds}s`),
      stat('SCRAP', String(result.scrap)),
      stat('LEVEL', String(result.level)),
      stat('SURVIVOR', characterDisplayName(result.characterId)),
    );

    const actions = document.createElement('div');
    actions.className = 'wm-results-actions';

    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'wm-results-action is-primary';
    replay.dataset.resultsAction = 'play-again';
    replay.innerHTML = '<span>PLAY AGAIN</span><small>RETURN TO CHARACTER SELECT</small>';

    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'wm-results-action';
    main.dataset.resultsAction = 'main';
    main.innerHTML = '<span>MAIN MENU</span><small>RETURN TO DEPLOYMENT TERMINAL</small>';

    actions.append(replay, main);

    const reportWrap = document.createElement('div');
    reportWrap.className = 'wm-results-report';
    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'wm-results-report-button';
    report.textContent = 'SEND REPORT';
    const reportStatus = document.createElement('span');
    reportStatus.setAttribute('aria-live', 'polite');
    reportStatus.textContent = typeof sendReport === 'function' ? 'TELEMETRY READY' : 'TELEMETRY UNAVAILABLE';
    report.disabled = typeof sendReport !== 'function';
    reportWrap.append(report, reportStatus);

    report.addEventListener('click', async () => {
      if (report.disabled) return;
      report.disabled = true;
      report.textContent = 'SENDING…';
      reportStatus.textContent = 'FINALIZE → QUEUE → HTTP';
      try {
        const response = await sendReport(result.reason);
        window.__WM_LAST_MANUAL_REPORT_RESULT__ = response;
        if (response?.ok) {
          report.textContent = 'REPORT SENT';
          reportStatus.textContent = `${response.reportId || 'REPORT'}${response.httpStatus ? ` • HTTP ${response.httpStatus}` : ''}`;
          document.documentElement.dataset.wreckmarchManualReport = 'sent';
        } else {
          throw new Error(response?.error || 'send failed');
        }
      } catch (error) {
        report.textContent = 'RETRY REPORT';
        reportStatus.textContent = `ERROR • ${String(error?.message || error).slice(0, 90)}`;
        report.disabled = false;
        document.documentElement.dataset.wreckmarchManualReport = 'error-results';
      }
    });

    const finish = action => {
      screen.querySelectorAll('button').forEach(button => { button.disabled = true; });
      document.body.classList.remove('wm-results-active');
      delete document.documentElement.dataset.wreckmarchResults;
      resolve(Object.freeze({ action }));
    };
    replay.addEventListener('click', () => finish('play-again'));
    main.addEventListener('click', () => finish('main'));

    const footer = document.createElement('footer');
    footer.className = 'wm-results-footer';
    footer.textContent = 'RESULTS CONSUME THE CANONICAL RUN OUTCOME — NO SECOND REWARD CALCULATION';

    screen.append(header, stats, actions, reportWrap, footer);
    document.body.append(screen);
  });
}

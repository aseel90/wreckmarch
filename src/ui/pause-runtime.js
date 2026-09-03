import { SCREEN_IDS } from './screen-registry.js?v=2';
import { showPauseScreen } from './pause-screen.js?v=4';
import { showSettingsScreen } from './settings-screen.js?v=1';
import { showBuildPanel } from './build-panel.js?v=1';
import { showConfirmationModal } from './confirmation-modal.js?v=1';
import { requestNextBootScreen, requestRunRestart } from './frontend-intent.js?v=2';

const PAUSE_TRIGGER_ID = 'wm-pause-trigger';

function getGameScene(game) { return game?.scene?.getScene?.('Wreckmarch') || null; }
function getShell() { return window.__WM_GAME_SHELL__ || null; }
function canPause(scene, shell) {
  return Boolean(scene && shell?.currentScreenId === SCREEN_IDS.GAMEPLAY && !scene.gameOver && !scene.upgradeOpen && !scene.scene?.isPaused?.());
}

function createPauseTrigger() {
  const existing = document.getElementById(PAUSE_TRIGGER_ID);
  if (existing) return existing;
  const button = document.createElement('button');
  button.id = PAUSE_TRIGGER_ID;
  button.className = 'wm-pause-trigger';
  button.type = 'button';
  button.setAttribute('aria-label', 'Pause run');
  button.innerHTML = '<span aria-hidden="true">Ⅱ</span><small>PAUSE</small>';
  document.body.append(button);
  return button;
}

function reloadFromPause({ screenId, restartCharacterId } = {}) {
  if (restartCharacterId) requestRunRestart(restartCharacterId);
  if (screenId) requestNextBootScreen(screenId);
  window.location.reload();
}

export function installPauseRuntime(game) {
  const scene = getGameScene(game);
  const shell = getShell();
  if (!scene || !shell) throw new Error('Pause runtime requires Wreckmarch scene and GameShell');
  if (scene.__wmPauseRuntimeInstalled) return scene.__wmPauseRuntimeInstalled;

  const trigger = createPauseTrigger();
  let opening = false;
  const syncTrigger = () => { trigger.hidden = !canPause(scene, shell); };
  const resumeRun = () => {
    if (scene.scene?.isPaused?.()) scene.scene.resume();
    shell.navigate(SCREEN_IDS.GAMEPLAY);
    opening = false;
    syncTrigger();
    window.__WM_LOG__?.('Pause runtime resumed gameplay');
  };

  const openPause = async () => {
    if (opening || !canPause(scene, shell)) return;
    opening = true;
    trigger.hidden = true;
    shell.navigate(SCREEN_IDS.PAUSE);
    scene.scene.pause();
    window.__WM_LOG__?.('Pause runtime paused gameplay');

    try {
      while (true) {
        const result = await showPauseScreen();
        if (result?.action === 'build') {
          await showBuildPanel(scene);
          shell.navigate(SCREEN_IDS.PAUSE);
          continue;
        }
        if (result?.action === 'settings') {
          shell.navigate(SCREEN_IDS.SETTINGS);
          await showSettingsScreen({ returnLabel: 'PAUSE' });
          shell.navigate(SCREEN_IDS.PAUSE);
          continue;
        }
        if (result?.action === 'restart') {
          const confirmed = await showConfirmationModal({
            kicker: 'WRECKMARCH // RUN CONTROL',
            title: 'RESTART RUN?',
            body: 'Current run progress will be discarded. The same selectable survivor will redeploy in a fresh run.',
            confirmLabel: 'RESTART',
            cancelLabel: 'KEEP RUN',
          });
          if (!confirmed) { shell.navigate(SCREEN_IDS.PAUSE); continue; }
          reloadFromPause({ screenId: SCREEN_IDS.CHARACTER_SELECT, restartCharacterId: scene.characterId || window.__WM_SELECTED_CHARACTER__ });
          return;
        }
        if (result?.action === 'exit') {
          const confirmed = await showConfirmationModal({
            kicker: 'WRECKMARCH // RUN CONTROL',
            title: 'EXIT TO MAIN?',
            body: 'Current run progress will be discarded and you will return to the deployment terminal.',
            confirmLabel: 'EXIT RUN',
            cancelLabel: 'KEEP RUN',
            danger: true,
          });
          if (!confirmed) { shell.navigate(SCREEN_IDS.PAUSE); continue; }
          reloadFromPause({ screenId: SCREEN_IDS.MAIN });
          return;
        }
        resumeRun();
        break;
      }
    } catch (error) {
      resumeRun();
      throw error;
    }
  };

  trigger.addEventListener('click', openPause);
  const onKeyDown = event => {
    if (event.key !== 'Escape') return;
    if (document.querySelector('.wm-confirm-overlay')) return;
    const buildOverlay = document.querySelector('.wm-build-overlay');
    if (buildOverlay) {
      buildOverlay.querySelector('[data-build-action="close"]')?.click();
      return;
    }
    if (shell.currentScreenId === SCREEN_IDS.PAUSE) {
      document.querySelector('[data-pause-action="resume"]')?.click();
      return;
    }
    if (shell.currentScreenId === SCREEN_IDS.SETTINGS && scene.scene?.isPaused?.()) {
      document.querySelector('.wm-settings-screen .wm-shell-back')?.click();
      return;
    }
    openPause();
  };
  window.addEventListener('keydown', onKeyDown);
  scene.events?.on?.('postupdate', syncTrigger);
  scene.events?.once?.('shutdown', () => {
    window.removeEventListener('keydown', onKeyDown);
    trigger.remove();
  });

  const api = Object.freeze({ openPause, resumeRun, syncTrigger, trigger });
  scene.__wmPauseRuntimeInstalled = api;
  syncTrigger();
  return api;
}

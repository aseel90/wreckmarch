import { createGameShell } from './game-shell.js?v=2';
import { SCREEN_IDS } from './screen-registry.js?v=2';
import { showMainMenu } from './main-menu-screen.js?v=4';
import { showSettingsScreen } from './settings-screen.js?v=1';
import { showProgressionScreen } from './progression-screen.js?v=3';
import { chooseCharacter } from './character-select-screen.js?v=5';
import { resolveFirstSelectableCharacter } from './character-select-model.js?v=5&wreckerActivation=1';
import { resolveCharacterAccess } from '../characters/character-access.js?v=2&wreckerActivation=1';
import { consumeNextBootScreen, consumeRunRestartCharacterId } from './frontend-intent.js?v=2';

function isAutotestFlow() {
  return new URLSearchParams(globalThis.location?.search || '').get('autotest') === '1';
}

function acceptCharacter(shell, entry, suffix = '') {
  window.__WM_SELECTED_CHARACTER__ = entry.id;
  shell.navigate(SCREEN_IDS.GAMEPLAY);
  window.__WM_LOG__?.(`GameShell character selection accepted: ${entry.id}${suffix}`);
  return entry;
}

export async function runInitialFrontendFlow() {
  const autotest = isAutotestFlow();
  const shell = createGameShell({ initialScreen: SCREEN_IDS.BOOT });
  window.__WM_GAME_SHELL__ = shell;

  const requestedBootTarget = consumeNextBootScreen();
  const restartCharacterId = consumeRunRestartCharacterId();
  if (restartCharacterId) {
    const restartAccess = resolveCharacterAccess(restartCharacterId);
    if (restartAccess.selectable) {
      shell.navigate(SCREEN_IDS.CHARACTER_SELECT);
      window.__WM_LOG__?.(`Canonical restart intent accepted: ${restartAccess.entry.id}`);
      return acceptCharacter(shell, restartAccess.entry, ' (restart)');
    }
    window.__WM_LOG__?.(`Canonical restart intent rejected: ${restartAccess.entry.id} (${restartAccess.lockReason})`);
  }

  let bootTarget = requestedBootTarget || (autotest ? SCREEN_IDS.CHARACTER_SELECT : SCREEN_IDS.MAIN);
  while (true) {
    if (bootTarget === SCREEN_IDS.MAIN) {
      shell.navigate(SCREEN_IDS.MAIN);
      const mainAction = await showMainMenu();
      if (mainAction?.screenId === SCREEN_IDS.SETTINGS) {
        shell.navigate(SCREEN_IDS.SETTINGS);
        await showSettingsScreen({ returnLabel: 'MAIN' });
        bootTarget = SCREEN_IDS.MAIN;
        continue;
      }
      if (mainAction?.screenId === SCREEN_IDS.SHOP) {
        shell.navigate(SCREEN_IDS.SHOP);
        await showProgressionScreen();
        bootTarget = SCREEN_IDS.MAIN;
        continue;
      }
      if (mainAction?.screenId !== SCREEN_IDS.CHARACTER_SELECT) {
        throw new Error(`Main menu returned unsupported startup route: ${mainAction?.screenId || 'unknown'}`);
      }
    } else if (bootTarget !== SCREEN_IDS.CHARACTER_SELECT) {
      throw new Error(`Unsupported frontend boot target: ${bootTarget}`);
    }

    shell.navigate(SCREEN_IDS.CHARACTER_SELECT);
    const selection = autotest ? resolveFirstSelectableCharacter() : await chooseCharacter();
    if (selection?.action === 'back') {
      bootTarget = SCREEN_IDS.MAIN;
      continue;
    }
    if (!selection?.selectable) throw new Error(`Character selection rejected: ${selection?.characterId || 'unknown'}`);
    return acceptCharacter(shell, selection.entry, autotest ? ' (autotest)' : '');
  }
}

export const runInitialCharacterSelect = runInitialFrontendFlow;

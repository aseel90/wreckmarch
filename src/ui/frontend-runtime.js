import { createGameShell } from './game-shell.js?v=2';
import { SCREEN_IDS } from './screen-registry.js?v=2';
import { showMainMenu } from './main-menu-screen.js?v=2';
import { showSettingsScreen } from './settings-screen.js?v=1';
import { chooseCharacter } from './character-select-screen.js?v=3';
import { resolveFirstSelectableCharacter } from './character-select-model.js?v=2';

function isAutotestFlow() {
  return new URLSearchParams(globalThis.location?.search || '').get('autotest') === '1';
}

export async function runInitialFrontendFlow() {
  const autotest = isAutotestFlow();
  const shell = createGameShell({ initialScreen: SCREEN_IDS.BOOT });
  window.__WM_GAME_SHELL__ = shell;

  while (true) {
    shell.navigate(SCREEN_IDS.MAIN);

    if (!autotest) {
      const mainAction = await showMainMenu();
      if (mainAction?.screenId === SCREEN_IDS.SETTINGS) {
        shell.navigate(SCREEN_IDS.SETTINGS);
        await showSettingsScreen({ returnLabel: 'MAIN' });
        continue;
      }
      if (mainAction?.screenId !== SCREEN_IDS.CHARACTER_SELECT) {
        throw new Error(`Main menu returned unsupported startup route: ${mainAction?.screenId || 'unknown'}`);
      }
    }

    shell.navigate(SCREEN_IDS.CHARACTER_SELECT);
    const selection = autotest
      ? resolveFirstSelectableCharacter()
      : await chooseCharacter();

    if (selection?.action === 'back') continue;
    if (!selection?.selectable) throw new Error(`Character selection rejected: ${selection?.characterId || 'unknown'}`);

    window.__WM_SELECTED_CHARACTER__ = selection.characterId;
    shell.navigate(SCREEN_IDS.GAMEPLAY);
    window.__WM_LOG__?.(`GameShell character selection accepted: ${selection.characterId}${autotest ? ' (autotest)' : ''}`);
    return selection.entry;
  }
}

export const runInitialCharacterSelect = runInitialFrontendFlow;

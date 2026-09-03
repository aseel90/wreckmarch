import { createGameShell } from './game-shell.js?v=1';
import { SCREEN_IDS } from './screen-registry.js?v=2';
import { chooseCharacter } from './character-select-screen.js?v=1';
import { resolveFirstSelectableCharacter } from './character-select-model.js?v=2';

function isAutotestFlow() {
  return new URLSearchParams(globalThis.location?.search || '').get('autotest') === '1';
}

export async function runInitialCharacterSelect() {
  const shell = createGameShell({ initialScreen: SCREEN_IDS.CHARACTER_SELECT });
  window.__WM_GAME_SHELL__ = shell;

  const selection = isAutotestFlow()
    ? resolveFirstSelectableCharacter()
    : await chooseCharacter();

  if (!selection?.selectable) throw new Error(`Character selection rejected: ${selection?.characterId || 'unknown'}`);

  window.__WM_SELECTED_CHARACTER__ = selection.characterId;
  shell.navigate(SCREEN_IDS.GAMEPLAY);
  window.__WM_LOG__?.(`GameShell character selection accepted: ${selection.characterId}${isAutotestFlow() ? ' (autotest)' : ''}`);
  return selection.entry;
}

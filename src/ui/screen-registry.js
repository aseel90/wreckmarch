/* WRECKMARCH — canonical front-end screen registry */
export const SCREEN_IDS = Object.freeze({
  CHARACTER_SELECT: 'character-select',
  GAMEPLAY: 'gameplay',
  SETTINGS: 'settings',
  SHOP: 'shop',
  LEADERBOARD: 'leaderboard',
  RESULTS: 'results',
  PAUSE: 'pause',
});

const SCREENS = new Map([
  [SCREEN_IDS.CHARACTER_SELECT, Object.freeze({ id: SCREEN_IDS.CHARACTER_SELECT, phase: 'pre-run' })],
  [SCREEN_IDS.GAMEPLAY, Object.freeze({ id: SCREEN_IDS.GAMEPLAY, phase: 'run' })],
  [SCREEN_IDS.SETTINGS, Object.freeze({ id: SCREEN_IDS.SETTINGS, phase: 'shell' })],
  [SCREEN_IDS.SHOP, Object.freeze({ id: SCREEN_IDS.SHOP, phase: 'shell' })],
  [SCREEN_IDS.LEADERBOARD, Object.freeze({ id: SCREEN_IDS.LEADERBOARD, phase: 'shell' })],
  [SCREEN_IDS.RESULTS, Object.freeze({ id: SCREEN_IDS.RESULTS, phase: 'post-run' })],
  [SCREEN_IDS.PAUSE, Object.freeze({ id: SCREEN_IDS.PAUSE, phase: 'run-overlay' })],
]);

export function getScreenDefinition(screenId) {
  const screen = SCREENS.get(screenId);
  if (!screen) throw new Error(`Unknown screen: ${screenId}`);
  return screen;
}

export function listScreenDefinitions() {
  return [...SCREENS.values()];
}

export function hasScreenDefinition(screenId) {
  return SCREENS.has(screenId);
}

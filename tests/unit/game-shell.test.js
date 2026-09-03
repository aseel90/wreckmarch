import { describe, expect, it, vi } from 'vitest';
import { GameShell } from '../../src/ui/game-shell.js';
import { SCREEN_IDS, getScreenDefinition, listScreenDefinitions } from '../../src/ui/screen-registry.js';

describe('canonical GameShell ownership', () => {
  it('starts at character select without changing live gameplay', () => {
    const shell = new GameShell();
    expect(shell.currentScreenId).toBe(SCREEN_IDS.CHARACTER_SELECT);
    expect(shell.currentScreen).toEqual(getScreenDefinition(SCREEN_IDS.CHARACTER_SELECT));
  });

  it('owns validated navigation and emits one transition', () => {
    const shell = new GameShell();
    const listener = vi.fn();
    shell.subscribe(listener);
    shell.navigate(SCREEN_IDS.GAMEPLAY);
    expect(shell.currentScreenId).toBe(SCREEN_IDS.GAMEPLAY);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].id).toBe(SCREEN_IDS.GAMEPLAY);
    expect(listener.mock.calls[0][1].id).toBe(SCREEN_IDS.CHARACTER_SELECT);
  });

  it('rejects parallel or unknown screen identifiers', () => {
    const shell = new GameShell();
    expect(() => shell.navigate('shotgun-menu')).toThrow('Unknown screen: shotgun-menu');
  });

  it('registers the agreed future screens in one canonical source', () => {
    expect(listScreenDefinitions().map(screen => screen.id)).toEqual([
      SCREEN_IDS.CHARACTER_SELECT,
      SCREEN_IDS.GAMEPLAY,
      SCREEN_IDS.SETTINGS,
      SCREEN_IDS.SHOP,
      SCREEN_IDS.LEADERBOARD,
      SCREEN_IDS.RESULTS,
      SCREEN_IDS.PAUSE,
    ]);
  });
});

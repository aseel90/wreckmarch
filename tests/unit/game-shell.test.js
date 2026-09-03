import { describe, expect, it, vi } from 'vitest';
import { GameShell } from '../../src/ui/game-shell.js';
import { SCREEN_IDS, getScreenDefinition, listScreenDefinitions } from '../../src/ui/screen-registry.js';

describe('canonical GameShell ownership', () => {
  it('starts at Boot now that the player-facing frontend entry flow is active', () => {
    const shell = new GameShell();
    expect(shell.currentScreenId).toBe(SCREEN_IDS.BOOT);
    expect(shell.currentScreen).toEqual(getScreenDefinition(SCREEN_IDS.BOOT));
  });

  it('owns the canonical Boot → Main → Character Select → Gameplay transition chain', () => {
    const shell = new GameShell();
    const listener = vi.fn();
    shell.subscribe(listener);

    shell.navigate(SCREEN_IDS.MAIN);
    shell.navigate(SCREEN_IDS.CHARACTER_SELECT);
    shell.navigate(SCREEN_IDS.GAMEPLAY);

    expect(shell.currentScreenId).toBe(SCREEN_IDS.GAMEPLAY);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls.map(([next, previous]) => [previous.id, next.id])).toEqual([
      [SCREEN_IDS.BOOT, SCREEN_IDS.MAIN],
      [SCREEN_IDS.MAIN, SCREEN_IDS.CHARACTER_SELECT],
      [SCREEN_IDS.CHARACTER_SELECT, SCREEN_IDS.GAMEPLAY],
    ]);
  });

  it('supports returning from Character Select to Main without creating a second router', () => {
    const shell = new GameShell({ initialScreen: SCREEN_IDS.MAIN });
    shell.navigate(SCREEN_IDS.CHARACTER_SELECT);
    shell.navigate(SCREEN_IDS.MAIN);
    expect(shell.currentScreen).toEqual({ id: SCREEN_IDS.MAIN, phase: 'shell' });
  });

  it('rejects parallel or unknown screen identifiers', () => {
    const shell = new GameShell();
    expect(() => shell.navigate('shotgun-menu')).toThrow('Unknown screen: shotgun-menu');
  });

  it('registers the agreed canonical screens in one source', () => {
    expect(listScreenDefinitions().map(screen => screen.id)).toEqual([
      SCREEN_IDS.BOOT,
      SCREEN_IDS.MAIN,
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

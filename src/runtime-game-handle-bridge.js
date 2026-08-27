// WRECKMARCH boot compatibility bridge — keep legacy runtimes on the authoritative Phaser game instance.
export function syncRuntimeGameHandle() {
  const game = window.__WM_GAME__;
  const phaser = window.Phaser;
  if (!game) throw new Error('Runtime game handle missing after Phase A');
  if (!phaser) throw new Error('Phaser namespace missing after Phase A');

  if (Array.isArray(phaser.GAMES)) {
    if (!phaser.GAMES.includes(game)) phaser.GAMES.unshift(game);
  } else {
    // ESM namespace objects can be read-only; replace only the window alias with a plain facade.
    window.Phaser = { ...phaser, GAMES: [game] };
  }

  if (!Array.isArray(window.Phaser?.GAMES) || !window.Phaser.GAMES.includes(game)) {
    throw new Error('Failed to synchronize legacy Phaser.GAMES registry');
  }
  window.__WM_LOG__?.('Runtime game handle bridge active');
  return game;
}

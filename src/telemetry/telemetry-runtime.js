/* WRECKMARCH — installs measurement-only telemetry without owning gameplay */
import { installRunTelemetry } from './run-telemetry.js?v=2';

function getScene(game) {
  return game?.scene?.getScene?.('Wreckmarch') || null;
}

export function installTelemetryRuntime(game = globalThis.__WM_GAME__) {
  if (!game?.events) return false;
  if (game.__wreckmarchTelemetryRuntime) return true;

  const tick = (_time, delta) => {
    const scene = getScene(game);
    if (!scene?.sys?.isActive?.()) return;
    let telemetry = scene.runTelemetry;
    if (!telemetry || (telemetry.finalized && !scene.gameOver)) telemetry = installRunTelemetry(scene);
    telemetry.update(Number.isFinite(Number(delta)) ? Number(delta) : Number(game.loop?.delta) || 0);
    if (scene.gameOver && !telemetry.finalized) telemetry.finalize();
  };

  const eventName = globalThis.Phaser?.Core?.Events?.POST_STEP || 'poststep';
  game.events.on(eventName, tick);
  game.__wreckmarchTelemetryRuntime = { eventName, tick };
  try {
    globalThis.__WM_TELEMETRY_RUNTIME__ = { active: true, eventName, report: () => getScene(game)?.runTelemetry?.getReport?.() || null };
  } catch {}
  const remote = Boolean(getScene(game)?.runTelemetry?.remoteReportingEnabled);
  globalThis.__WM_LOG__?.(`Run Telemetry active: local/CI metrics${remote ? ' + remote RUN report queue' : ' (remote reporting disabled)'}`);
  return true;
}

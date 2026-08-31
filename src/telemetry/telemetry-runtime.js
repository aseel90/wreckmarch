/* WRECKMARCH — installs measurement-only telemetry without owning gameplay */
import { installRunTelemetry } from './run-telemetry.js?v=2';
import { isRemoteRunReportingEnabled, RunReportProvider } from './run-report-provider.js?v=3';

function getScene(game) {
  return game?.scene?.getScene?.('Wreckmarch') || null;
}

export function installEndRunTelemetryHook(scene) {
  if (!scene || typeof scene.endRun !== 'function') return false;
  const previousHook = scene.__wreckmarchTelemetryEndRunHook;
  if (previousHook?.wrapper === scene.endRun) return false;
  const originalEndRun = scene.endRun;
  const wrapper = function telemetryAwareEndRun(reason, ...args) {
    const telemetry = this.runTelemetry;
    if (telemetry && !telemetry.finalized) {
      try { telemetry.finalize(reason); }
      catch (error) { globalThis.__WM_LOG__?.(`Run Telemetry finalize failed: ${error?.message || error}`); }
    }
    return originalEndRun.call(this, reason, ...args);
  };
  scene.endRun = wrapper;
  scene.__wreckmarchTelemetryEndRunHook = { originalEndRun, wrapper };
  return true;
}

function getOrCreateRunReportProvider(game) {
  const remoteReportingEnabled = isRemoteRunReportingEnabled();
  if (!remoteReportingEnabled || typeof globalThis.fetch !== 'function') return { remoteReportingEnabled, provider: undefined };
  if (!game.__wreckmarchRunReportProvider) game.__wreckmarchRunReportProvider = new RunReportProvider();
  return { remoteReportingEnabled, provider: game.__wreckmarchRunReportProvider };
}

function installSceneTelemetry(scene, game) {
  const { remoteReportingEnabled, provider } = getOrCreateRunReportProvider(game);
  const telemetry = installRunTelemetry(scene, { remoteReportingEnabled, ...(provider ? { provider } : {}) });
  installEndRunTelemetryHook(scene);
  return telemetry;
}

export function installTelemetryRuntime(game = globalThis.__WM_GAME__) {
  if (!game?.events) return false;
  if (game.__wreckmarchTelemetryRuntime) return true;

  const transport = getOrCreateRunReportProvider(game);
  if (transport.provider) {
    Promise.resolve(transport.provider.flushPending()).catch(() => {});
    Promise.resolve(transport.provider.probe()).catch(() => {});
  }

  const tick = (_time, delta) => {
    const scene = getScene(game);
    if (!scene?.sys?.isActive?.()) return;
    let telemetry = scene.runTelemetry;
    if (!telemetry || (telemetry.finalized && !scene.gameOver)) {
      telemetry = installSceneTelemetry(scene, game);
      globalThis.__WM_LOG__?.(`Run Telemetry session: remote reporting ${telemetry.remoteReportingEnabled ? 'ENABLED' : 'disabled'}`);
    } else if (transport.provider && telemetry.provider !== transport.provider) {
      telemetry.provider = transport.provider;
      telemetry.remoteReportingEnabled = true;
    }
    installEndRunTelemetryHook(scene);
    telemetry.update(Number.isFinite(Number(delta)) ? Number(delta) : Number(game.loop?.delta) || 0);
    if (scene.gameOver && !telemetry.finalized) telemetry.finalize();
  };

  const eventName = globalThis.Phaser?.Core?.Events?.POST_STEP || 'poststep';
  game.events.on(eventName, tick);
  game.__wreckmarchTelemetryRuntime = { eventName, tick };
  try {
    globalThis.__WM_TELEMETRY_RUNTIME__ = { active: true, eventName, report: () => getScene(game)?.runTelemetry?.getReport?.() || null };
  } catch {}
  globalThis.__WM_LOG__?.('Run Telemetry runtime armed');
  return true;
}

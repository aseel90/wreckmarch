/* WRECKMARCH — installs measurement-only telemetry without owning gameplay */
import { installRunTelemetry } from './run-telemetry.js?v=7';
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

function getManualRunReportProvider(game) {
  if (typeof globalThis.fetch !== 'function') return undefined;
  const automaticTransport = getOrCreateRunReportProvider(game);
  if (automaticTransport.provider) return automaticTransport.provider;
  // Manual reporting must not opt the live runtime into automatic telemetry.
  // A one-shot provider can submit/recover the report without touching boot/tick ownership.
  return new RunReportProvider();
}

function manualReportFailure(stage, error, extra = {}) {
  return {
    ok: false,
    stage,
    error: String(error?.message || error || 'unknown_error'),
    ...extra
  };
}

export async function sendCurrentRunReport(game = globalThis.__WM_GAME__, reason = 'MANUAL REPORT') {
  const scene = getScene(game);
  if (!scene) return manualReportFailure('scene', 'wreckmarch_scene_unavailable');

  const provider = getManualRunReportProvider(game);
  if (!provider) {
    return manualReportFailure('transport', 'remote_reporting_unavailable');
  }

  const telemetry = scene.runTelemetry;
  if (!telemetry) return manualReportFailure('session', 'run_telemetry_missing');

  let report;
  try {
    report = telemetry.finalized ? telemetry.getReport?.() : telemetry.finalize(reason);
  } catch (error) {
    return manualReportFailure('finalize', error);
  }

  const reportId = report?.reportId;
  if (!reportId) return manualReportFailure('finalize', 'report_id_missing');

  try {
    // Manual send must always push the finalized report through the canonical provider.
    // This recovers reports that were finalized while an old/Noop provider was attached.
    const flushResults = await provider.submit(report);
    telemetry.lastSubmission = Promise.resolve(flushResults);
    const queue = provider.getQueue();
    const stillQueued = queue.some(entry => entry?.report?.reportId === reportId);
    const status = globalThis.__WM_TELEMETRY_REMOTE_STATUS__ || null;

    if (stillQueued) {
      return manualReportFailure('transport', status?.lastReportError || 'report_still_queued', {
        reportId,
        httpStatus: Number(status?.lastReportStatus) || 0,
        bytes: Number(status?.lastReportBytes) || 0,
        queueDepth: queue.length,
        flushResults
      });
    }

    return {
      ok: true,
      stage: 'sent',
      reportId,
      httpStatus: Number(status?.lastReportStatus) || 0,
      bytes: Number(status?.lastReportBytes) || 0,
      queueDepth: queue.length,
      flushResults
    };
  } catch (error) {
    const status = globalThis.__WM_TELEMETRY_REMOTE_STATUS__ || null;
    return manualReportFailure('transport', error, {
      reportId,
      httpStatus: Number(status?.lastReportStatus) || 0,
      bytes: Number(status?.lastReportBytes) || 0,
      queueDepth: provider.getQueue().length
    });
  }
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
    globalThis.__WM_TELEMETRY_RUNTIME__ = {
      active: true,
      eventName,
      report: () => getScene(game)?.runTelemetry?.getReport?.() || null,
      status: () => globalThis.__WM_TELEMETRY_REMOTE_STATUS__ || null,
      sendReport: reason => sendCurrentRunReport(game, reason)
    };
  } catch {}
  globalThis.__WM_LOG__?.('Run Telemetry runtime armed');
  return true;
}

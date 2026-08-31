/* WRECKMARCH — remote run-report opt-in wrapper; gameplay telemetry remains measurement-only */
import { installRunTelemetry as installBaseRunTelemetry, RunTelemetry } from './run-telemetry.js?v=1';
import { isRemoteRunReportingEnabled, NoopRunReportProvider, RunReportProvider } from './run-report-provider.js?v=2';

export { RunTelemetry };

export function installRunTelemetry(scene, options = {}) {
  const remoteReportingEnabled = options.remoteReportingEnabled ?? isRemoteRunReportingEnabled(options.remoteReportingOptions);
  const provider = options.provider || (remoteReportingEnabled && typeof globalThis.fetch === 'function'
    ? new RunReportProvider(options.providerOptions)
    : new NoopRunReportProvider());
  const telemetry = installBaseRunTelemetry(scene, { ...options, provider });
  telemetry.remoteReportingEnabled = remoteReportingEnabled;
  try { globalThis.__WM_TELEMETRY_REMOTE_ENABLED__ = remoteReportingEnabled; } catch {}
  return telemetry;
}

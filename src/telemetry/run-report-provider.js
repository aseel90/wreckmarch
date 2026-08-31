/* WRECKMARCH — end-of-run report transport with local recovery */

export const DEFAULT_RUN_REPORT_ENDPOINT = 'https://wreckmarch-run-reports.salahaseel82.workers.dev/report';
export const DEFAULT_RUN_REPORT_PROBE_ENDPOINT = 'https://wreckmarch-telemetry-probe.salahaseel82.workers.dev/probe';
export const RUN_REPORT_QUEUE_KEY = 'wreckmarch:telemetry:queue:v1';
export const LAST_RUN_REPORT_KEY = 'wreckmarch:telemetry:last-run:v1';
export const RUN_REPORT_TRANSPORT_STATUS_KEY = 'wreckmarch:telemetry:transport-status:v1';
const MAX_QUEUED_REPORTS = 12;
const MAX_KEEPALIVE_BYTES = 60 * 1024;

export function isRemoteRunReportingEnabled({
  search = globalThis.location?.search || '',
  override = globalThis.__WM_ENABLE_RUN_REPORTS__
} = {}) {
  if (override === true) return true;
  try { return new URLSearchParams(search).get('wmTelemetry') === '1'; }
  catch { return false; }
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage?.setItem?.(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function textByteLength(value) {
  try { return new TextEncoder().encode(String(value)).byteLength; }
  catch { return unescape(encodeURIComponent(String(value))).length; }
}

function createProbeId() {
  if (globalThis.crypto?.randomUUID) return `wm-probe-${globalThis.crypto.randomUUID()}`;
  return `wm-probe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function browserTransportOptions(body, { keepalive = true } = {}) {
  const bytes = textByteLength(body);
  return {
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    keepalive: Boolean(keepalive && bytes <= MAX_KEEPALIVE_BYTES),
    bytes
  };
}

export class NoopRunReportProvider {
  async probe() { return { ok: false, skipped: true }; }
  async submit() { return { submitted: false, skipped: true }; }
  async flushPending() { return []; }
}

export class RunReportProvider {
  constructor({
    endpoint = globalThis.__WM_RUN_REPORT_ENDPOINT__ || DEFAULT_RUN_REPORT_ENDPOINT,
    probeEndpoint = globalThis.__WM_RUN_REPORT_PROBE_ENDPOINT__ || DEFAULT_RUN_REPORT_PROBE_ENDPOINT,
    storage = globalThis.localStorage,
    fetchFn = globalThis.fetch?.bind(globalThis)
  } = {}) {
    this.endpoint = endpoint;
    this.probeEndpoint = probeEndpoint;
    this.storage = storage;
    this.fetchFn = fetchFn;
    this.flushPromise = null;
    this.probePromise = null;
  }

  setTransportStatus(patch) {
    const next = {
      ...(readJson(this.storage, RUN_REPORT_TRANSPORT_STATUS_KEY, {}) || {}),
      ...patch,
      updatedAt: new Date().toISOString()
    };
    writeJson(this.storage, RUN_REPORT_TRANSPORT_STATUS_KEY, next);
    try { globalThis.__WM_TELEMETRY_REMOTE_STATUS__ = next; } catch {}
    return next;
  }

  getQueue() {
    const queue = readJson(this.storage, RUN_REPORT_QUEUE_KEY, []);
    return Array.isArray(queue) ? queue.filter(item => item?.report?.reportId) : [];
  }

  setQueue(queue) {
    writeJson(this.storage, RUN_REPORT_QUEUE_KEY, queue.slice(-MAX_QUEUED_REPORTS));
  }

  remember(report) {
    writeJson(this.storage, LAST_RUN_REPORT_KEY, report);
    const queue = this.getQueue();
    const index = queue.findIndex(item => item.report?.reportId === report.reportId);
    const entry = { report, queuedAt: new Date().toISOString() };
    if (index >= 0) queue[index] = entry;
    else queue.push(entry);
    this.setQueue(queue);
  }

  async probe() {
    if (this.probePromise) return this.probePromise;
    this.probePromise = this.#probe().finally(() => { this.probePromise = null; });
    return this.probePromise;
  }

  async #probe() {
    if (!this.probeEndpoint || typeof this.fetchFn !== 'function') return { ok: false, skipped: true };
    const payload = {
      schemaVersion: 1,
      probeId: createProbeId(),
      sentAt: new Date().toISOString(),
      page: String(globalThis.location?.href || '').slice(0, 500),
      userAgent: String(globalThis.navigator?.userAgent || '').slice(0, 500)
    };
    const body = JSON.stringify(payload);
    const transport = browserTransportOptions(body, { keepalive: true });
    try {
      const sent = await this.#postJson(this.probeEndpoint, body, { keepalive: transport.keepalive });
      const { response, payload: result } = sent;
      const ok = response.ok && result?.ok !== false;
      this.setTransportStatus({ probeOk: ok, probeStatus: response.status, probeId: payload.probeId, probeKeepalive: sent.keepalive, probeError: ok ? null : result?.error || `HTTP ${response.status}` });
      globalThis.__WM_LOG__?.(`Telemetry probe ${ok ? 'CONNECTED' : 'FAILED'} (${response.status})`);
      return { ok, status: response.status, payload: result, probeId: payload.probeId, keepalive: sent.keepalive };
    } catch (error) {
      const message = String(error?.message || error);
      this.setTransportStatus({ probeOk: false, probeStatus: 0, probeId: payload.probeId, probeError: message });
      globalThis.__WM_LOG__?.(`Telemetry probe FAILED: ${message}`);
      return { ok: false, status: 0, error: message, probeId: payload.probeId };
    }
  }

  async #postJson(url, body, { keepalive = true } = {}) {
    const transport = browserTransportOptions(body, { keepalive });
    const attempts = transport.keepalive ? [true, false] : [false];
    let lastError = null;
    for (const useKeepalive of attempts) {
      try {
        const response = await this.fetchFn(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          mode: transport.mode,
          credentials: transport.credentials,
          cache: transport.cache,
          keepalive: useKeepalive
        });
        const payload = await response.json().catch(() => ({}));
        return { response, payload, bytes: transport.bytes, keepalive: useKeepalive };
      } catch (error) {
        lastError = error;
        if (!useKeepalive) break;
      }
    }
    throw lastError || new Error('telemetry request failed');
  }

  async submit(report) {
    this.remember(report);
    return this.flushPending();
  }

  async flushPending() {
    if (this.flushPromise) return this.flushPromise;
    this.flushPromise = this.#flush().finally(() => { this.flushPromise = null; });
    return this.flushPromise;
  }

  async #flush() {
    if (!this.endpoint || typeof this.fetchFn !== 'function') return [];
    const results = [];
    let queue = this.getQueue();

    for (const entry of [...queue]) {
      const body = JSON.stringify(entry.report);
      const transport = browserTransportOptions(body, { keepalive: true });
      try {
        const sent = await this.#postJson(this.endpoint, body, { keepalive: transport.keepalive });
        const { response, payload } = sent;
        const remotelyAccepted = response.ok || payload?.queued === true || payload?.submitted === true;
        results.push({ reportId: entry.report.reportId, ok: remotelyAccepted, status: response.status, payload, bytes: sent.bytes, keepalive: sent.keepalive });
        this.setTransportStatus({
          lastReportId: entry.report.reportId,
          lastReportOk: remotelyAccepted,
          lastReportStatus: response.status,
          lastReportBytes: sent.bytes,
          lastReportKeepalive: sent.keepalive,
          lastReportError: remotelyAccepted ? null : payload?.error || `HTTP ${response.status}`
        });
        if (!remotelyAccepted) break;
        queue = queue.filter(item => item.report?.reportId !== entry.report.reportId);
        this.setQueue(queue);
      } catch (error) {
        const message = String(error?.message || error);
        results.push({ reportId: entry.report.reportId, ok: false, error: message, bytes: transport.bytes, keepalive: transport.keepalive });
        this.setTransportStatus({
          lastReportId: entry.report.reportId,
          lastReportOk: false,
          lastReportStatus: 0,
          lastReportBytes: transport.bytes,
          lastReportKeepalive: transport.keepalive,
          lastReportError: message
        });
        break;
      }
    }

    return results;
  }
}

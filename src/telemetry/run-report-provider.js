/* WRECKMARCH — end-of-run report transport with local recovery */

export const DEFAULT_RUN_REPORT_ENDPOINT = 'https://wreckmarch-run-reports.salahaseel82.workers.dev/report';
export const RUN_REPORT_QUEUE_KEY = 'wreckmarch:telemetry:queue:v1';
export const LAST_RUN_REPORT_KEY = 'wreckmarch:telemetry:last-run:v1';
const MAX_QUEUED_REPORTS = 12;

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

export class NoopRunReportProvider {
  async submit() { return { submitted: false, skipped: true }; }
  async flushPending() { return []; }
}

export class RunReportProvider {
  constructor({
    endpoint = globalThis.__WM_RUN_REPORT_ENDPOINT__ || DEFAULT_RUN_REPORT_ENDPOINT,
    storage = globalThis.localStorage,
    fetchFn = globalThis.fetch?.bind(globalThis)
  } = {}) {
    this.endpoint = endpoint;
    this.storage = storage;
    this.fetchFn = fetchFn;
    this.flushPromise = null;
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
      try {
        const response = await this.fetchFn(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(entry.report),
          keepalive: true
        });
        const payload = await response.json().catch(() => ({}));
        const remotelyAccepted = response.ok || payload?.queued === true || payload?.submitted === true;
        results.push({ reportId: entry.report.reportId, ok: remotelyAccepted, status: response.status, payload });
        if (!remotelyAccepted) break;
        queue = queue.filter(item => item.report?.reportId !== entry.report.reportId);
        this.setQueue(queue);
      } catch (error) {
        results.push({ reportId: entry.report.reportId, ok: false, error: String(error?.message || error) });
        break;
      }
    }

    return results;
  }
}

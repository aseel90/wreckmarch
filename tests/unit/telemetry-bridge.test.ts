import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('balance run report bridge contract', () => {
  it('keeps GitHub credentials out of the client and uses the OIDC workflow bridge', () => {
    const workflow = read('.github/workflows/balance-run-report-bridge.yml');
    const provider = read('src/telemetry/run-report-provider.js');
    const runtime = read('src/telemetry/telemetry-runtime.js');
    const html = read('index.html');
    const worker = read('infra/cloudflare/wreckmarch-run-reports/worker.js');
    const migration = read('infra/cloudflare/wreckmarch-run-reports/migrations/001_run_reports.sql');

    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain("core.getIDToken('wreckmarch-run-reports')");
    expect(workflow).toContain("cron: '*/5 * * * *'");
    expect(workflow).toContain('/bridge/pending');
    expect(workflow).toContain('/bridge/ack');
    expect(workflow).toContain('github.rest.issues.createComment');
    expect(workflow).toContain('report.issueComments');
    expect(provider).toContain("wmTelemetry') === '1'");
    expect(provider).not.toContain('GITHUB_TOKEN');
    expect(provider).toContain("mode: 'cors'");
    expect(provider).toContain("credentials: 'omit'");
    expect(provider).toContain('MAX_KEEPALIVE_BYTES');
    expect(provider).toContain('wreckmarch-telemetry-probe');
    expect(runtime).toContain("./run-report-provider.js?v=3");
    expect(runtime).toContain('const wrapper = function telemetryAwareEndRun');
    expect(runtime).toContain('scene.endRun = wrapper');
    expect(runtime).toContain('telemetry.finalize(reason)');
    expect(runtime).toContain('previousHook?.wrapper === scene.endRun');
    expect(runtime).toContain('installEndRunTelemetryHook(scene);');
    expect(html).toContain('./src/telemetry/telemetry-runtime.js?v=5');
    expect(worker).toContain('INSERT OR IGNORE INTO run_reports');
    expect(worker).toContain("stage: 'd1_insert'");
    expect(worker).toContain('issueComments');
    expect(worker).not.toContain('ensureSchema');
    expect(worker).not.toContain('.exec(');
    expect(worker).not.toContain('.slice(0, 50000)');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS run_reports');
    expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_run_reports_status');
  });
});

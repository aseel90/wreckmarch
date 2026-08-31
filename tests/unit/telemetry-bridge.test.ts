import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('balance run report bridge contract', () => {
  it('keeps GitHub credentials out of the client and uses the OIDC workflow bridge', () => {
    const workflow = read('.github/workflows/balance-run-report-bridge.yml');
    const provider = read('src/telemetry/run-report-provider.js');
    const html = read('index.html');

    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain("core.getIDToken('wreckmarch-run-reports')");
    expect(workflow).toContain("cron: '17 * * * *'");
    expect(workflow).toContain('/bridge/pending');
    expect(workflow).toContain('/bridge/ack');
    expect(provider).toContain("wmTelemetry') === '1'");
    expect(provider).not.toContain('GITHUB_TOKEN');
    expect(html).toContain('./src/telemetry/telemetry-runtime.js?v=2');
  });
});

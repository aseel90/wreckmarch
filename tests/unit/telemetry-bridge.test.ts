import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('balance run report bridge contract', () => {
  it('keeps GitHub credentials out of the client and uses the draining OIDC workflow bridge', () => {
    const workflow = read('.github/workflows/balance-run-report-bridge.yml');
    const provider = read('src/telemetry/run-report-provider.js');
    const runtime = read('src/telemetry/telemetry-runtime.js');
    const worker = read('infra/cloudflare/wreckmarch-run-reports/worker.js');
    const migration = read('infra/cloudflare/wreckmarch-run-reports/migrations/001_run_reports.sql');

    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain("core.getIDToken('wreckmarch-run-reports')");
    expect(workflow).toContain("cron: '2,7,12,17,22,27,32,37,42,47,52,57 * * * *'");
    expect(workflow).toContain('/bridge/pending');
    expect(workflow).toContain('/bridge/ack');
    expect(workflow).toContain('const MAX_BRIDGE_PASSES = 20');
    expect(workflow).toContain('for (let pass = 1; pass <= MAX_BRIDGE_PASSES; pass += 1)');
    expect(workflow).toContain('if (reports.length === 0) break');
    expect(workflow).toContain('if (passFailures > 0) break');
    expect(workflow).toContain('Submitted Wreckmarch run reports this bridge run');
    expect(workflow).toContain('github.rest.issues.createComment');
    expect(workflow).toContain('report.issueComments');
    expect(workflow).not.toContain('paths:');

    expect(provider).toContain("wmTelemetry') === '1'");
    expect(provider).not.toContain('GITHUB_TOKEN');
    expect(provider).toContain('MAX_KEEPALIVE_BYTES');
    expect(provider).toContain('wreckmarch-telemetry-probe');
    expect(runtime).toContain("manualReportFailure('finalize'");
    expect(runtime).toContain("manualReportFailure('transport'");
    expect(runtime).toContain('await provider.submit(report)');

    expect(worker).toContain('INSERT OR IGNORE INTO run_reports');
    expect(worker).toContain("stage: 'd1_insert'");
    expect(worker).toContain('issueComments');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS run_reports');
    expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_run_reports_status');
  });

  it('keeps the deployed gameplay asset graph and upgrade ownership guards intact', () => {
    const html = read('index.html');
    const pagesWorkflow = read('.github/workflows/pages.yml');

    expect(html).toContain('./src/telemetry/telemetry-runtime.js?v=15');
    expect(html).toContain('./src/phase-d1-runtime.js?v=27&u5=3');
    expect(html).toContain('./src/mobile-hud-loader-telemetry-v1.js');
    expect(html).toContain('./src/ui/results-runtime.js?v=3');
    expect(pagesWorkflow).toContain('src/phase-c1-runtime.js?v=19');
    expect(pagesWorkflow).toContain('src/phase-d1-runtime.js?v=27');
    expect(pagesWorkflow).toContain('src/phase-b-runtime.js?v=6');
    expect(pagesWorkflow).toContain('src/phase-c-runtime.js?v=24');
    expect(pagesWorkflow).toContain('src/characters/character-system.js?v=10');
    expect(pagesWorkflow).toContain('src/combat/weapon-registry.js?v=2');
    expect(pagesWorkflow).toContain('src/combat/definitions/rivet-gun.js?v=2');
    expect(pagesWorkflow).toContain('src/upgrades/upgrade-offer-pool.js?v=1');
    expect(pagesWorkflow).toContain("offer('explosive-rivet', 'HERO'");
    expect(pagesWorkflow).toContain("offer('triple-riveter', 'EVOLUTION'");
    expect(pagesWorkflow).toContain('upgrade-icon-explosive-rivet');
    expect(pagesWorkflow).toContain('upgrade-icon-triple-riveter');
    expect(pagesWorkflow).toContain('wmTelemetry=1&build=${{ github.sha }}');
    expect(html).not.toContain('./src/telemetry/telemetry-debug-ui.js');
  });

  it('treats GameShell Results as the only run-end UI contract for deployed telemetry smoke', () => {
    const resultsRuntime = read('src/ui/results-runtime.js');
    const resultsScreen = read('src/ui/results-screen.js');
    const smokeScript = read('scripts/ci-smoke.mjs');

    expect(resultsRuntime).toContain('shell.navigate(SCREEN_IDS.RESULTS)');
    expect(resultsRuntime).toContain("wreckmarchEndRunOwner = 'game-shell-results-v1'");
    expect(resultsScreen).toContain("wreckmarchResults = 'active'");
    expect(resultsScreen).toContain("report.textContent = 'SEND REPORT'");
    expect(resultsScreen).toContain("report.textContent = 'REPORT SENT'");
    expect(resultsScreen).toContain("wreckmarchManualReport = 'sent'");

    expect(smokeScript).toContain('TELEMETRY_SMOKE');
    expect(smokeScript).toContain("document.querySelector('.wm-results-screen')");
    expect(smokeScript).toContain("document.querySelector('.wm-results-report-button')");
    expect(smokeScript).toContain("before.shellScreen !== 'results'");
    expect(smokeScript).toContain("before.owner !== 'game-shell-results-v1'");
    expect(smokeScript).toContain("before.resultsState !== 'active'");
    expect(smokeScript).toContain("before.label !== 'SEND REPORT'");
    expect(smokeScript).toContain('reportButton.click()');
    expect(smokeScript).toContain("telemetryState.label !== 'REPORT SENT'");
    expect(smokeScript).toContain("telemetryState.manualState !== 'sent'");
    expect(smokeScript).not.toContain('layout?.reportBtn');
    expect(smokeScript).not.toContain('__mobileHudEndRunOwnerVersion');
  });
});

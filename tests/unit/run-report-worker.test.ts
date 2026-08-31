import { describe, expect, it } from 'vitest';
import worker from '../../infra/cloudflare/wreckmarch-run-reports/worker.js';

type SqlCall = { sql: string; args: unknown[]; method: 'run' | 'first' | 'all' };

function createDb({ failInsert = false } = {}) {
  const calls: SqlCall[] = [];
  const row = {
    id: 1,
    report_id: 'wm-worker-test-1234',
    github_issue_number: null,
    github_issue_url: null,
    status: 'received'
  };
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async run() {
              calls.push({ sql, args, method: 'run' });
              if (failInsert && sql.includes('INSERT OR IGNORE INTO run_reports')) throw new Error('D1 test insert failure');
              return { success: true, meta: { changes: 1 } };
            },
            async first() {
              calls.push({ sql, args, method: 'first' });
              return row;
            },
            async all() {
              calls.push({ sql, args, method: 'all' });
              return { results: [] };
            }
          };
        }
      };
    }
  };
  return { db, calls };
}

const report = {
  schemaVersion: 1,
  reportId: 'wm-worker-test-1234',
  finishReason: 'RUNNER DOWN',
  run: { durationSeconds: 12.3, finalWave: 2, level: 3 },
  combat: { kills: 4, damageDealt: 100, damageTaken: 20 },
  projectiles: {},
  performance: {},
  waves: [],
  upgrades: {}
};

function request(body = report) {
  return new Request('https://worker.test/report', {
    method: 'POST',
    headers: { origin: 'https://aseel90.github.io', 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

describe('wreckmarch run-report Worker ingestion', () => {
  it('persists a report without executing schema DDL in the request path', async () => {
    const { db, calls } = createDb();
    const response = await worker.fetch(request(), { RUN_REPORTS: db } as any);
    const payload = await response.json() as any;

    expect(response.status).toBe(202);
    expect(payload).toMatchObject({ queued: true, runId: 'RUN-0001', bridge: 'github-actions-oidc' });
    expect(calls.some(call => /CREATE\s+(TABLE|INDEX)/i.test(call.sql))).toBe(false);
    expect(calls.some(call => call.sql.includes('INSERT OR IGNORE INTO run_reports'))).toBe(true);
    expect(calls.some(call => call.sql.includes("status = 'pending_github'"))).toBe(true);
  });

  it('contains D1 insert failures and returns a stage-specific JSON response instead of throwing', async () => {
    const { db } = createDb({ failInsert: true });
    const response = await worker.fetch(request(), { RUN_REPORTS: db } as any);
    const payload = await response.json() as any;

    expect(response.status).toBe(500);
    expect(payload).toMatchObject({ error: 'storage_failed', stage: 'd1_insert' });
    expect(response.headers.get('access-control-allow-origin')).toBe('https://aseel90.github.io');
  });
});

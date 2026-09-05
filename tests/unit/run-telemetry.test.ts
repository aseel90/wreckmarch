import { describe, expect, it, vi } from 'vitest';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';
import { sendCurrentRunReport } from '../../src/telemetry/telemetry-runtime.js';
import { isRemoteRunReportingEnabled, RunReportProvider, RUN_REPORT_QUEUE_KEY, RUN_REPORT_TRANSPORT_STATUS_KEY } from '../../src/telemetry/run-report-provider.js';
const group = (items: any[]) => ({ getChildren: () => items });
const baseScene = () => ({ runTime: 1, level: 1, scrap: 0, heroHp: 100, heroMaxHp: 100, hero: { x: 0, y: 0 }, lastShot: 0, enemies: group([]), bullets: group([]), __runDirectorState: { wave: 1, pressurePhase: 'lull', threatBudget: 15, activeCap: 26, spawnIntervalMs: 720, hpMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1 }, upgradeLevels: {}, upgradeRarityHistory: {}, runStatState: { resolve: () => ({ weapon: { damage: 24 } }) } }) as any;

describe('RunTelemetry', () => {
  it('counts a hero projectile hit from the damage event even if collision deactivates it before the next frame', () => {
    const scene = baseScene();
    const t = new RunTelemetry(scene, { reportIdFactory: () => 'wm-hit-event-test', now: () => 1000 });
    const enemy: any = { active: true, enemyId: 'scrap-rat', hp: 50, x: 10, y: 0 };
    const bullet: any = { active: true, isCritical: true, hitEnemies: new Set(), pierceRemaining: 1, ricochetRemaining: 0 };
    scene.enemies = group([enemy]);
    scene.bullets = group([bullet]);

    t.update(16);
    bullet.active = false;
    scene.bullets = group([]);
    t.recordProjectileDamage(bullet, { appliedDamage: 20, currentHp: 50 });
    t.recordProjectileDamage(bullet, { appliedDamage: 10, currentHp: 30 });

    const report: any = t.finalize();
    expect(report.projectiles.heroSpawned).toBe(1);
    expect(report.projectiles.heroProjectilesWithHit).toBe(1);
    expect(report.projectiles.heroMisses).toBe(0);
    expect(report.combat.criticalDamageDealt).toBe(30);
  });


  it('records canonical character identity and normalizes a stale Runner death label for Wrecker', () => {
    const scene = baseScene();
    scene.characterId = 'shotgun';
    scene.characterDefinition = { id: 'shotgun', displayName: 'Wrecker' };
    scene.heroHp = 0;
    const t = new RunTelemetry(scene, { reportIdFactory: () => 'wm-wrecker-identity', now: () => 1000 });
    const report: any = (t.finalize as (reason?: string | null) => any)('RUNNER DOWN');
    expect(report.character).toEqual({ id: 'shotgun', displayName: 'Wrecker' });
    expect(report.finishReason).toBe('WRECKER DOWN');
  });

  it('observes gameplay state without becoming a combat owner', () => {
    const scene = baseScene();
    const submit = vi.fn(async () => ({ submitted: true }));
    const t = new RunTelemetry(scene, { provider: { submit } as any, reportIdFactory: () => 'wm-test-report', now: () => 1000 });
    const enemy: any = { active: true, enemyId: 'scrap-rat', hp: 54, x: 10, y: 0 };
    const bullet: any = { active: true, isCritical: true, hitEnemies: new Set(), pierceRemaining: 1, ricochetRemaining: 1 };
    scene.enemies = group([enemy]); scene.bullets = group([bullet]);
    t.update(16);
    enemy.hp = 20; bullet.hitEnemies.add(enemy); bullet.pierceRemaining = 0; scene.runTime = 2; scene.lastShot = 100; t.update(40);
    enemy.hp = -5; scene.heroHp = 90; scene.upgradeLevels = { 'heavy-rivets': 1 }; scene.upgradeRarityHistory = { 'heavy-rivets': ['COMMON'] }; scene.runTime = 3; t.update(16);
    const report: any = t.finalize();
    expect(report.combat.damageDealt).toBe(54);
    expect(report.combat.damageTaken).toBe(10);
    expect(report.combat.killsByEnemy['scrap-rat']).toBe(1);
    expect(report.combat.criticalHits).toBe(1);
    expect(report.projectiles.heroSpawned).toBe(1);
    expect(report.projectiles.pierceHits).toBe(1);
    expect(report.performance.longFrames).toBe(1);
    expect(report.upgrades.history[0]).toMatchObject({ id: 'heavy-rivets', level: 1, rarity: 'COMMON' });
    expect(submit).toHaveBeenCalledTimes(1);
  });
});

describe('RunReportProvider', () => {
  it('retains failed reports and removes them after remote acceptance', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) } as unknown as Storage;
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ submitted: true, runId: 'RUN-0001' }) });
    const provider = new RunReportProvider({ endpoint: 'https://example.test/report', storage, fetchFn: fetchFn as any });
    await provider.submit({ schemaVersion: 1, reportId: 'wm-provider-test', run: {} } as any);
    expect(JSON.parse(values.get(RUN_REPORT_QUEUE_KEY) || '[]')).toHaveLength(1);
    await provider.flushPending();
    expect(JSON.parse(values.get(RUN_REPORT_QUEUE_KEY) || '[]')).toHaveLength(0);
  });

  it('uses explicit browser-safe transport options and disables keepalive for reports above the safe budget', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) } as unknown as Storage;
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ queued: true }) });
    const provider = new RunReportProvider({ endpoint: 'https://example.test/report', storage, fetchFn: fetchFn as any });
    await provider.submit({ schemaVersion: 1, reportId: 'wm-large-report', run: {}, diagnosticPadding: 'x'.repeat(70 * 1024) } as any);
    const [, options] = fetchFn.mock.calls[0];
    expect(options).toMatchObject({ method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', keepalive: false });
    const status = JSON.parse(values.get(RUN_REPORT_TRANSPORT_STATUS_KEY) || '{}');
    expect(status).toMatchObject({ lastReportId: 'wm-large-report', lastReportOk: true, lastReportKeepalive: false });
    expect(status.lastReportBytes).toBeGreaterThan(64 * 1024);
  });

  it('sends a lightweight connectivity probe without creating a run report', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) } as unknown as Storage;
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ ok: true, accepted: true }) });
    const provider = new RunReportProvider({ endpoint: 'https://example.test/report', storage, fetchFn: fetchFn as any });
    const result = await provider.probe();
    expect(result.ok).toBe(true);
    expect(fetchFn.mock.calls[0][0]).toBe('https://wreckmarch-telemetry-probe.salahaseel82.workers.dev/probe');
    expect(fetchFn.mock.calls[0][1]).toMatchObject({ method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', keepalive: true });
    expect(JSON.parse(values.get(RUN_REPORT_QUEUE_KEY) || '[]')).toHaveLength(0);
  });

  it('retries a browser keepalive transport failure once without keepalive', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) } as unknown as Storage;
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError('keepalive transport failed')).mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ queued: true }) });
    const provider = new RunReportProvider({ endpoint: 'https://example.test/report', storage, fetchFn: fetchFn as any });
    await provider.submit({ schemaVersion: 1, reportId: 'wm-retry-report', run: {} } as any);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[0][1].keepalive).toBe(true);
    expect(fetchFn.mock.calls[1][1].keepalive).toBe(false);
    expect(JSON.parse(values.get(RUN_REPORT_QUEUE_KEY) || '[]')).toHaveLength(0);
  });
});

describe('remote run-report opt-in', () => {
  it('keeps normal production visits local and enables remote reporting only for the telemetry test flag', () => {
    expect(isRemoteRunReportingEnabled({ search: '' })).toBe(false);
    expect(isRemoteRunReportingEnabled({ search: '?wmTelemetry=0' })).toBe(false);
    expect(isRemoteRunReportingEnabled({ search: '?wmTelemetry=1' })).toBe(true);
    expect(isRemoteRunReportingEnabled({ search: '', override: true })).toBe(true);
  });
});

describe('manual run-report transport', () => {
  it('sends from a normal production URL without enabling automatic telemetry or mutating runtime ownership', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    } as unknown as Storage;
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ queued: true })
    });

    vi.stubGlobal('fetch', fetchFn);
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('location', { search: '', href: 'https://aseel90.github.io/wreckmarch/' });

    const report = { schemaVersion: 1, reportId: 'wm-manual-normal-url', run: {} } as any;
    const telemetry = {
      finalized: true,
      getReport: () => report,
      provider: { kind: 'noop-owner' },
      remoteReportingEnabled: false,
      lastSubmission: undefined
    } as any;
    const scene = { runTelemetry: telemetry } as any;
    const game = {
      scene: { getScene: (key: string) => key === 'Wreckmarch' ? scene : null }
    } as any;

    try {
      const result = await sendCurrentRunReport(game);
      expect(result).toMatchObject({ ok: true, stage: 'sent', reportId: report.reportId, httpStatus: 202 });
      expect(fetchFn).toHaveBeenCalled();
      expect(fetchFn.mock.calls[0][0]).toBe('https://wreckmarch-run-reports.salahaseel82.workers.dev/report');
      expect(game.__wreckmarchRunReportProvider).toBeUndefined();
      expect(telemetry.remoteReportingEnabled).toBe(false);
      expect(telemetry.provider).toEqual({ kind: 'noop-owner' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

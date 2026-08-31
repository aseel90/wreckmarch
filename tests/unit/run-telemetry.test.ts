import { describe, expect, it, vi } from 'vitest';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';
import { isRemoteRunReportingEnabled, RunReportProvider, RUN_REPORT_QUEUE_KEY } from '../../src/telemetry/run-report-provider.js';
const group = (items: any[]) => ({ getChildren: () => items });
const baseScene = () => ({ runTime: 1, level: 1, scrap: 0, heroHp: 100, heroMaxHp: 100, hero: { x: 0, y: 0 }, lastShot: 0, enemies: group([]), bullets: group([]), __runDirectorState: { wave: 1, pressurePhase: 'lull', threatBudget: 15, activeCap: 26, spawnIntervalMs: 720, hpMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1 }, upgradeLevels: {}, upgradeRarityHistory: {}, runStatState: { resolve: () => ({ weapon: { damage: 24 } }) } }) as any;

describe('RunTelemetry', () => {
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
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ submitted: true, runId: 'RUN-0001' }) });
    const provider = new RunReportProvider({ endpoint: 'https://example.test/report', storage, fetchFn: fetchFn as any });
    await provider.submit({ schemaVersion: 1, reportId: 'wm-provider-test', run: {} } as any);
    expect(JSON.parse(values.get(RUN_REPORT_QUEUE_KEY) || '[]')).toHaveLength(1);
    await provider.flushPending();
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

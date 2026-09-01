import { describe, expect, it } from 'vitest';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';

const group = (items: any[]) => ({ getChildren: () => items });

function baseScene() {
  return {
    runTime: 1,
    level: 1,
    scrap: 0,
    heroHp: 100,
    heroMaxHp: 100,
    hero: { x: 0, y: 0 },
    lastShot: 0,
    enemies: group([]),
    bullets: group([]),
    __runDirectorState: { wave: 1, pressurePhase: 'lull', threatBudget: 15, activeCap: 26, spawnIntervalMs: 720, hpMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1 },
    upgradeLevels: {},
    upgradeRarityHistory: {},
    runStatState: { resolve: () => ({ weapon: { damage: 24 } }) }
  } as any;
}

describe('RunTelemetry projectile damage attribution', () => {
  it('records effective damage by mechanic and keeps hero misses finite', () => {
    const scene = baseScene();
    const telemetry = new RunTelemetry(scene, { reportIdFactory: () => 'wm-attribution-test', now: () => 1000 });
    const primary: any = { active: true, isCritical: false, hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    const pierce: any = { active: true, isCritical: false, projectilePath: 'pierce', hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    const ricochet: any = { active: true, isCritical: true, projectilePath: 'ricochet', hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    const shrapnel: any = { active: true, isSecondaryProjectile: true, projectileKind: 'shrapnel', hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };

    scene.bullets = group([primary, pierce, ricochet, shrapnel]);
    telemetry.update(16);
    telemetry.recordProjectileDamage(primary, { appliedDamage: 24, currentHp: 100 });
    telemetry.recordProjectileDamage(pierce, { appliedDamage: 7.2, currentHp: 80 });
    telemetry.recordProjectileDamage(ricochet, { appliedDamage: 12, currentHp: 10 });
    telemetry.recordProjectileDamage(shrapnel, { appliedDamage: 6, currentHp: 4 });

    const report: any = telemetry.finalize();
    expect(report.combat.damageByProjectilePath).toMatchObject({ primary: 24, pierce: 7.2, ricochet: 10, shrapnel: 4, support: 0 });
    expect(report.combat.hitsByProjectilePath).toMatchObject({ primary: 1, pierce: 1, ricochet: 1, shrapnel: 1, support: 0 });
    expect(report.combat.criticalDamageDealt).toBe(10);
    expect(report.projectiles.heroMisses).toBe(3);
    expect(Number.isFinite(report.projectiles.heroMisses)).toBe(true);
  });
});

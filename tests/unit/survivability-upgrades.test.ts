import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolvePlayerContactHit } from '../../src/combat/player-damage-rules.js';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade } from '../../src/upgrades/upgrade-runtime.js';

const scene = (heroHp = 50, heroMaxHp = 100) => ({ heroHp, heroMaxHp, heroShieldCharges: 0, upgradeLevels: {} as Record<string, number>, upgradeRarityHistory: {} as Record<string, string[]>, runTime: 0, level: 1, scrap: 0 });

describe('survivability utility cards', () => {
  it('Field Repair restores rarity-scaled max-HP percentage and hides near full HP', () => {
    const definition = getUpgradeDefinition('field-repair');
    expect(definition?.description).toBe('Restore 25% max HP.');
    const s = scene(40, 100);
    expect(canApplyRegisteredUpgrade(s, 'field-repair')).toBe(true);
    applyRegisteredUpgrade(s, 'field-repair', { rarity: 'LEGENDARY' });
    expect(s.heroHp).toBeCloseTo(77.5, 8);
    expect(canApplyRegisteredUpgrade(scene(92, 100), 'field-repair')).toBe(false);
  });

  it('Impact Shield is Common-only and capped at two charges', () => {
    const s = scene();
    expect(() => applyRegisteredUpgrade(s, 'impact-shield', { rarity: 'LEGENDARY' })).toThrow(/fixed to COMMON rarity/);
    expect(s.heroShieldCharges).toBe(0);
    expect(s.upgradeLevels['impact-shield']).toBeUndefined();
    applyRegisteredUpgrade(s, 'impact-shield');
    expect(s.heroShieldCharges).toBe(1);
    expect(s.upgradeRarityHistory['impact-shield']).toEqual(['COMMON']);
    applyRegisteredUpgrade(s, 'impact-shield');
    expect(s.heroShieldCharges).toBe(2);
    expect(canApplyRegisteredUpgrade(s, 'impact-shield')).toBe(false);
  });

  it('shield consumes a charge before HP', () => {
    const result = resolvePlayerContactHit({ currentHp: 60, shieldCharges: 2, lastHitAt: 0, now: 1000, enemyDamage: 11, heroX: 10, heroY: 0, enemyX: 0, enemyY: 0 });
    expect(result).toMatchObject({ shieldAbsorbed: true, preventedDamage: 11, appliedDamage: 0, nextShieldCharges: 1, nextHp: 60, killed: false });
  });

  it('telemetry tracks healing and prevented shield damage', () => {
    const s = scene(50, 100);
    const telemetry = new RunTelemetry(s, { now: () => 0, reportIdFactory: () => 'survival-test' });
    s.heroHp = 75;
    telemetry.observePlayerDamage([]);
    telemetry.recordShieldAbsorb({ preventedDamage: 12 });
    const report = telemetry.getReport();
    expect(report.combat.healingReceived).toBe(25);
    expect(report.combat.shieldHitsAbsorbed).toBe(1);
    expect(report.combat.shieldDamagePrevented).toBe(12);
  });

  it('wires both cards through the canonical active offer owner and keeps critical feedback in combat', () => {
    const phaseC = fs.readFileSync(new URL('../../src/phase-c-runtime.js', import.meta.url), 'utf8');
    const phaseC1 = fs.readFileSync(new URL('../../src/phase-c1-runtime.js', import.meta.url), 'utf8');
    const upgradeScene = fs.readFileSync(new URL('../../src/upgrades/upgrade-scene.js', import.meta.url), 'utf8');
    const offerPool = fs.readFileSync(new URL('../../src/upgrades/upgrade-offer-pool.js', import.meta.url), 'utf8');
    const enemyCombat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');
    expect(phaseC).toContain('createActiveUpgradeOfferChoices(scene)');
    expect(upgradeScene).toContain('createActiveUpgradeOfferChoices(this)');
    expect(phaseC1).not.toContain('createActiveUpgradeOfferChoices');
    expect(offerPool).toContain("offer('field-repair', 'UTILITY'");
    expect(offerPool).toContain("offer('impact-shield', 'UTILITY'");
    expect(offerPool).toContain('UPGRADE_OFFER_POOL_GROUPS.SURVIVABILITY_AUXILIARY');
    expect(enemyCombat).toContain('CRIT!');
  });
});

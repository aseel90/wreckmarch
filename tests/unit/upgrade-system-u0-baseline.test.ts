import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Upgrade System 2.0 U0 migration baseline', () => {
  it('freezes the current Runner identity and base stats before U1 refactoring', () => {
    const runner = read('src/characters/definitions/runner.js');
    expect(runner).toContain("id: 'runner'");
    expect(runner).toContain('maxHp: 100');
    expect(runner).toContain('moveSpeed: 255');
    expect(runner).toContain("key: 'character-runner-idle'");
    expect(runner).toContain("key: 'character-runner-run'");
  });

  it('freezes current player movement balance boundaries', () => {
    const balance = read('src/balance/run-balance.js');
    expect(balance).toContain('baseMoveSpeed: 255');
    expect(balance).toContain('fleetFeetPercent: .03');
    expect(balance).toContain('fleetFeetMaxLevel: 3');
    expect(balance).toContain('moveSpeedHardCap: 280');
  });

  it('keeps WeaponSystem as the authoritative auto-target and firing owner', () => {
    const weapon = read('src/combat/weapon-system.js');
    expect(weapon).toContain('authoritative target acquisition and weapon firing owner');
    expect(weapon).toContain('acquireTarget(');
    expect(weapon).toContain('fireHeroProjectile(');
    expect(weapon).toContain('this.projectiles.spawn({');
    expect(weapon).toContain('const fireDelay =');
  });

  it('tracks the U2 ownership boundary while cards migrate incrementally', () => {
    const phaseC = read('src/phase-c-runtime.js');
    const phaseC1 = read('src/phase-c1-runtime.js');
    const upgradeRuntime = read('src/upgrades/upgrade-runtime.js');

    expect(phaseC).toContain("createRegisteredStatUpgradeChoice(scene, 'heavy-rivets'");
    expect(phaseC1).toContain("createRegisteredStatUpgradeChoice(scene, 'heavy-rivets'");
    expect(phaseC).toContain("createRegisteredStatUpgradeChoice(scene, 'overclock'");
    expect(phaseC1).toContain("createRegisteredStatUpgradeChoice(scene, 'overclock'");
    expect(phaseC).toContain("createRegisteredStatUpgradeChoice(scene, 'long-barrel'");
    expect(phaseC1).toContain("createRegisteredStatUpgradeChoice(scene, 'long-barrel'");
    expect(phaseC).toContain("createRegisteredUpgradeChoice(scene, 'twin-riveter'");
    expect(phaseC1).toContain("createRegisteredUpgradeChoice(scene, 'twin-riveter'");
    expect(phaseC).toContain("createRegisteredStatUpgradeChoice(scene, 'fleet-feet'");
    expect(phaseC1).toContain("createRegisteredStatUpgradeChoice(scene, 'fleet-feet'");
    expect(phaseC).toContain("createRegisteredStatUpgradeChoice(scene, 'scrap-magnet'");
    expect(phaseC1).toContain("createRegisteredStatUpgradeChoice(scene, 'scrap-magnet'");
    expect(phaseC).toContain("createRegisteredUpgradeChoice(scene, 'armor-plate'");
    expect(phaseC1).toContain("createRegisteredUpgradeChoice(scene, 'armor-plate'");
    expect(phaseC).not.toContain('primaryWeapon.damage *= 1.2');
    expect(phaseC1).not.toContain('primaryWeapon.damage*=1.2');
    expect(phaseC).not.toContain('primaryWeapon.fireDelay = Math.max(145');
    expect(phaseC1).not.toContain('primaryWeapon.fireDelay=Math.max(145');
    expect(phaseC).not.toContain('primaryWeapon.projectileSpeed *= 1.18');
    expect(phaseC1).not.toContain('primaryWeapon.projectileSpeed*=1.18');
    expect(phaseC).not.toContain('primaryWeapon.range *= 1.1');
    expect(phaseC1).not.toContain('primaryWeapon.range*=1.1');
    expect(phaseC).not.toContain("id: 'twin-riveter'");
    expect(phaseC1).not.toContain("id:'twin-riveter'");
    expect(phaseC).not.toContain("id: 'fleet-feet'");
    expect(phaseC1).not.toContain("id:'fleet-feet'");
    expect(phaseC).not.toContain("id: 'scrap-magnet'");
    expect(phaseC1).not.toContain("id:'scrap-magnet'");
    expect(phaseC).not.toContain("id: 'armor-plate'");
    expect(phaseC1).not.toContain("id:'armor-plate'");
    expect(phaseC).not.toContain('scene.heroMaxHp += 15');
    expect(phaseC1).not.toContain('scene.heroMaxHp+=15');
    expect(phaseC).not.toContain('scene.magnetRadius *= 1.25');
    expect(phaseC1).not.toContain('scene.magnetRadius*=1.25');
    expect(phaseC1).not.toContain("scene.heroSpeed=Math.min(365,scene.heroSpeed*1.08)");
    expect(upgradeRuntime).toContain('applyRegisteredStatUpgrade');
    expect(upgradeRuntime).toContain('applyRegisteredUpgrade');

    expect(phaseC).toContain("const pickupRadiusMultiplier = Number(this.runCombatStats?.pickupRadiusMultiplier) || 1;");
    expect(phaseC).toContain('const magnetRadius = this.magnetRadius * pickupRadiusMultiplier;');

    expect(phaseC).toContain("id: 'call-rig'");
    expect(phaseC1).toContain("id:'call-rig'");
    expect(upgradeRuntime).toContain('applyMixedRegisteredUpgrade');
    expect(upgradeRuntime).toContain('createUpgradeMechanicalTransaction');
  });

  it('keeps the final Runner production boundary routed through CharacterSystem', () => {
    const d1 = read('src/phase-d1-runtime.js');
    expect(d1).toContain("new CharacterSystem(s,s.characterId||'runner')");
    expect(d1).toContain('character.installProductionVisuals()');
    expect(d1).toContain('this.characterSystem.updateLocomotionVisuals()');
    expect(d1).toContain('this.characterSystem.getWeaponSocket(q)');
    expect(d1).toContain('this.characterSystem.getMuzzleReach(q)');
  });

  it('locks the U1 Runner extension to data-only identity fields', () => {
    const runner = read('src/characters/definitions/runner.js');
    expect(runner).toContain("id: 'rivet-gun'");
    expect(runner).toContain('combatProfile: Object.freeze({');
    expect(runner).toContain('critChance: 0');
    expect(runner).toContain("id: 'runner-baseline'");
    expect(runner).toContain('enabled: false');
  });
});

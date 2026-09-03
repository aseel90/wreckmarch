import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const historical = [
  'src/game.js',
  'src/art-runtime.js',
  'src/phase-b-runtime.js',
  'src/phase-b1-polish.js',
  'src/phase-c-runtime.js',
  'src/phase-c1-runtime.js',
  'src/phase-c2-runtime.js',
  'src/phase-c3-runtime.js',
  'src/phase-c3-frame-fix.js',
  'src/phase-c4-runtime.js',
  'src/phase-c5-runtime.js',
  'src/phase-d1-runtime.js',
  'src/characters/runner-production-presentation.js'
];

describe('Weapon / Projectile ownership integration', () => {
  it('installs authoritative systems with Enemy Foundation', () => {
    const enemySystem = read('src/enemies/enemy-system.js');
    expect(enemySystem).toContain("import { ProjectileSystem } from '../combat/projectile-system.js?v=5'");
    expect(enemySystem).toContain("import { WeaponSystem } from '../combat/weapon-system.js?v=8'");
    expect(enemySystem).toContain('scene.projectileSystem = new ProjectileSystem(scene)');
    expect(enemySystem).toContain('scene.weaponSystem = new WeaponSystem(scene, { projectileSystem: scene.projectileSystem })');
  });

  it('keeps projectile construction out of historical runtime layers', () => {
    historical.forEach(path => {
      const source = read(path);
      expect(source, path).not.toContain('bullets.create(');
    });
    expect(read('src/combat/projectile-system.js')).toContain('this.scene.bullets.create(');
  });

  it('removes historical weapon/projectile callback ownership', () => {
    const forbidden = ['autoFire', 'findNearestEnemy', 'getWeaponMuzzle', 'fireHeroBullet', 'updateBullets'];
    historical.forEach(path => {
      const source = read(path);
      forbidden.forEach(name => expect(source, `${path}:${name}`).not.toContain(name));
    });
    const game = read('src/game.js');
    expect(game).toContain('this.projectileSystem?.update(delta)');
    expect(game).toContain('this.weaponSystem?.update(time)');
  });

  it('keeps critical-hit resolution in WeaponSystem and damage application generic', () => {
    const weapon = read('src/combat/weapon-system.js');
    const enemyCombat = read('src/combat/enemy-combat-system.js');
    expect(weapon).toContain('export function resolveHeroCriticalHit');
    expect(weapon).toContain('const critical = resolveHeroCriticalHit(scene.runCombatStats, this.randomSource)');
    expect(weapon).toContain('damage: baseDamage * critical.damageMultiplier');
    expect(enemyCombat).not.toContain('critChance');
    expect(enemyCombat).not.toContain('criticalRoll');
  });

  it('routes final Hero and Rig profiles through WeaponSystem', () => {
    const runnerPresentation = read('src/characters/runner-production-presentation.js');
    expect(read('src/phase-c3-runtime.js')).toContain('s.weaponSystem.configureHero(');
    expect(read('src/phase-c4-runtime.js')).toContain('s.rigSystem=new RigSystem');
    expect(read('src/rig/rig-system.js')).toContain('scene.weaponSystem.fireSupportVolley(');
    expect(read('src/phase-c5-runtime.js')).toContain("installCharacterPresentationPhase(s,'c5')");
    expect(read('src/phase-d1-runtime.js')).toContain("installCharacterPresentationPhase(s,'d1')");
    expect(runnerPresentation.match(/s\.weaponSystem\.setMuzzleResolver\(/g)?.length).toBe(2);
  });

  it('keeps Hunter rivets compact and routes recoil through the visible Runner weapon presenter', () => {
    const runnerPresentation = read('src/characters/runner-production-presentation.js');
    expect(runnerPresentation).toContain("g.generateTexture('hunter-rivet',18,8)");
    expect(runnerPresentation).toContain('projectile:{lifeMs:1180,scale:.62,radius:4,offsetX:5,offsetY:0}');
    expect(runnerPresentation).toContain('s.weaponV3Recoil=Math.min(1.9');
    expect(runnerPresentation).toContain('this.weaponV3Recoil*=.62');
    expect(runnerPresentation).toContain("setScale(.31).setAlpha(.9).setBlendMode(Phaser.BlendModes.ADD)");
    expect(runnerPresentation).toContain("setScale(.14).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD)");
    expect(runnerPresentation).toContain("bullet?.setTexture?.('hunter-rivet')?.setScale?.(.62)?.setRotation?.(Math.atan2(vy,vx))");
  });

  it('keeps Explosive Rivet in the canonical active upgrade offer pool', () => {
    const phaseC = read('src/phase-c-runtime.js');
    const phaseC1 = read('src/phase-c1-runtime.js');
    const upgradeScene = read('src/upgrades/upgrade-scene.js');
    const offerPool = read('src/upgrades/upgrade-offer-pool.js');
    expect(offerPool).toContain("offer('explosive-rivet', 'HERO'");
    expect(phaseC).toContain('createActiveUpgradeOfferChoices(scene)');
    expect(upgradeScene).toContain('createActiveUpgradeOfferChoices(this)');
    expect(phaseC1).not.toContain('createActiveUpgradeOfferChoices');
    expect(phaseC).not.toContain("createRegisteredUpgradeChoice(scene, 'explosive-rivet'");
    expect(phaseC1).not.toContain("createRegisteredUpgradeChoice(scene, 'explosive-rivet'");
    expect(upgradeScene).toContain('rollUpgradeChoices(createActiveUpgradeOfferChoices(this), { count: 3 })');
  });

  it('keeps Triple Riveter in the canonical advanced pool behind canonical requirements', () => {
    const phaseC = read('src/phase-c-runtime.js');
    const phaseC1 = read('src/phase-c1-runtime.js');
    const offerPool = read('src/upgrades/upgrade-offer-pool.js');
    expect(offerPool).toContain("offer('triple-riveter', 'EVOLUTION'");
    expect(offerPool).toContain('UPGRADE_OFFER_POOL_GROUPS.HUNTER_ADVANCED');
    expect(phaseC).not.toContain("upgradeLevels?.['twin-riveter'] >= 2");
    expect(phaseC1).not.toContain("upgradeLevels?.['twin-riveter'] >= 2");
  });

  it('provides canonical card art for Explosive Rivet', () => {
    const art = read('src/upgrades/upgrade-card-art.js');
    expect(art).toContain("'explosive-rivet': 'upgrade-icon-explosive-rivet'");
    expect(art).toContain('function buildExplosiveRivetIcon(scene)');
    expect(read('src/phase-d1-runtime.js')).toContain("s.textures.exists('upgrade-icon-explosive-rivet')");
  });

  it('cache-busts the U4 projectile-upgrade live owners from the boot graph', () => {
    const html = read('index.html');
    expect(html).toContain("./src/enemies/enemy-system.js?v=28");
    expect(html).toContain("./src/phase-c-runtime.js?v=24");
    expect(html).toContain("./src/phase-c1-runtime.js?v=19");
    expect(html).toContain("./src/phase-c5-runtime.js?v=9");
    expect(html).toContain("./src/phase-d1-runtime.js?v=28&u5=3");
  });
});

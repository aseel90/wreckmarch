import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Weapon / Projectile ownership integration', () => {
  it('keeps projectile mutation ownership in ProjectileSystem and projectile-upgrade definitions', () => {
    const projectileSystem = read('src/combat/projectile-system.js');
    const upgradeRuntime = read('src/upgrades/upgrade-runtime.js');
    expect(projectileSystem).toContain('class ProjectileSystem');
    expect(upgradeRuntime).toContain("case 'projectile'");
  });

  it('keeps the active weapon registry as the only weapon identity resolver', () => {
    const weaponRegistry = read('src/combat/weapon-registry.js');
    expect(weaponRegistry).toContain('resolveCharacterSignatureWeapon');
    expect(weaponRegistry).toContain('getWeaponDefinition');
  });

  it('routes the live weapon through WeaponSystem rather than direct projectile ownership', () => {
    const phaseC = read('src/phase-c-runtime.js');
    expect(phaseC).toContain('new WeaponSystem');
    expect(phaseC).not.toContain('new ProjectileSystem');
  });

  it('keeps upgrade behavior out of phase presentation wrappers', () => {
    const phaseC = read('src/phase-c-runtime.js');
    const phaseC1 = read('src/phase-c1-runtime.js');
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
    expect(html).toContain("./src/phase-c5-runtime.js?v=10");
    expect(html).toContain("./src/phase-d1-runtime.js?v=29&u5=3");
  });
});

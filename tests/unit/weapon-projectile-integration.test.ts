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
  'src/phase-d1-runtime.js'
];

describe('Weapon / Projectile ownership integration', () => {
  it('installs authoritative systems with Enemy Foundation', () => {
    const enemySystem = read('src/enemies/enemy-system.js');
    expect(enemySystem).toContain("import { ProjectileSystem } from '../combat/projectile-system.js?v=2'");
    expect(enemySystem).toContain("import { WeaponSystem } from '../combat/weapon-system.js?v=3'");
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

  it('routes final Hero and Rig profiles through WeaponSystem', () => {
    expect(read('src/phase-c3-runtime.js')).toContain('s.weaponSystem.configureHero(');
    expect(read('src/phase-c4-runtime.js')).toContain('s.rigSystem=new RigSystem');
    expect(read('src/rig/rig-system.js')).toContain('scene.weaponSystem.fireSupportVolley(');
    expect(read('src/phase-c5-runtime.js')).toContain('s.weaponSystem.setMuzzleResolver(');
    expect(read('src/phase-d1-runtime.js')).toContain('s.weaponSystem.setMuzzleResolver(');
  });

  it('keeps Hunter rivets compact and routes recoil through the visible D1 weapon', () => {
    const d1 = read('src/phase-d1-runtime.js');
    expect(d1).toContain("g.generateTexture('hunter-rivet',18,8)");
    expect(d1).toContain('projectile:{lifeMs:1180,scale:.62,radius:4,offsetX:5,offsetY:0}');
    expect(d1).toContain('s.weaponV3Recoil=Math.min(1.9');
    expect(d1).toContain('this.weaponV3Recoil*=.62');
    expect(d1).toContain("setScale(.31).setAlpha(.9).setBlendMode(Phaser.BlendModes.ADD)");
    expect(d1).toContain("setScale(.14).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD)");
    expect(d1).toContain("bullet?.setTexture?.('hunter-rivet')?.setScale?.(.62)?.setRotation?.(Math.atan2(vy,vx))");
  });

  it('cache-busts the Piercing Rivets live owners from the boot graph', () => {
    const html = read('index.html');
    expect(html).toContain("./src/enemies/enemy-system.js?v=15");
    expect(html).toContain("./src/phase-c-runtime.js?v=17");
    expect(html).toContain("./src/phase-c1-runtime.js?v=12");
    expect(html).toContain("./src/phase-d1-runtime.js?v=17");
  });
});

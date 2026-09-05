import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { getWeaponDefinition } from '../../src/combat/weapon-registry.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Wrecker shotgun projectile visual pass', () => {
  it('owns a dedicated elongated pellet texture and aligns it to projectile velocity', () => {
    const source = read('src/characters/shotgun-production-presentation.js');
    expect(source).toContain("textureKey: 'wrecker-shotgun-pellet'");
    expect(source).toContain('width: 20');
    expect(source).toContain('height: 8');
    expect(source).toContain('generateTexture(profile.textureKey, profile.width, profile.height)');
    expect(source).toContain('shots?.forEach?.(({ bullet })');
    expect(source).toContain('setRotation?.(Math.atan2(vy, vx))');
    expect(source).toContain("bullet.__wreckerProjectileVisual = 'shotgun-pellet-v1'");
  });

  it('keeps the canonical Shotgun balance and spread untouched', () => {
    const weapon = getWeaponDefinition('shotgun');
    expect(weapon.stats).toMatchObject({
      damage: 24,
      fireDelay: 720,
      projectileSpeed: 760,
      range: 330,
      pierceCount: 0,
      ricochetCount: 0,
      shrapnelCount: 0
    });
    expect(weapon.fireProfile).toEqual({
      projectileCount: 5,
      halfSpreadRadians: 0.24,
      volleyDamageMultiplier: 1.75
    });
  });

  it('keeps projectile gameplay ownership outside the Wrecker presenter', () => {
    const source = read('src/characters/shotgun-production-presentation.js');
    expect(source).not.toContain('bullets.create(');
    expect(source).not.toContain('setCircle(');
    expect(source).not.toContain('setVelocity(');
    expect(source).not.toContain('bullet.damage =');
  });
});

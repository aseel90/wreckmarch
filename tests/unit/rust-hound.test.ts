import { describe, expect, it } from 'vitest';
import { RUST_HOUND_DEFINITION } from '../../src/enemies/definitions/rust-hound.js';
import { computeHoundPounceAim, updateHoundPounceBehavior } from '../../src/enemies/behaviors/hound-pounce.js';
import { getEnemyPool, pickEnemyForRun } from '../../src/balance/run-balance.js';

function fakeHound() {
  const enemy: any = {
    active: true,
    x: 0,
    y: 0,
    speed: 190,
    baseDamage: 12,
    damage: 12,
    enemyDefinition: RUST_HOUND_DEFINITION,
    behaviorConfig: RUST_HOUND_DEFINITION.behaviorConfig,
    body: { velocity: { x: 0, y: 0 } },
    setVelocity(vx: number, vy: number) { this.body.velocity.x = vx; this.body.velocity.y = vy; return this; },
    setFlipX(value: boolean) { this.flipX = value; return this; },
    setRotation(value: number) { this.rotation = value; return this; },
    setTint(value: number) { this.tint = value; return this; },
    clearTint() { this.tint = null; return this; },
    setTexture(value: string) { this.textureKey = value; return this; },
    play(value: string) { this.animation = value; return this; },
    anims: { currentAnim: null, isPlaying: false }
  };
  return enemy;
}

function fakeScene(now = 0) {
  return { time: { now }, game: { loop: { delta: 16.667 } }, spawnDust() {}, playTone() {} } as any;
}

describe('Rust Hound', () => {
  it('enters the run pool in wave 2 with threat 2', () => {
    expect(getEnemyPool(0).entries.map(entry => entry.id)).toEqual(['scrap-rat']);
    expect(getEnemyPool(60).entries.map(entry => entry.id)).toEqual(['scrap-rat', 'rust-hound']);
    expect(pickEnemyForRun(60, () => .99)).toMatchObject({ id: 'rust-hound', threat: 2 });
  });

  it('predicts a moving target but caps lead distance', () => {
    const hound: any = { x: 0, y: 0, behaviorConfig: RUST_HOUND_DEFINITION.behaviorConfig };
    const target: any = { x: 100, y: 0, body: { velocity: { x: 1000, y: 0 } } };
    const aim = computeHoundPounceAim(hound, target);
    expect(aim.leadX).toBeLessThanOrEqual(46);
    expect(aim.x).toBeCloseTo(1, 6);
  });

  it('telegraphs before pouncing and raises damage only during the pounce', () => {
    const enemy = fakeHound();
    const target: any = { x: 180, y: 0, body: { velocity: { x: 0, y: 0 } } };
    const scene = fakeScene(0);
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('chase');
    scene.time.now = 800;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('telegraph');
    expect(enemy.damage).toBe(12);
    scene.time.now = 1200;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('pounce');
    expect(enemy.__houndPounceCount).toBe(1);
    expect(enemy.__houndLastPounceSpeed).toBe(348);
    expect(enemy.damage).toBeCloseTo(17.4, 6);
    scene.time.now = 1530;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('recover');
    expect(enemy.damage).toBe(12);
  });
});

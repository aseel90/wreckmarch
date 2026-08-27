import { describe, expect, it } from 'vitest';
import { RUST_HOUND_DEFINITION } from '../../src/enemies/definitions/rust-hound.js';
import { computeHoundSlideAim, updateHoundPounceBehavior } from '../../src/enemies/behaviors/hound-pounce.js';
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
    stop() { this.animation = null; this.stopCount = (this.stopCount || 0) + 1; return this; },
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
    const aim = computeHoundSlideAim(hound, target);
    expect(Math.hypot(aim.leadX, aim.leadY)).toBeCloseTo(28, 10);
    expect(aim.x).toBeCloseTo(1, 6);
  });

  it('telegraphs before a committed ground slide and raises damage only during the slide', () => {
    const enemy = fakeHound();
    const target: any = { x: 180, y: 0, body: { velocity: { x: 0, y: 0 } } };
    const scene = fakeScene(0);
    const cfg = RUST_HOUND_DEFINITION.behaviorConfig;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('chase');

    scene.time.now = cfg.initialCooldownMaxMs + 1;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('telegraph');
    expect(enemy.__houndMotion.attackCommitted).toBe(true);
    expect(enemy.textureKey).toBe('rust-hound-crouch');
    expect(enemy.animation).toBeNull();
    expect(enemy.damage).toBe(12);

    scene.time.now += cfg.telegraphMs + 1;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('slide');
    expect(enemy.__houndSlideCount).toBe(1);
    expect(enemy.__houndLastSlideSpeed).toBe(360);
    expect(enemy.__houndMotion.attackCommitted).toBe(true);
    expect(enemy.textureKey).toBe('rust-hound-pounce');
    expect(enemy.animation).toBeNull();
    expect(enemy.damage).toBeCloseTo(16.8, 6);

    const lockedAim = { x: enemy.__houndMotion.aimX, y: enemy.__houndMotion.aimY };
    target.y = 300;
    scene.time.now += 100;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('slide');
    expect(enemy.__houndMotion.aimX).toBeCloseTo(lockedAim.x, 6);
    expect(enemy.__houndMotion.aimY).toBeCloseTo(lockedAim.y, 6);

    scene.time.now += cfg.slideMs + 1;
    updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
    expect(enemy.__houndPhase).toBe('recover');
    expect(enemy.__houndMotion.attackCommitted).toBe(false);
    expect(enemy.damage).toBe(12);
  });

  it('peels out of point-blank range and rebuilds a readable slide lane', () => {
    const enemy = fakeHound();
    enemy.x = 105;
    enemy.y = 480;
    const target: any = { x: 320, y: 480, body: { velocity: { x: 0, y: 0 } } };
    const scene = fakeScene(0);
    for (let frame = 0; frame < 120; frame += 1) {
      scene.time.now = frame * 16.667;
      updateHoundPounceBehavior({ scene, enemy, target, random: () => 0 });
      const dt = 16.667 / 1000;
      enemy.x += enemy.body.velocity.x * dt;
      enemy.y += enemy.body.velocity.y * dt;
    }
    expect(enemy.__houndTelegraphCount).toBeGreaterThanOrEqual(1);
    expect(enemy.__houndSlideCount).toBeGreaterThanOrEqual(1);
    expect(enemy.__houndMotion.maxObservedSpeed).toBeCloseTo(360, 3);
  });
});

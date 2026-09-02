import { describe, expect, it, vi } from 'vitest';
import { rollUpgradeChoices } from '../../src/upgrades/upgrade-roll-service.js';
import { createEliteRewardContext, EliteRewardSystem } from '../../src/rewards/elite-reward-system.js';
import { EliteMilestoneController } from '../../src/rewards/u3-elite-reward-runtime.js';

function choice(id: string, rarityConstraint: string | null = null) {
  return { id, weight: 1, rarityConstraint, available: () => true, apply: vi.fn() };
}

function mockCrate() {
  return {
    active: true,
    setDepth() { return this; }, setScale() { return this; }, setTint() { return this; }, setImmovable() { return this; },
    body: { setAllowGravity: vi.fn() },
    disableBody: vi.fn(function(this: any) { this.active = false; return this; }),
    destroy: vi.fn(function(this: any) { this.active = false; })
  } as any;
}

describe('U3 Elite reward guarantee', () => {
  it('keeps the canonical three-choice at-least-one-Rare-or-better contract', () => {
    expect(createEliteRewardContext()).toEqual({
      source: 'elite-crate', label: 'WRECK CRATE', subtitle: 'ELITE REWARD', choices: 3, minimumRarity: 'RARE'
    });
  });

  it('repairs only one eligible choice to Rare+ when a normal three-choice roll misses the guarantee', () => {
    const offer = rollUpgradeChoices([
      choice('fixed-common', 'COMMON'), choice('a'), choice('b'), choice('c')
    ], { count: 3, guaranteedMinimumRarity: 'RARE', rng: () => 0 });
    expect(offer.map(item => item.id)).toEqual(['fixed-common', 'a', 'b']);
    expect(offer.filter(item => item.rarity === 'RARE')).toHaveLength(1);
    expect(offer.some(item => item.rarity === 'COMMON')).toBe(true);
  });

  it('replaces a fixed-Common choice only when the selected offer cannot satisfy a guarantee that the pool can support', () => {
    const offer = rollUpgradeChoices([
      choice('x', 'COMMON'), choice('y', 'COMMON'), choice('z', 'COMMON'), choice('rare-capable')
    ], { count: 3, guaranteedMinimumRarity: 'RARE', rng: () => 0 });
    expect(offer).toHaveLength(3);
    expect(offer.some(item => item.id === 'rare-capable' && item.rarity === 'RARE')).toBe(true);
  });

  it('falls back to the normal rarity contract when the eligible pool cannot support Rare+', () => {
    const offer = rollUpgradeChoices([
      choice('x', 'COMMON'), choice('y', 'COMMON'), choice('z', 'COMMON')
    ], { count: 3, guaranteedMinimumRarity: 'RARE', rng: () => 0 });
    expect(offer).toHaveLength(3);
    expect(offer.every(item => item.rarity === 'COMMON')).toBe(true);
  });

  it('retries a guaranteed Elite until spawn actually adds an Elite, then consumes the milestone once', () => {
    const enemies: any[] = [];
    const scene: any = {
      runTime: 0,
      enemies: { getChildren: () => enemies },
      spawnEnemy: vi.fn()
        .mockImplementationOnce(() => null)
        .mockImplementationOnce(() => { enemies.push({ active: true, elite: true }); })
        .mockImplementationOnce(() => { enemies.push({ active: true, elite: true }); })
    };
    const controller = new EliteMilestoneController(scene, [270, 450]);
    expect(controller.trySpawn(269)).toBeNull();
    expect(controller.trySpawn(270)).toBeNull();
    expect(controller.completed.size).toBe(0);
    const first = controller.trySpawn(271);
    expect(first?.__eliteRewardMilestoneSeconds).toBe(270);
    expect(controller.trySpawn(449)).toBeNull();
    expect(controller.trySpawn(450)?.__eliteRewardMilestoneSeconds).toBe(450);
    expect(scene.spawnEnemy).toHaveBeenCalledTimes(3);
  });

  it('opens a WRECK CRATE as a bonus choice without changing XP/level state', () => {
    const crate = mockCrate();
    const group = { create: vi.fn(() => crate) };
    const scene: any = {
      gameOver: false, upgradeOpen: false, hero: {}, level: 7, scrapXp: 13, pendingLevelUps: 2,
      physics: { add: { group: vi.fn(() => group), overlap: vi.fn(() => ({})) } },
      add: { text: vi.fn(() => null) },
      openEliteRewardCards: vi.fn(() => true)
    };
    const rewards = new EliteRewardSystem(scene).install();
    const dropped = rewards.dropCrate({ x: 10, y: 20 });
    expect(rewards.openCrate(dropped)).toBe(true);
    expect(scene.openEliteRewardCards).toHaveBeenCalledWith(expect.objectContaining({ choices: 3, minimumRarity: 'RARE' }));
    expect(scene.level).toBe(7);
    expect(scene.scrapXp).toBe(13);
    expect(scene.pendingLevelUps).toBe(2);
  });

  it('does not consume a crate if an upgrade screen already owns the pause', () => {
    const crate = mockCrate();
    const group = { create: vi.fn(() => crate) };
    const scene: any = {
      gameOver: false, upgradeOpen: true, hero: {},
      physics: { add: { group: vi.fn(() => group), overlap: vi.fn(() => ({})) } },
      add: { text: vi.fn(() => null) },
      openEliteRewardCards: vi.fn(() => true)
    };
    const rewards = new EliteRewardSystem(scene).install();
    rewards.dropCrate({ x: 1, y: 2 });
    expect(rewards.openCrate(crate)).toBe(false);
    expect(crate.__wreckCrateOpened).toBe(false);
  });
});

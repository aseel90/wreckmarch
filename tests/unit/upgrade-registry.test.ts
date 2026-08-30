import { describe, expect, it } from 'vitest';
import { createUpgradeRegistry } from '../../src/upgrades/upgrade-registry.js';
import { UPGRADE_SCOPES } from '../../src/upgrades/upgrade-schema.js';
import { STAT_MODIFIER_TYPES as T } from '../../src/stats/stat-resolver.js';
import { RUN_STAT_DOMAINS as D } from '../../src/stats/run-stat-state.js';

const heavyRivetsFixture = {
  id: 'heavy-rivets',
  name: 'HEAVY RIVETS',
  description: '+20% Rivet Gun damage.',
  rarity: null,
  maxLevel: 5,
  scope: UPGRADE_SCOPES.WEAPON,
  tags: ['DAMAGE', 'RIVET'],
  requirements: [],
  weight: 1.25,
  offerRules: {},
  modifiers: [{
    domain: D.WEAPON,
    stat: 'damage',
    type: T.MULTIPLICATIVE_PERCENT,
    value: 0.2
  }],
  mechanicalEffect: null,
  artId: 'heavy-rivets'
};

describe('Upgrade System 2.0 registry and schema', () => {
  it('registers an immutable numeric upgrade definition', () => {
    const registry = createUpgradeRegistry([heavyRivetsFixture]);
    const definition = registry.get('heavy-rivets');
    if (!definition) throw new Error('Heavy Rivets fixture was not registered');

    expect(registry.size).toBe(1);
    expect(definition.modifiers).toHaveLength(1);
    expect(definition.modifiers[0]).toMatchObject({
      domain: D.WEAPON,
      stat: 'damage',
      type: T.MULTIPLICATIVE_PERCENT,
      value: 0.2
    });
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.modifiers)).toBe(true);
    expect(Object.isFrozen(definition.modifiers[0])).toBe(true);
  });

  it('supports declarative resolved-stat caps on numeric modifiers', () => {
    const registry = createUpgradeRegistry([{
      ...heavyRivetsFixture,
      id: 'overclock-fixture',
      name: 'OVERCLOCK FIXTURE',
      description: 'Test-only capped fire-delay definition.',
      modifiers: [{
        domain: D.WEAPON,
        stat: 'fireDelay',
        type: T.MULTIPLICATIVE_PERCENT,
        value: -0.12,
        min: 145
      }]
    }]);

    expect(registry.get('overclock-fixture')?.modifiers[0]).toMatchObject({ min: 145 });
  });

  it('supports multiple numeric modifiers without runtime callbacks', () => {
    const registry = createUpgradeRegistry([{
      ...heavyRivetsFixture,
      id: 'long-barrel-fixture',
      name: 'LONG BARREL FIXTURE',
      description: 'Test-only multi-stat definition.',
      modifiers: [
        { domain: D.WEAPON, stat: 'projectileSpeed', type: T.MULTIPLICATIVE_PERCENT, value: 0.18 },
        { domain: D.WEAPON, stat: 'range', type: T.MULTIPLICATIVE_PERCENT, value: 0.1 }
      ]
    }]);

    expect(registry.get('long-barrel-fixture')?.modifiers).toHaveLength(2);
  });

  it('supports declarative mechanical effects for non-numeric cards', () => {
    const registry = createUpgradeRegistry([{
      ...heavyRivetsFixture,
      id: 'twin-riveter-fixture',
      name: 'TWIN RIVETER FIXTURE',
      description: 'Test-only mechanical definition.',
      maxLevel: 1,
      modifiers: [],
      mechanicalEffect: {
        id: 'set-projectile-count',
        config: { projectileCount: 2 }
      }
    }]);
    const definition = registry.get('twin-riveter-fixture');
    if (!definition) throw new Error('Mechanical fixture was not registered');

    expect(definition.mechanicalEffect?.id).toBe('set-projectile-count');
    expect(definition.mechanicalEffect?.config.projectileCount).toBe(2);
    expect(Object.isFrozen(definition.mechanicalEffect?.config)).toBe(true);
  });

  it('rejects duplicate ids and malformed definitions', () => {
    const registry = createUpgradeRegistry([heavyRivetsFixture]);
    expect(() => registry.register(heavyRivetsFixture)).toThrow(/Duplicate upgrade id/);
    expect(() => createUpgradeRegistry([{ ...heavyRivetsFixture, id: 'Bad ID' }])).toThrow(/Invalid upgrade id/);
    expect(() => createUpgradeRegistry([{ ...heavyRivetsFixture, scope: 'UNKNOWN' }])).toThrow(/Invalid upgrade scope/);
    expect(() => createUpgradeRegistry([{ ...heavyRivetsFixture, modifiers: [], mechanicalEffect: null }])).toThrow(/requires modifiers or mechanicalEffect/);
    expect(() => createUpgradeRegistry([{ ...heavyRivetsFixture, modifiers: [{ ...heavyRivetsFixture.modifiers[0], min: 5, max: 4 }] }])).toThrow(/min cannot be greater than max/);
    expect(() => createUpgradeRegistry([{
      ...heavyRivetsFixture,
      modifiers: [{ ...heavyRivetsFixture.modifiers[0], domain: 'world' }]
    }])).toThrow(/Invalid upgrade modifier domain/);
  });

  it('keeps future offer and requirement data declarative and frozen', () => {
    const registry = createUpgradeRegistry([{
      ...heavyRivetsFixture,
      requirements: ['starter-rivet-gun', { type: 'upgrade-level', id: 'heavy-rivets', level: 2 }],
      offerRules: { minimumRunLevel: 3 }
    }]);
    const definition = registry.get('heavy-rivets');
    if (!definition) throw new Error('Requirement fixture was not registered');

    expect(definition.requirements).toHaveLength(2);
    expect(Object.isFrozen(definition.requirements)).toBe(true);
    expect(Object.isFrozen(definition.requirements[1])).toBe(true);
    expect(Object.isFrozen(definition.offerRules)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { SAWBUG_DEFINITION } from '../../src/enemies/definitions/sawbug.js';
import { listEnemyBehaviorKeys } from '../../src/enemies/enemy-behavior-registry.js';

describe('Sawbug acid spitter', () => {
  it('is a threat-2 ranged enemy with no dash attack contract', () => {
    expect(SAWBUG_DEFINITION.id).toBe('sawbug');
    expect(SAWBUG_DEFINITION.behavior).toBe('acid-spitter');
    expect(SAWBUG_DEFINITION.threatValue).toBe(2);
    expect(listEnemyBehaviorKeys()).toContain('acid-spitter');
    expect(SAWBUG_DEFINITION.behaviorConfig).toMatchObject({
      preferredRangeMin: 205,
      preferredRangeMax: 315,
      telegraphMs: 340,
      projectileSpeed: 275,
      projectileDamage: 11
    });
    expect(SAWBUG_DEFINITION.behaviorConfig).not.toHaveProperty('dashSpeed');
    expect(SAWBUG_DEFINITION.behaviorConfig).not.toHaveProperty('slideSpeed');
  });

  it('uses the approved mid-size visual and forgiving collision profile', () => {
    expect(SAWBUG_DEFINITION.bootstrap.scale.normal).toBe(.70);
    expect(SAWBUG_DEFINITION.bootstrap.physics).toEqual({ radius: 24, offsetX: 56, offsetY: 46 });
    expect(SAWBUG_DEFINITION.variants.normal).toMatchObject({
      hpBase: 76,
      speedMin: 165,
      speedMax: 190,
      contactDamage: 8,
      scrapDrop: 2
    });
  });
});

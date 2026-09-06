import { describe, expect, it, vi } from 'vitest';
import { PREFERRED_FUTURE_WORLD } from '../../src/world/world-contract.js';
import { WorldSectorActivationSystem } from '../../src/world/world-sector-system.js';

describe('R2 WorldSectorActivationSystem', () => {
  it('activates only the nearby sector neighborhood and does no work while the center sector is unchanged', () => {
    const activate = vi.fn();
    const deactivate = vi.fn();
    const system = new WorldSectorActivationSystem({ world: PREFERRED_FUTURE_WORLD, onActivate: activate, onDeactivate: deactivate });

    const first = system.updateForPosition(4800, 4800);
    const sameSector = system.updateForPosition(4900, 4900);

    expect(first.activeSectorCount).toBe(9);
    expect(first.totalSectorCount).toBe(64);
    expect(first.activated).toHaveLength(9);
    expect(first.deactivated).toHaveLength(0);
    expect(sameSector).toBe(first);
    expect(activate).toHaveBeenCalledTimes(9);
    expect(deactivate).not.toHaveBeenCalled();
  });

  it('diffs activation when crossing a sector boundary instead of rebuilding the whole active set', () => {
    const activate = vi.fn();
    const deactivate = vi.fn();
    const system = new WorldSectorActivationSystem({ world: PREFERRED_FUTURE_WORLD, onActivate: activate, onDeactivate: deactivate });

    const first = system.updateForPosition(4800, 4800);
    const second = system.updateForPosition(6001, 4800);

    expect(first.centerSector?.key).toBe('4:4');
    expect(second.centerSector?.key).toBe('5:4');
    expect(second.activeSectorCount).toBe(9);
    expect(second.activated).toHaveLength(3);
    expect(second.deactivated).toHaveLength(3);
    expect(activate).toHaveBeenCalledTimes(12);
    expect(deactivate).toHaveBeenCalledTimes(3);
  });

  it('shrinks naturally at world edges and resets active sectors cleanly', () => {
    const deactivate = vi.fn();
    const system = new WorldSectorActivationSystem({ world: PREFERRED_FUTURE_WORLD, onDeactivate: deactivate });
    const edge = system.updateForPosition(0, 0);
    expect(edge.activeSectorCount).toBe(4);

    const reset = system.reset();
    expect(reset.activeSectorCount).toBe(0);
    expect(reset.centerSector).toBeNull();
    expect(deactivate).toHaveBeenCalledTimes(4);
  });
});

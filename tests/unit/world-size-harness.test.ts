import { describe, expect, it } from 'vitest';
import { resolveWorldSizeHarness } from '../../src/world/world-size-harness.js';

describe('R2 world-size comparison harness', () => {
  it('keeps normal URLs on the selected production world and only enables approved comparison sizes explicitly', () => {
    expect(resolveWorldSizeHarness('')).toMatchObject({ enabled: false, reason: 'production-default', world: { id: 'production-9600-v1', width: 9600, height: 9600 } });
    expect(resolveWorldSizeHarness('?wmWorld=12000')).toMatchObject({ enabled: false, world: { id: 'production-9600-v1', width: 9600 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=7200')).toMatchObject({ enabled: true, world: { id: 'candidate-7200-v1', width: 7200 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=9600x9600')).toMatchObject({ enabled: true, world: { id: 'candidate-9600-v1', width: 9600 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=candidate-12000-v1')).toMatchObject({ enabled: true, world: { id: 'candidate-12000-v1', width: 12000 } });
    expect(resolveWorldSizeHarness('?wmWorldHarness=1&wmWorld=8000')).toMatchObject({ enabled: false, reason: 'invalid-candidate', world: { id: 'production-9600-v1', width: 9600 } });
  });
});

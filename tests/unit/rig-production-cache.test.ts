import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('WS18 Rig production cache ownership', () => {
  it('cache-busts the live Rig runtime through the Phase C4 boot chain', () => {
    const phaseC4 = read('src/phase-c4-runtime.js');
    const index = read('index.html');

    expect(phaseC4).toContain("import { RigSystem } from './rig/rig-system.js?v=2';");
    expect(index).toContain("import('./src/phase-c4-runtime.js?v=5')");
  });
});

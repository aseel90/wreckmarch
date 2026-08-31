import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

describe('Phase C3.1 single-owner boot contract', () => {
  it('cache-busts the C3 graph and adopts a healthy legacy C3.1 state instead of applying twice', () => {
    const html = read('index.html');
    const c31 = read('src/phase-c3-frame-fix.js');
    expect(html).toContain("./src/phase-c3-runtime.js?v=8");
    expect(html).toContain("./src/phase-c3-frame-fix.js?v=6");
    expect(c31).toContain("const C31_OWNER_VERSION='single-owner-v1'");
    expect(c31).toContain('existingC31StateHealthy');
    expect(c31).toContain('adopted healthy legacy state');
    expect(c31).toContain('s.__wreckmarchC31Owner===C31_OWNER_VERSION');
    expect(c31).toContain('wreckmarchC31Owner=C31_OWNER_VERSION');
  });
});

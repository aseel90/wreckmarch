import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase C.4 socket debug isolation', () => {
  it('keeps the cyan rig goal marker behind an explicit socketdebug flag', () => {
    const source = readFileSync('src/phase-c4-runtime.js', 'utf8');
    expect(source).toContain("get('socketdebug')==='1'");
    expect(source).not.toContain("if(!window.__WM_DEBUG__) return");
  });
});

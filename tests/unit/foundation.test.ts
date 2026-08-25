import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('F0 production foundation', () => {
  it('keeps Phaser pinned to the current known-good engine during refactor', async () => {
    const pkg = JSON.parse(await read('package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies.phaser).toBe('3.90.0');
  });

  it('keeps the fast terrain and final road cleanup in the legacy boot chain', async () => {
    const html = await read('index.html');
    expect(html).toContain("./src/phase-e0-fast-terrain.js?v=1");
    expect(html).toContain("./src/phase-e1-runtime.js?v=2");
  });
});

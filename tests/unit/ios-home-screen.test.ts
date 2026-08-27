import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');

describe('iOS Home Screen standalone mode', () => {
  it('ships the Apple standalone web-app metadata', () => {
    expect(index).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
    expect(index).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
    expect(index).toContain('<meta name="apple-mobile-web-app-title" content="WRECKMARCH" />');
    expect(index).toContain('<link rel="manifest" href="./manifest.webmanifest?v=1" />');
  });

  it('uses a scoped standalone landscape manifest', () => {
    expect(manifest.id).toBe('./');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('landscape');
  });

  it('publishes the manifest in the GitHub Pages artifact', () => {
    expect(workflow).toContain('cp index.html style.css manifest.webmanifest _site/');
  });

  it('recognizes iOS navigator.standalone at runtime', () => {
    expect(index).toContain("window.navigator.standalone===true");
    expect(index).toContain("(display-mode: standalone)");
  });
});

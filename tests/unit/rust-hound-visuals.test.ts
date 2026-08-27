import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const FRAME_FILES = [
  'src/enemies/assets/rust-hound-master-run-0.js',
  'src/enemies/assets/rust-hound-master-run-1.js',
  'src/enemies/assets/rust-hound-master-run-2.js',
  'src/enemies/assets/rust-hound-master-run-3.js',
  'src/enemies/assets/rust-hound-master-run-4.js',
  'src/enemies/assets/rust-hound-master-crouch.js',
  'src/enemies/assets/rust-hound-master-pounce.js',
  'src/enemies/assets/rust-hound-master-recover.js'
];

function source(path: string) {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function decodeWebp(path: string) {
  const text = source(path);
  const match = text.match(/data:image\/webp;base64,([^']+)/);
  expect(match, `${path} must export an embedded WebP frame`).not.toBeNull();
  return Buffer.from(match![1], 'base64');
}

describe('production Rust Hound visuals', () => {
  it('ships eight baked WebP master frames with real alpha', () => {
    expect(FRAME_FILES).toHaveLength(8);
    for (const path of FRAME_FILES) {
      const bytes = decodeWebp(path);
      expect(bytes.subarray(0, 4).toString('ascii'), path).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString('ascii'), path).toBe('WEBP');
      expect(bytes.subarray(12, 16).toString('ascii'), path).toBe('VP8X');
      expect(bytes[20] & 0x10, `${path} must advertise an alpha channel`).toBe(0x10);
      expect(bytes.includes(Buffer.from('ALPH')), `${path} must contain an ALPH chunk`).toBe(true);
    }
  });

  it('keeps alpha-edge cleanup baked into assets instead of runtime recoloring', () => {
    for (const path of FRAME_FILES) {
      const text = source(path);
      expect(text).toContain('RGB edge bleed avoids dark alpha halos');
      expect(text).not.toContain('data:image/svg+xml');
    }

    const runtime = source('src/enemies/rust-hound-visuals.js');
    expect(runtime).toContain("const VISUAL_VERSION = 'production-v3-baked-alpha'");
    expect(runtime).toContain('scene.load.image(key, FRAME_SOURCES[key])');
    expect(runtime).not.toMatch(/generateTexture|createCanvas|Graphics\(|fillStyle\(|lineStyle\(/);
  });

  it('uses baked textures for run, telegraph, pounce and recovery', () => {
    const runtime = source('src/enemies/rust-hound-visuals.js');
    const behavior = source('src/enemies/behaviors/hound-pounce.js');
    const definition = source('src/enemies/definitions/rust-hound.js');

    expect(runtime).toContain("'rust-hound-crouch': RUST_HOUND_SPECIAL_MASTERS.crouch");
    expect(runtime).toContain("'rust-hound-pounce': RUST_HOUND_SPECIAL_MASTERS.pounce");
    expect(runtime).toContain("'rust-hound-land': RUST_HOUND_SPECIAL_MASTERS.recover");
    expect(behavior).toMatch(/setTexture(?:\?\.)?\('rust-hound-crouch'\)/);
    expect(behavior).toMatch(/setTexture(?:\?\.)?\('rust-hound-pounce'\)/);
    expect(definition).toContain("texture: 'rust-hound-run-0'");
    expect(definition).toContain("animation: 'rust-hound-run'");
  });

  it('installs the production Hound visuals after final legacy runtime setup', () => {
    const phase = source('src/phase-e1-runtime.js');
    const hotfix = phase.indexOf('applyFinalHotfix(s)');
    const companion = phase.indexOf('applyCompanionV3(s)');
    const director = phase.indexOf('applyRunDirector(s)');
    const visuals = phase.indexOf('await installRustHoundVisuals(s)');

    expect(hotfix).toBeGreaterThan(-1);
    expect(companion).toBeGreaterThan(hotfix);
    expect(director).toBeGreaterThan(companion);
    expect(visuals).toBeGreaterThan(director);
  });
});

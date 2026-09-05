import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';
import { listShotgunHandOverlayData, listShotgunLocomotionData, loadShotgunLocomotionArt } from '../../src/characters/shotgun-locomotion-art.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function contextStub(drawImage: any, clearRect: any) {
  return {
    imageSmoothingEnabled: true,
    globalCompositeOperation: 'source-over',
    clearRect, drawImage,
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    closePath: vi.fn(), fill: vi.fn(), translate: vi.fn(), clip: vi.fn(), rect: vi.fn()
  };
}

describe('Wrecker locomotion raster runtime', () => {
  it('exposes six full-body textures plus six baked hand-overlay textures', () => {
    const frames = listShotgunLocomotionData();
    expect(frames).toHaveLength(6);
    expect(frames.map((frame: { key: string }) => frame.key)).toEqual([
      ...SHOTGUN_RUNTIME_PRESENTATION.body.idle.map((frame: { key: string }) => frame.key),
      ...SHOTGUN_RUNTIME_PRESENTATION.body.run.map((frame: { key: string }) => frame.key)
    ]);
    expect(SHOTGUN_RUNTIME_PRESENTATION.body.run.every((frame: { generated: boolean }) => frame.generated)).toBe(true);
    const overlays = listShotgunHandOverlayData();
    expect(overlays).toHaveLength(6);
    expect(new Set(overlays.map((frame: { key: string }) => frame.key)).size).toBe(6);
  });

  it('keeps both source wrappers backed by exact 128x148 PNG rasters', () => {
    for (const frame of SHOTGUN_RUNTIME_PRESENTATION.body.idle as readonly { path: string }[]) {
      const match = read(frame.path).match(/href=["']data:image\/png;base64,([^"']+)["']/i);
      expect(match?.[1]).toBeTruthy();
      const bytes = Buffer.from(match![1], 'base64');
      expect(bytes.readUInt32BE(16)).toBe(128);
      expect(bytes.readUInt32BE(20)).toBe(148);
    }
  });

  it('decodes source rasters once and creates six body plus six hand-overlay Phaser canvas textures', async () => {
    const cache = new Map<string, string>();
    const textureKeys = new Set<string>();
    const imageSources: string[] = [];
    const drawImage = vi.fn();
    const clearRect = vi.fn();
    const refresh = vi.fn();
    const createCanvas = vi.fn((key: string, width: number, height: number) => {
      expect(width).toBe(128); expect(height).toBe(148); textureKeys.add(key);
      return { getContext: () => contextStub(drawImage, clearRect), refresh };
    });
    const completeListeners: Function[] = [];

    class FakeImage {
      width = 0; height = 0; onload: (() => void) | null = null; onerror: (() => void) | null = null;
      set src(value: string) {
        imageSources.push(value);
        const bytes = Buffer.from(value.split(',')[1] || '', 'base64');
        this.width = bytes.readUInt32BE(16); this.height = bytes.readUInt32BE(20);
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', FakeImage as any);

    const scene: any = {
      textures: { exists: (key: string) => textureKeys.has(key), remove: (key: string) => textureKeys.delete(key), createCanvas },
      cache: { text: { get: (key: string) => cache.get(key), remove: (key: string) => cache.delete(key) } },
      load: {
        text: (key: string, path: string) => cache.set(key, read(path)), on: vi.fn(), off: vi.fn(),
        once: (event: string, fn: Function) => { if (event === 'complete') completeListeners.push(fn); },
        start: () => queueMicrotask(() => completeListeners.splice(0).forEach(fn => fn()))
      }
    };

    await loadShotgunLocomotionArt(scene);

    expect(listShotgunLocomotionData().every((frame: { key: string }) => textureKeys.has(frame.key))).toBe(true);
    expect(listShotgunHandOverlayData().every((frame: { key: string }) => textureKeys.has(frame.key))).toBe(true);
    expect(imageSources).toHaveLength(2);
    expect(createCanvas).toHaveBeenCalledTimes(12);
    expect(refresh).toHaveBeenCalledTimes(12);
    expect(drawImage.mock.calls.length).toBeGreaterThan(12);
  });
});

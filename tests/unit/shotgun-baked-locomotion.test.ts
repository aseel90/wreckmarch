import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SHOTGUN_BAKED_RUN_POSES, bakeShotgunRunTextures } from '../../src/characters/shotgun-baked-locomotion.js';
import { SHOTGUN_RUNTIME_PRESENTATION } from '../../src/characters/shotgun-runtime-presentation.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function makeContext() {
  return { imageSmoothingEnabled: true, globalCompositeOperation: 'source-over', clearRect: vi.fn(), drawImage: vi.fn(),
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
    fill: vi.fn(), translate: vi.fn(), clip: vi.fn(), rect: vi.fn() };
}

describe('Wrecker baked full-body locomotion', () => {
  it('defines the approved short-step cycle as four tiny integer shifts', () => {
    expect(SHOTGUN_BAKED_RUN_POSES).toHaveLength(4);
    expect(SHOTGUN_BAKED_RUN_POSES[0]).toMatchObject({ left: { x: -3, y: 1 }, right: { x: 1, y: -1 } });
    expect(SHOTGUN_BAKED_RUN_POSES[2]).toMatchObject({ left: { x: 1, y: -1 }, right: { x: -3, y: 1 } });
    for (const pose of SHOTGUN_BAKED_RUN_POSES) {
      expect(Math.abs(pose.left.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(pose.right.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(pose.left.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(pose.right.y)).toBeLessThanOrEqual(1);
    }
  });

  it('bakes four complete 128x148 textures without creating runtime limb objects', () => {
    const contexts: any[] = [];
    const createCanvas = vi.fn((key: string, width: number, height: number) => {
      expect(width).toBe(128); expect(height).toBe(148); const ctx=makeContext(); contexts.push(ctx);
      return { getContext: () => ctx, refresh: vi.fn() };
    });
    const scene: any = { textures: { exists: vi.fn(() => false), remove: vi.fn(), createCanvas } };
    const image={ width: 128, height: 148 };
    bakeShotgunRunTextures(scene, image);
    expect(createCanvas).toHaveBeenCalledTimes(4);
    expect(createCanvas.mock.calls.map((call:any[])=>call[0])).toEqual(SHOTGUN_RUNTIME_PRESENTATION.body.run.map((frame: { key: string }) => frame.key));
    expect(contexts.every(ctx => ctx.drawImage.mock.calls.length >= 4)).toBe(true);
    expect((scene as any).add).toBeUndefined();
  });

  it('keeps production presentation free from the rejected crop rig', () => {
    const source = read('src/characters/shotgun-production-presentation.js');
    expect(source).not.toContain('shotgun-layered-locomotion');
  });
});

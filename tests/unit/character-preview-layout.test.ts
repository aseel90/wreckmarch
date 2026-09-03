import { describe, expect, it } from 'vitest';
import { getCharacterEntry } from '../../src/characters/character-registry.js';
import { getShotgunWeaponPlacement } from '../../src/characters/shotgun-aim-alignment.js';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { resolveCharacterPreviewLayout } from '../../src/ui/character-preview-layout.js';

describe('canonical character preview composition layout', () => {
  it('derives Shotgun DOM weapon placement from the same geometry as the Phaser composition', () => {
    const preview = (getCharacterEntry('shotgun') as any).preview;
    const layout = resolveCharacterPreviewLayout(preview.composition);
    const placement = getShotgunWeaponPlacement('right');
    const { width: bodyWidth, height: bodyHeight } = SHOTGUN_ART_CONTRACT.canvas;
    const { width: weaponWidth, height: weaponHeight } = SHOTGUN_PRODUCTION_ART.weapon.canvas;

    expect(layout).not.toBeNull();
    expect(layout!.stageAspectRatio).toBe(`${bodyWidth} / ${bodyHeight}`);
    expect(layout!.weaponLeftPercent).toBeCloseTo((placement.weaponTopLeft.x / bodyWidth) * 100, 8);
    expect(layout!.weaponTopPercent).toBeCloseTo((placement.weaponTopLeft.y / bodyHeight) * 100, 8);
    expect(layout!.weaponWidthPercent).toBeCloseTo((weaponWidth / bodyWidth) * 100, 8);
    expect(layout!.weaponHeightPercent).toBeCloseTo((weaponHeight / bodyHeight) * 100, 8);
  });

  it('is character-agnostic and returns null when no composition contract exists', () => {
    expect(resolveCharacterPreviewLayout(undefined)).toBeNull();
    expect((getCharacterEntry('runner') as any).preview.composition).toBeUndefined();
  });

  it('rejects incomplete or invalid composition contracts instead of inventing layout constants', () => {
    expect(() => resolveCharacterPreviewLayout({} as any)).toThrow('body canvas width');
    expect(() => resolveCharacterPreviewLayout({
      bodyCanvas: { width: 128, height: 148 },
      bodyRender: { originX: .5, originY: .52, scale: 0 },
      gripSocket: { offsetX: 10, offsetY: 3 },
      weaponCanvas: { width: 96, height: 40 },
      weaponOrigin: { x: .1875, y: .55 },
    } as any)).toThrow('body scale must be positive');
  });
});

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_ART_CONTRACT } from '../../src/characters/shotgun-art-contract.js';
import { getCharacterEntry, getCharacterDefinition, isCharacterSelectable } from '../../src/characters/character-registry.js';
const read=(path:string)=>fs.readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');

describe('WS14-C Shotgun production art assets',()=>{
  it('keeps two approved source rasters and defines four generated full-body run poses',()=>{
    expect(SHOTGUN_PRODUCTION_ART.body.idle).toHaveLength(2);
    expect(SHOTGUN_PRODUCTION_ART.body.runBake.poses).toHaveLength(4);
    expect(SHOTGUN_PRODUCTION_ART.body.runBake.source).toBe(SHOTGUN_PRODUCTION_ART.body.idle[0]);
    expect(SHOTGUN_PRODUCTION_ART.body.runBake.method).toBe('full-frame-locomotion-v1');
  });

  it('pins source wrappers to 128x148/Y=140 with one embedded raster and no baked weapon',()=>{
    for(const path of SHOTGUN_PRODUCTION_ART.body.idle){
      const svg=read(path);
      expect(svg).toContain('width="128" height="148" viewBox="0 0 128 148"');
      expect(svg).toContain('data-foot-line-y="140"');
      expect(svg).toContain('id="shotgun-body"');
      expect(svg).toContain('href="data:image/png;base64,');
      expect((svg.match(/<image\b/gi)||[])).toHaveLength(1);
      expect(svg).not.toMatch(/shotgun-weapon|muzzle-marker|grip-marker|href="https?:/i);
    }
    expect(SHOTGUN_PRODUCTION_ART.body.canvas).toEqual(SHOTGUN_ART_CONTRACT.canvas);
    expect(SHOTGUN_PRODUCTION_ART.body.footLineY).toBe(140);
  });

  it('keeps the shotgun separate with measured rear/support grip and muzzle markers',()=>{
    const svg=read(SHOTGUN_PRODUCTION_ART.weapon.path);
    expect(svg).toContain('width="96" height="40" viewBox="0 0 96 40"');
    expect(svg).toContain('data-grip-x="18" data-grip-y="22" data-support-x="51" data-support-y="25" data-muzzle-x="90" data-muzzle-y="17"');
    expect(svg).toContain('id="support-marker"');
    expect(SHOTGUN_PRODUCTION_ART.weapon.grip).toEqual({x:18,y:22});
    expect(SHOTGUN_PRODUCTION_ART.weapon.support).toEqual({x:51,y:25});
    expect(SHOTGUN_PRODUCTION_ART.weapon.muzzle).toEqual({x:90,y:17});
  });

  it('stays art-only while allowing only a locked frontend preview entry',()=>{
    expect(SHOTGUN_PRODUCTION_ART.activation.playableOnMain).toBe(false);
    expect(getCharacterEntry('shotgun')).toMatchObject({availability:'locked',definition:{id:'shotgun'}});
    expect(isCharacterSelectable('shotgun')).toBe(false);
    expect(()=>getCharacterDefinition('shotgun')).toThrow('Character is not selectable: shotgun');
    expect(read('index.html')).not.toContain('shotgun-production-art');
  });
});

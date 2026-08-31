import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { UPGRADE_CARD_ART_TEXTURES } from '../../src/upgrades/upgrade-card-art.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('canonical Upgrade System card art', () => {
  it('registers U4 custom projectile cards in the shared card-art registry', () => {
    expect(UPGRADE_CARD_ART_TEXTURES['piercing-rivets']).toBe('upgrade-icon-piercing-rivets');
    expect(UPGRADE_CARD_ART_TEXTURES.ricochet).toBe('upgrade-icon-ricochet');
  });

  it('routes custom card art through the final D1 card owner without a runtime wrapper', () => {
    const d1 = read('src/phase-d1-runtime.js');
    const art = read('src/upgrades/upgrade-card-art.js');
    const html = read('index.html');

    expect(d1).toContain("import { getUpgradeCardArtTexture, installUpgradeCardArt } from './upgrades/upgrade-card-art.js?v=2'");
    expect(d1).toContain('installUpgradeCardArt(s);installPremiumCards(s)');
    expect(d1).toContain('const customArtTexture=getUpgradeCardArtTexture(this,u.id)');
    expect(art).toContain("'piercing-rivets': 'upgrade-icon-piercing-rivets'");
    expect(art).toContain("'ricochet': 'upgrade-icon-ricochet'");
    expect(art).not.toContain('UpgradeSceneV4.card');
    expect(html).toContain("./src/phase-d1-runtime.js?v=18");
    expect(html).not.toContain('piercing-rivets-live.js');
  });
});

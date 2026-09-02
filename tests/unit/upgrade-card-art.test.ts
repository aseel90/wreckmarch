import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { UPGRADE_CARD_ART_TEXTURES } from '../../src/upgrades/upgrade-card-art.js';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('canonical Upgrade System card art', () => {
  it('registers U4 custom projectile cards in the shared card-art registry', () => {
    expect(UPGRADE_CARD_ART_TEXTURES['piercing-rivets']).toBe('upgrade-icon-piercing-rivets');
    expect(UPGRADE_CARD_ART_TEXTURES.ricochet).toBe('upgrade-icon-ricochet');
    expect(UPGRADE_CARD_ART_TEXTURES['shrapnel-impact']).toBe('upgrade-icon-shrapnel-impact');
    expect(UPGRADE_CARD_ART_TEXTURES['critical-rivet']).toBe('upgrade-icon-critical-rivet');
    expect(UPGRADE_CARD_ART_TEXTURES['field-repair']).toBe('upgrade-icon-field-repair');
    expect(UPGRADE_CARD_ART_TEXTURES['impact-shield']).toBe('upgrade-icon-impact-shield');
    expect(UPGRADE_CARD_ART_TEXTURES['explosive-rivet']).toBe('upgrade-icon-explosive-rivet');
    expect(UPGRADE_CARD_ART_TEXTURES['triple-riveter']).toBe('upgrade-icon-triple-riveter');
  });

  it('routes custom card art through the canonical U5 presentation owner without a runtime wrapper', () => {
    const d1 = read('src/phase-d1-runtime.js');
    const presentation = read('src/upgrades/upgrade-card-presentation.js');
    const art = read('src/upgrades/upgrade-card-art.js');
    const html = read('index.html');

    expect(d1).toContain("import { installUpgradeCardPresentation } from './upgrades/upgrade-card-presentation.js?v=2'");
    expect(d1).toContain("import './upgrades/upgrade-card-art.js?v=7'");
    expect(d1).toContain('installUpgradeCardPresentation(s)');
    expect(d1).not.toContain('installPremiumCards');
    expect(presentation).toContain("import { getUpgradeCardArtTexture, installUpgradeCardArt } from './upgrade-card-art.js?v=7'");
    expect(presentation).toContain('installUpgradeCardArt(gameScene)');
    expect(presentation).toContain('getUpgradeCardArtTexture(this, upgrade.id)');
    expect(art).toContain("'piercing-rivets': 'upgrade-icon-piercing-rivets'");
    expect(art).toContain("'ricochet': 'upgrade-icon-ricochet'");
    expect(art).toContain("'shrapnel-impact': 'upgrade-icon-shrapnel-impact'");
    expect(art).toContain("'critical-rivet': 'upgrade-icon-critical-rivet'");
    expect(art).toContain("'field-repair': 'upgrade-icon-field-repair'");
    expect(art).toContain("'impact-shield': 'upgrade-icon-impact-shield'");
    expect(art).toContain("'explosive-rivet': 'upgrade-icon-explosive-rivet'");
    expect(art).toContain("'triple-riveter': 'upgrade-icon-triple-riveter'");
    expect(art).toContain('function buildTripleRiveterIcon(scene)');
    expect(art).not.toContain('UpgradeSceneV4.card');
    expect(html).toContain("./src/phase-d1-runtime.js?v=27&u5=2");
    expect(html).not.toContain('piercing-rivets-live.js');
  });
});

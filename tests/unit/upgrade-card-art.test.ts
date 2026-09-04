import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('canonical upgrade card art ownership', () => {
  it('keeps upgrade card art owned by the canonical U5 presentation path', () => {
    const presentation = read('src/upgrades/upgrade-card-presentation.js');
    const art = read('src/upgrades/upgrade-card-art.js');
    const html = read('index.html');

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
    expect(html).toContain("./src/phase-d1-runtime.js?v=29&u5=3");
    expect(html).not.toContain('piercing-rivets-live.js');
  });
});

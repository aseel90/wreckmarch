import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  UPGRADE_CARD_PRESENTATION_VERSION,
  UPGRADE_CARD_VISUAL_HIERARCHY,
  getUpgradeCardFrameProfile,
  getUpgradeCardLevelPresentation
} from '../../src/upgrades/upgrade-card-presentation.js';

describe('U5 card frame hierarchy', () => {
  it('locks the first visual hierarchy pass and version', () => {
    expect(UPGRADE_CARD_PRESENTATION_VERSION).toBe('u5-level-max-v2');
    expect(UPGRADE_CARD_VISUAL_HIERARCHY).toEqual(['ART', 'NAME', 'RARITY', 'LEVEL', 'DESCRIPTION']);
  });

  it('uses progressively richer rarity frames without changing rarity mechanics', () => {
    const common = getUpgradeCardFrameProfile('COMMON');
    const rare = getUpgradeCardFrameProfile('RARE');
    const epic = getUpgradeCardFrameProfile('EPIC');
    const legendary = getUpgradeCardFrameProfile('LEGENDARY');

    expect(common).toMatchObject({ rank: 0, outerStrokeWidth: 2, sideRails: false, cornerBrackets: false, legendaryBolts: false });
    expect(rare).toMatchObject({ rank: 1, sideRails: true, cornerBrackets: false, legendaryBolts: false });
    expect(epic).toMatchObject({ rank: 2, sideRails: true, cornerBrackets: true, legendaryBolts: false });
    expect(legendary).toMatchObject({ rank: 3, outerStrokeWidth: 4, sideRails: true, cornerBrackets: true, legendaryBolts: true });
    expect(common.idleGlowAlpha).toBeLessThan(rare.idleGlowAlpha);
    expect(rare.idleGlowAlpha).toBeLessThan(epic.idleGlowAlpha);
    expect(epic.idleGlowAlpha).toBeLessThan(legendary.idleGlowAlpha);
  });

  it('formats current, next and max level without duplicating upgrade progression rules', () => {
    expect(getUpgradeCardLevelPresentation(0, 5)).toMatchObject({ currentLevel: 0, nextLevel: 1, maxLevel: 5, isNew: true, reachesMax: false, label: 'NEW • NEXT LV 1 / 5' });
    expect(getUpgradeCardLevelPresentation(2, 5)).toMatchObject({ currentLevel: 2, nextLevel: 3, maxLevel: 5, label: 'LV 2 / 5  →  LV 3 / 5' });
    expect(getUpgradeCardLevelPresentation(4, 5)).toMatchObject({ currentLevel: 4, nextLevel: 5, maxLevel: 5, reachesMax: true, label: 'LV 4 / 5  →  MAX LV 5 / 5' });
    expect(getUpgradeCardLevelPresentation(5, 5)).toMatchObject({ currentLevel: 5, nextLevel: 5, maxLevel: 5, isMaxed: true, label: 'LV 5 / 5 • MAX' });
  });

  it('moves card-renderer ownership out of Phase D1 into the canonical presentation module', () => {
    const phaseD1 = fs.readFileSync(new URL('../../src/phase-d1-runtime.js', import.meta.url), 'utf8');
    const presentation = fs.readFileSync(new URL('../../src/upgrades/upgrade-card-presentation.js', import.meta.url), 'utf8');

    expect(phaseD1).toContain("installUpgradeCardPresentation(s)");
    expect(phaseD1).toContain("./upgrades/upgrade-card-presentation.js?v=2");
    expect(phaseD1).not.toContain('function installPremiumCards');
    expect(phaseD1).not.toContain('up.card=function');
    expect(presentation).toContain('upgradeScene.card = function');
    expect(presentation).toContain('upgradeScene.refresh = function');
    expect(presentation).toContain("installUpgradeCardArt(gameScene)");
    expect(presentation).toContain("getUpgradeDefinition(upgrade.id)");
  });
});

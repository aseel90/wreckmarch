import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

// U7 regression contract: Phase C installs the canonical Upgrade Scene; later phase runtimes must not reinstall it or regain offer-selection, roll-service, lifecycle, or card-UI ownership.
describe('U7 canonical Upgrade Scene ownership', () => {
  it('keeps scene lifecycle under src/upgrades and retires legacy Phase C/C1/C2/C3/C3.1/C5 owners', () => {
    const canonical = read('src/upgrades/upgrade-scene.js');
    const cardPresentation = read('src/upgrades/upgrade-card-presentation.js');
    const c = read('src/phase-c-runtime.js');
    const c1 = read('src/phase-c1-runtime.js');
    const c2 = read('src/phase-c2-runtime.js');
    const c3 = read('src/phase-c3-runtime.js');
    const c31 = read('src/phase-c3-frame-fix.js');
    const c5 = read('src/phase-c5-runtime.js');
    const d1 = read('src/phase-d1-runtime.js');

    expect(canonical).toContain("class UpgradeSceneV4 extends Phaser.Scene");
    expect(canonical).toContain("scene.launch('UpgradeSceneV4'");
    expect(canonical).toContain('export async function installUpgradeScene(gameScene)');
    expect(canonical).toContain('Phaser.Core.Events.POST_STEP');
    expect(canonical).toContain('gameScene.openUpgradeCards = function()');
    expect(canonical).toContain('gameScene.closeUpgradeCards = function()');
    expect(canonical).toContain("gameScene.__upgradeSceneOwner = 'src/upgrades/upgrade-scene.js'");
    expect(canonical).toContain("gameScene.scene.add('UpgradeSceneV4', UpgradeSceneV4, false)");
    expect(canonical).not.toContain('gameScene.game.scene.add');
    expect(canonical).not.toContain('gameScene.game.scene.getScene');

    expect(c).toContain("import { installUpgradeScene } from './upgrades/upgrade-scene.js?v=1';");
    expect(c).toContain('await installUpgradeScene(scene);');
    expect(c).not.toContain('function createUpgradePool');
    expect(c).not.toContain('function makeCard');
    expect(c).not.toContain('function installUpgradeCards');
    expect(c).not.toContain('createActiveUpgradeOfferChoices');
    expect(c).not.toContain('rollUpgradeChoices');
    expect(c).not.toContain('openUpgradeCards = function');
    expect(c).not.toContain('closeUpgradeCards = function');

    expect(c1).not.toContain('installUpgradeScene');
    for (const legacy of [c1, c2, c3, c31, c5]) {
      expect(legacy).not.toMatch(/class UpgradeScene(?:V2|V3|V4)? extends Phaser\.Scene/);
      expect(legacy).not.toContain('.launch =');
      expect(legacy).not.toContain('openUpgradeCards = function');
      expect(legacy).not.toContain('closeUpgradeCards = function');
      expect(legacy).not.toContain('createActiveUpgradeOfferChoices');
      expect(legacy).not.toContain('rollUpgradeChoices');
      expect(legacy).not.toContain("getScene('UpgradeSceneV3')");
    }
    expect(c2).not.toContain('c2-upgrade-art');
    expect(c3).toContain("s.__upgradeSceneOwner==='src/upgrades/upgrade-scene.js'");
    expect(c31).toContain("s.__upgradeSceneOwner==='src/upgrades/upgrade-scene.js'");
    expect(c31).not.toContain('fixCards');
    expect(c5).not.toContain('installCards(s)');
    expect(cardPresentation).toContain("getScene('UpgradeSceneV4')");
    expect(d1).toContain('installUpgradeCardPresentation');
    expect(d1).not.toContain("getScene('UpgradeSceneV4')");
  });
});

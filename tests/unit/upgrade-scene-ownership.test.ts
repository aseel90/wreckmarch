import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

// U7 regression contract: legacy phases may consume, but must not own, the upgrade scene lifecycle.
// Clean PR validation keeps runtime ownership and card presentation as separate canonical boundaries.
describe('U7 canonical Upgrade Scene ownership', () => {
  it('keeps scene lifecycle under src/upgrades and retires C1/C2/C3/C5 scene wrappers', () => {
    const canonical = read('src/upgrades/upgrade-scene.js');
    const cardPresentation = read('src/upgrades/upgrade-card-presentation.js');
    const c1 = read('src/phase-c1-runtime.js');
    const c2 = read('src/phase-c2-runtime.js');
    const c3 = read('src/phase-c3-runtime.js');
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

    expect(c1).toContain("import { installUpgradeScene } from './upgrades/upgrade-scene.js?v=1';");
    expect(c1).toContain('await installUpgradeScene(scene);');
    for (const legacy of [c1, c2, c3, c5]) {
      expect(legacy).not.toMatch(/class UpgradeScene(?:V2|V3|V4)? extends Phaser\.Scene/);
      expect(legacy).not.toContain('.launch =');
      expect(legacy).not.toContain('openUpgradeCards = function');
      expect(legacy).not.toContain('closeUpgradeCards = function');
    }
    expect(c2).not.toContain('c2-upgrade-art');
    expect(c3).not.toContain("const v3=s.game.scene.getScene('UpgradeSceneV3')");
    expect(c3).toContain("s.__upgradeSceneOwner==='src/upgrades/upgrade-scene.js'");
    expect(c5).not.toContain('installCards(s)');
    expect(cardPresentation).toContain("getScene('UpgradeSceneV4')");
    expect(d1).toContain('installUpgradeCardPresentation');
    expect(d1).not.toContain("getScene('UpgradeSceneV4')");
  });
});
